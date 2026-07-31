import mongoose from 'mongoose';
import { bookingRepository } from '../repositories/booking.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { serviceRepository } from '../repositories/service.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ROLES } from '../constants/roles.constant.js';

export class BookingService {

  // Helper: Unique Booking ID Generator
  generateBookingId() {
    return 'UC-' + Math.floor(10000 + Math.random() * 90000);
  }

  // 1. CREATE BOOKING (Customer Flow: Step 1 to 7)
  async createBooking(customerUser, bookingData) {
    // Validate Category & Service
    const category = await categoryRepository.findById(bookingData.category);
    if (!category || category.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Selected category not found');
    }

    const service = await serviceRepository.findById(bookingData.service);
    if (!service || service.status === 'deleted') {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Selected service not found');
    }

    const bookingId = this.generateBookingId();
    const city = bookingData.city || customerUser.city || 'Delhi NCR';

    // Mongoose Session Transaction
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null; // Fallback if standalone MongoDB without replica set
    }

    try {
      const newBooking = await bookingRepository.create({
        bookingId,
        customer: customerUser._id,
        category: category._id,
        service: service._id,
        packageName: bookingData.packageName || service.name,
        address: {
          title: bookingData.addressTitle || 'Home',
          addressLine: bookingData.addressLine,
          city,
          pincode: bookingData.pincode || '110001',
        },
        city,
        bookingDate: bookingData.bookingDate || new Date(),
        timeSlot: bookingData.timeSlot || '04:30 PM - 05:30 PM',
        amount: bookingData.amount || service.finalPrice || 599,
        paymentMethod: bookingData.paymentMethod || 'UPI',
        paymentStatus: 'pending',
        status: 'Pending',
      });

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return await newBooking.populate([
        { path: 'category', select: 'name slug image' },
        { path: 'service', select: 'name slug price finalPrice duration' },
        { path: 'customer', select: 'name email phone' },
      ]);
    } catch (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  // 2. PROCESS PAYMENT (Pending -> Payment Paid)
  async processPayment(bookingId, paymentMethod = 'UPI') {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
    }

    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod;
    await booking.save();

    return { message: 'Payment processed successfully', paymentStatus: 'paid', booking };
  }

  // 3. ASSIGN PARTNER (Pending/Payment Paid -> Assigned)
  async assignPartner(bookingId, partnerId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');

    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Selected user is not a valid Partner');
    }

    booking.partner = partner._id;
    booking.status = 'Assigned';
    await booking.save();

    return { message: `Booking assigned to partner '${partner.name}'`, status: 'Assigned', booking };
  }

  // 4. PARTNER ACCEPTS JOB (Assigned -> Accepted)
  async acceptBooking(bookingId, partnerUser) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking || String(booking.partner) !== String(partnerUser._id)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to this booking');
    }

    booking.status = 'Accepted';
    await booking.save();

    return { message: 'Job accepted successfully', status: 'Accepted', booking };
  }

  // 5. PARTNER ON THE WAY (Accepted -> On The Way)
  async onTheWayBooking(bookingId, partnerUser) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking || String(booking.partner) !== String(partnerUser._id)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to this booking');
    }

    booking.status = 'On The Way';
    await booking.save();

    return { message: 'Partner status updated to ON THE WAY', status: 'On The Way', booking };
  }

  // 6. PARTNER STARTS JOB (On The Way -> Started)
  async startBooking(bookingId, partnerUser) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking || String(booking.partner) !== String(partnerUser._id)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to this booking');
    }

    booking.status = 'Started';
    await booking.save();

    return { message: 'Service started successfully', status: 'Started', booking };
  }

  // 7. PARTNER COMPLETES JOB (Started -> Completed)
  async completeBooking(bookingId, partnerUser) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking || String(booking.partner) !== String(partnerUser._id)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not assigned to this booking');
    }

    booking.status = 'Completed';
    booking.paymentStatus = 'paid';
    await booking.save();

    return { message: 'Service completed successfully!', status: 'Completed', booking };
  }

  // 8. CUSTOMER SUBMITS RATING & REVIEW (Completed -> Rating Submitted)
  async rateBooking(bookingId, customerUser, rating, reviewComment) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking || String(booking.customer) !== String(customerUser._id)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You can only rate your own bookings');
    }

    if (booking.status !== 'Completed') {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Service must be completed before rating');
    }

    booking.rating = rating;
    booking.reviewComment = reviewComment || '';
    await booking.save();

    return { message: 'Thank you for your rating & feedback!', rating, reviewComment, booking };
  }

  // 9. CANCEL BOOKING & REFUND (Pending/Assigned -> Cancelled / Refunded)
  async cancelBooking(bookingId, user, reason) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');

    if (booking.status === 'Completed') {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Completed bookings cannot be cancelled');
    }

    const isPaid = booking.paymentStatus === 'paid';
    booking.status = isPaid ? 'Refunded' : 'Cancelled';
    if (isPaid) booking.paymentStatus = 'refunded';
    booking.cancellationReason = reason || 'Customer/Admin Cancellation';
    await booking.save();

    return {
      message: `Booking ${booking.status.toLowerCase()} successfully`,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      booking,
    };
  }

  // 10. CUSTOMER BOOKINGS LIST
  async getCustomerBookings(customerId) {
    return await bookingRepository.model
      .find({ customer: customerId })
      .populate('category', 'name slug image')
      .populate('service', 'name slug price finalPrice duration')
      .populate('partner', 'name agencyName phone profileImage')
      .sort({ createdAt: -1 });
  }

  // 11. GET BOOKING DETAILS BY ID
  async getBookingById(bookingId) {
    const booking = await bookingRepository.model
      .findById(bookingId)
      .populate('category', 'name slug image')
      .populate('service', 'name slug price finalPrice duration')
      .populate('customer', 'name email phone')
      .populate('partner', 'name agencyName phone profileImage');

    if (!booking) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
    return booking;
  }
}

export const bookingService = new BookingService();
