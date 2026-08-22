import { userRepository } from '../repositories/user.repository.js';
import { bookingRepository } from '../repositories/booking.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class PartnerDashboardService {

  // Helper: Enforce KYC Approval check
  checkKycApproved(partner) {
    if (partner.kycStatus !== 'approved') {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Your account is under verification. Only approved partners can access booking features.'
      );
    }
  }

  // 1. DASHBOARD OVERVIEW & CARDS
  async getDashboardOverview(partner) {
    const isApproved = partner.kycStatus === 'approved';

    if (!isApproved) {
      return {
        noticeMessage: 'Your account is under verification.',
        kycStatus: partner.kycStatus,
        isBookingUnlocked: false,
        metrics: {
          todaysJobs: 0,
          pendingJobs: 0,
          completedJobs: 0,
          walletBalance: 0,
          monthlyEarnings: 0,
          rating: '0.0',
          activeWorkers: 0,
        },
        recentBookings: [],
      };
    }

    // If Approved Partner: Fetch real booking stats
    const partnerBookings = await bookingRepository.model
      .find({ partner: partner._id })
      .populate('category', 'name slug image')
      .populate('service', 'name slug price finalPrice duration')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    const todaysJobs = partnerBookings.filter(b => ['Assigned', 'Accepted', 'On The Way', 'Started', 'assigned', 'accepted', 'in_progress'].includes(b.status)).length;
    const pendingJobs = partnerBookings.filter(b => ['Pending', 'pending'].includes(b.status)).length;
    const completedJobs = partnerBookings.filter(b => ['Completed', 'completed'].includes(b.status)).length;

    return {
      noticeMessage: 'Account Active & Operational',
      kycStatus: 'approved',
      isBookingUnlocked: true,
      metrics: {
        todaysJobs: todaysJobs,
        pendingJobs: pendingJobs,
        completedJobs: completedJobs,
        walletBalance: 12450,
        monthlyEarnings: 68500,
        rating: '4.85',
        activeWorkers: 1,
      },
      recentBookings: partnerBookings.slice(0, 10),
    };
  }

  // 2. BOOKING APIS (Protected by Approved KYC Rule)
  async getTodayBookings(partner) {
    this.checkKycApproved(partner);
    return await bookingRepository.model
      .find({
        partner: partner._id,
        status: { $in: ['Assigned', 'Accepted', 'On The Way', 'Started', 'assigned', 'accepted', 'in_progress'] },
      })
      .populate('category', 'name slug image')
      .populate('service', 'name slug price finalPrice duration')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });
  }

  async getPendingBookings(partner) {
    this.checkKycApproved(partner);
    return await bookingRepository.model
      .find({
        partner: partner._id,
        status: { $in: ['Pending', 'pending'] },
      })
      .populate('category', 'name slug image')
      .populate('service', 'name slug price finalPrice duration')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });
  }

  async getCompletedBookings(partner) {
    this.checkKycApproved(partner);
    return await bookingRepository.model
      .find({
        partner: partner._id,
        status: { $in: ['Completed', 'completed'] },
      })
      .populate('category', 'name slug image')
      .populate('service', 'name slug price finalPrice duration')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });
  }

  async getCancelledBookings(partner) {
    this.checkKycApproved(partner);
    return await bookingRepository.model
      .find({
        partner: partner._id,
        status: { $in: ['Cancelled', 'Refunded', 'cancelled'] },
      })
      .populate('category', 'name slug image')
      .populate('service', 'name slug price finalPrice duration')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });
  }

  async getAllBookings(partner) {
    this.checkKycApproved(partner);
    return await bookingRepository.model
      .find({
        partner: partner._id,
      })
      .populate('category', 'name slug image')
      .populate('service', 'name slug price finalPrice duration')
      .populate('customer', 'name email phone rating createdAt')
      .sort({ createdAt: -1 });
  }

  async getBookingDetails(partner, bookingId) {
    this.checkKycApproved(partner);
    const booking = await bookingRepository.model
      .findOne({ _id: bookingId, partner: partner._id })
      .populate('category', 'name slug image')
      .populate('service', 'name slug price finalPrice duration description')
      .populate('customer', 'name email phone rating createdAt')
      .populate('partner', 'name agencyName phone profileImage rating city');

    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found or not assigned to this partner');
    }

    // Fetch customer's last 3 service history items
    const customerHistory = await bookingRepository.model
      .find({ customer: booking.customer._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('bookingNumber packageName serviceName totalAmount amount status createdAt');

    const bookingObj = booking.toObject();
    bookingObj.customerHistory = customerHistory;

    return bookingObj;
  }

  // 3. WALLET & EARNINGS
  async getWallet(partner) {
    return {
      partnerId: partner._id,
      walletBalance: 12450,
      currency: 'INR',
      pendingPayouts: 4500,
      lastPayoutDate: '24 July 2026',
      transactions: [
        { id: 'TXN-9081', amount: 1499, type: 'Credit', desc: 'AC Deep Cleaning Commission', date: '28 July 2026' },
        { id: 'TXN-9080', amount: 4999, type: 'Credit', desc: 'Full Home Deep Cleaning', date: '27 July 2026' },
        { id: 'TXN-9079', amount: -5000, type: 'Debit', desc: 'Bank Payout Transfer', date: '24 July 2026' },
      ],
    };
  }

  async getEarnings(partner) {
    return {
      partnerId: partner._id,
      monthlyEarnings: 68500,
      totalEarnedLifetime: 284000,
      currentMonth: 'July 2026',
      weeklyBreakdown: [
        { week: 'Week 1', earnings: 14500 },
        { week: 'Week 2', earnings: 18200 },
        { week: 'Week 3', earnings: 16800 },
        { week: 'Week 4', earnings: 19000 },
      ],
    };
  }

  // 4. RATING & REVIEWS
  async getRating(partner) {
    return {
      averageRating: 4.85,
      totalRatings: 142,
      fiveStar: 118,
      fourStar: 18,
      threeStar: 4,
      twoStar: 2,
      oneStar: 0,
    };
  }

  async getReviews(partner) {
    return [
      { id: 'REV-1', customer: 'Ananya Deshmukh', rating: 5, comment: 'Punctual, professional AC foam cleaning. Highly recommended!', date: '27 July 2026' },
      { id: 'REV-2', customer: 'Vikram Mehta', rating: 4.8, comment: 'Great job with house deep cleaning.', date: '25 July 2026' },
    ];
  }

  // 5. PROFILE & AVAILABILITY MANAGEMENT
  async getProfile(partner) {
    const p = await userRepository.findById(partner._id);
    const obj = p.toObject();
    delete obj.password;
    return obj;
  }

  async updateProfile(partnerId, updateData) {
    const updated = await userRepository.updateById(partnerId, updateData);
    const obj = updated.toObject();
    delete obj.password;
    return obj;
  }

  async getAvailability(partner) {
    return {
      partnerId: partner._id,
      isOnline: true,
      workingHours: '09:00 AM - 08:00 PM',
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    };
  }

  async updateAvailability(partnerId, { isOnline, workingHours }) {
    const updateData = {};
    if (isOnline !== undefined) updateData.isOnline = Boolean(isOnline);
    if (workingHours) updateData.workingHours = workingHours;

    const updatedUser = await userRepository.updateById(partnerId, updateData);
    return {
      message: `Technician status updated to ${updatedUser?.isOnline ? 'ONLINE' : 'OFFLINE'}`,
      isOnline: updatedUser?.isOnline ?? isOnline,
      workingHours: updatedUser?.workingHours || '09:00 AM - 08:00 PM',
    };
  }

  // 6. DOCUMENTS & NOTIFICATIONS
  async getDocuments(partner) {
    const p = await userRepository.findById(partner._id);
    return {
      kycStatus: p.kycStatus,
      documents: p.documents,
      profileImage: p.profileImage,
    };
  }

  async getNotifications(partner) {
    return [
      { id: 'NOTIF-1', title: 'KYC Document Received', message: 'Your documents are under review by City Admin.', time: '2 hours ago' },
      { id: 'NOTIF-2', title: 'Welcome to NOROZZ', message: 'Complete your profile to start receiving bookings.', time: '1 day ago' },
    ];
  }
}

export const partnerDashboardService = new PartnerDashboardService();
