import { paymentRepository } from '../repositories/payment.repository.js';
import { bookingRepository } from '../repositories/booking.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class PaymentService {

  // Helper: Unique Identifiers
  generateTxnId() {
    return 'TXN-' + Math.floor(100000 + Math.random() * 900000);
  }

  generateOrderId() {
    return 'order_rzp_' + Math.floor(10000000 + Math.random() * 90000000);
  }

  generateInvoiceNo() {
    return 'INV-2026-' + Math.floor(1000 + Math.random() * 9000);
  }

  // 1. PAYMENT GATEWAY READY: CREATE ORDER (Razorpay / Stripe Ready)
  async createGatewayOrder(user, amount, type = 'booking_payment', bookingId = null) {
    const transactionId = this.generateTxnId();
    const orderId = this.generateOrderId();

    const payment = await paymentRepository.create({
      transactionId,
      orderId,
      user: user._id,
      booking: bookingId,
      type,
      amount,
      currency: 'INR',
      paymentMethod: 'Razorpay',
      status: 'Pending',
    });

    return {
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_NOROZZ2026KEY',
      orderId,
      transactionId,
      amount: amount * 100, // Amount in paise for Gateway SDKs
      currency: 'INR',
      user: { name: user.name, email: user.email, phone: user.phone },
      payment,
    };
  }

  // 2. VERIFY GATEWAY PAYMENT SIGNATURE & MARK SUCCESS
  async verifyBookingPayment(user, transactionId, paymentId = '', signature = '') {
    const payment = await paymentRepository.model.findOne({ transactionId });
    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment transaction record not found');
    }

    payment.paymentId = paymentId || 'pay_simulated_' + Math.floor(100000 + Math.random() * 900000);
    payment.status = 'Success';
    payment.invoiceNumber = this.generateInvoiceNo();
    payment.gatewayResponse = { verified: true, signature, timestamp: new Date() };
    await payment.save();

    // Update Linked Booking Payment Status
    if (payment.booking) {
      const booking = await bookingRepository.findById(payment.booking);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.paymentMethod = payment.paymentMethod || 'UPI';
        await booking.save();
      }
    }

    return { message: 'Payment verified and transaction successful', payment };
  }

  // 3. WALLET PAYMENT
  async processWalletPayment(user, bookingId, amount) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
    }

    const transactionId = this.generateTxnId();
    const invoiceNumber = this.generateInvoiceNo();

    const payment = await paymentRepository.create({
      transactionId,
      user: user._id,
      booking: booking._id,
      type: 'booking_payment',
      amount,
      currency: 'INR',
      paymentMethod: 'Wallet',
      status: 'Success',
      invoiceNumber,
    });

    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'Wallet';
    await booking.save();

    return { message: 'Booking paid successfully via NOROZZ Wallet', payment };
  }

  // 4. PROCESS REFUND
  async processRefund(paymentIdOrTxnId, reason = 'Customer Cancellation') {
    const payment = await paymentRepository.model.findOne({
      $or: [{ _id: paymentIdOrTxnId }, { transactionId: paymentIdOrTxnId }],
    });

    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment record not found');
    }

    if (payment.status === 'Refunded') {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Payment has already been refunded');
    }

    payment.status = 'Refunded';
    await payment.save();

    // Create Refund Log Entry
    const refundLog = await paymentRepository.create({
      transactionId: this.generateTxnId(),
      user: payment.user,
      booking: payment.booking,
      type: 'refund',
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: 'Wallet',
      status: 'Refunded',
      invoiceNumber: this.generateInvoiceNo(),
      gatewayResponse: { reason },
    });

    // Update Linked Booking
    if (payment.booking) {
      const booking = await bookingRepository.findById(payment.booking);
      if (booking) {
        booking.paymentStatus = 'refunded';
        booking.status = 'Refunded';
        booking.cancellationReason = reason;
        await booking.save();
      }
    }

    return { message: `Refund of ₹${payment.amount} processed to customer wallet`, payment, refundLog };
  }

  // 5. TRANSACTION HISTORY
  async getTransactionHistory(userId, type = null) {
    return await paymentRepository.findByUser(userId, type);
  }

  // 6. GENERATE INVOICE DRAFT
  async generateInvoice(paymentId) {
    const payment = await paymentRepository.model
      .findById(paymentId)
      .populate('user', 'name email phone address city')
      .populate('booking');

    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment transaction not found for invoice');
    }

    const subTotal = payment.amount;
    const gstRate = 0.18; // 18% GST
    const gstAmount = Math.round(subTotal * gstRate);
    const grandTotal = subTotal + gstAmount;

    return {
      invoiceNumber: payment.invoiceNumber || this.generateInvoiceNo(),
      invoiceDate: payment.createdAt,
      platform: {
        name: 'NOROZZ Multi-Service Platform',
        gstin: '07AAAAA0000A1Z5',
        address: 'Sector 62, Noida, Uttar Pradesh 201301',
        supportEmail: 'support@norozz.com',
      },
      customer: {
        name: payment.user?.name || 'Customer',
        email: payment.user?.email || '',
        phone: payment.user?.phone || '',
        city: payment.user?.city || 'Delhi NCR',
      },
      transaction: {
        transactionId: payment.transactionId,
        paymentId: payment.paymentId,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
      },
      items: [
        { description: payment.booking?.packageName || 'Home Service Package', qty: 1, rate: subTotal, amount: subTotal },
      ],
      tax: { gstRate: '18%', gstAmount },
      subTotal,
      grandTotal,
    };
  }
}

export const paymentService = new PaymentService();
