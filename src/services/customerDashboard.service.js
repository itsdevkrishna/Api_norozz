import { userRepository } from '../repositories/user.repository.js';
import { bookingRepository } from '../repositories/booking.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { serviceRepository } from '../repositories/service.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class CustomerDashboardService {

  // 1. MOBILE HOME FEED
  async getDashboardOverview(customer) {
    const user = await userRepository.findById(customer._id);
    const recentBookings = await bookingRepository.find({ customer: customer._id }, '', { createdAt: -1 });

    return {
      banners: [
        { id: 1, title: 'AC Jet Deep Cleaning', discount: 'Flat 50% OFF', code: 'SUMMER50', bg: 'linear-gradient(135deg, #2563eb, #7c3aed)' },
        { id: 2, title: 'Full House Deep Clean', discount: 'Save ₹500 Instant', code: 'CLEAN500', bg: 'linear-gradient(135deg, #059669, #10b981)' },
      ],
      categories: await this.getCategories(),
      popularServices: await this.getPopularServices(),
      featuredServices: await this.getFeaturedServices(),
      offers: await this.getOffers(),
      walletBalance: 450,
      favoriteServices: user.favoriteServices || [],
      savedAddresses: user.addresses || [],
      recentBookings: recentBookings.slice(0, 3),
    };
  }

  // 2. CATEGORIES & SERVICES (Real Database Data Created By Admin)
  async getCategories() {
    return await categoryRepository.findActiveCategories();
  }

  async getPopularServices() {
    return await serviceRepository.findActiveServices();
  }

  async getFeaturedServices() {
    return await serviceRepository.findActiveServices();
  }

  async getOffers() {
    return [
      { code: 'FIRST50', title: '50% OFF First Order', minAmount: 299, discount: 'Up to ₹150' },
      { code: 'SUMMERAC', title: 'Flat ₹200 OFF on AC Foam Jet', minAmount: 599, discount: '₹200 Instant' },
      { code: 'NOROZZPLUS', title: 'Free Safety & Inspection Fee', minAmount: 0, discount: '₹49 Waiver' },
    ];
  }

  // 3. WALLET, NOTIFICATIONS & REVIEWS
  async getWallet(customer) {
    return {
      customerId: customer._id,
      balance: 450,
      currency: 'INR',
      transactions: [
        { id: 'WAL-1', amount: 100, type: 'Credit', desc: 'Welcome Bonus Cash', date: '28 July 2026' },
        { id: 'WAL-2', amount: 350, type: 'Credit', desc: 'Referral Cash Bonus', date: '20 July 2026' },
      ],
    };
  }

  async getNotifications() {
    return [
      { id: 'NOTIF-1', title: 'Technician Assigned', message: 'Rajesh Kumar has been assigned for your AC Foam Jet Deep Cleaning.', time: '10 mins ago' },
      { id: 'NOTIF-2', title: 'Exclusive Deal', message: 'Use code SUMMERAC for ₹200 OFF on AC servicing today!', time: '3 hours ago' },
    ];
  }

  async getReviews(customer) {
    return [
      { id: 'REV-101', service: 'Full Home Deep Cleaning 3BHK', rating: 5, comment: 'CleanPro team did a fantastic job cleaning my balcony and kitchen!', date: '12 June 2026' },
    ];
  }

  // 4. FAVORITE SERVICES TOGGLE
  async getFavorites(customer) {
    const user = await userRepository.findById(customer._id);
    return user.favoriteServices || [];
  }

  async toggleFavorite(customer, serviceName) {
    const user = await userRepository.findById(customer._id);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Customer not found');

    const index = user.favoriteServices.indexOf(serviceName);
    let message = '';

    if (index > -1) {
      user.favoriteServices.splice(index, 1);
      message = `Removed '${serviceName}' from favorites`;
    } else {
      user.favoriteServices.push(serviceName);
      message = `Added '${serviceName}' to favorites`;
    }

    await user.save();
    return { message, favorites: user.favoriteServices };
  }

  // 5. BOOKING HISTORY FILTERS
  async getBookingHistory(customer) {
    return await bookingRepository.find({ customer: customer._id }, '', { createdAt: -1 });
  }

  async getUpcomingBookings(customer) {
    return await bookingRepository.find(
      { customer: customer._id, status: { $in: ['pending', 'assigned', 'in_progress'] } },
      '',
      { createdAt: -1 }
    );
  }

  async getCompletedBookings(customer) {
    return await bookingRepository.find(
      { customer: customer._id, status: 'completed' },
      '',
      { createdAt: -1 }
    );
  }

  async getCancelledBookings(customer) {
    return await bookingRepository.find(
      { customer: customer._id, status: 'cancelled' },
      '',
      { createdAt: -1 }
    );
  }
}

export const customerDashboardService = new CustomerDashboardService();
