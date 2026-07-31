import { userRepository } from '../repositories/user.repository.js';
import { otpRepository } from '../repositories/otp.repository.js';
import { verifyRefreshToken } from '../helpers/jwt.helper.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ROLES } from '../constants/roles.constant.js';

export class CustomerAuthService {

  // Token Generator Helper
  async generateTokens(user) {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return { user: userObj, accessToken, refreshToken };
  }

  // 1. SIGNUP
  async signup(customerData) {
    const existing = await userRepository.findByEmail(customerData.email);
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Customer account with this email already exists');
    }

    const newCustomer = await userRepository.create({
      ...customerData,
      role: ROLES.CUSTOMER,
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    return await this.generateTokens(newCustomer);
  }

  // 2. PASSWORD LOGIN
  async login(email, password) {
    const user = await userRepository.findByEmail(email, true);
    if (!user || user.role !== ROLES.CUSTOMER) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid customer credentials');
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid customer credentials');
    }

    if (user.status === 'blocked' || user.status === 'disabled') {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Customer account is blocked/disabled');
    }

    return await this.generateTokens(user);
  }

  // 3. OTP LOGIN (REQUEST & VERIFY)
  async requestOtpLogin(emailOrPhone) {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await otpRepository.create({
      emailOrPhone,
      otp: generatedOtp,
      type: 'login',
      expiresAt,
    });

    return { emailOrPhone, otp: generatedOtp, message: 'OTP sent successfully for instant login' };
  }

  async verifyOtpLogin(emailOrPhone, otp) {
    const validOtp = await otpRepository.findLatestValidOtp(emailOrPhone, 'login');
    if (!validOtp || validOtp.otp !== otp) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired OTP code');
    }

    let user = await userRepository.findByEmail(emailOrPhone);
    if (!user) {
      // Auto-create Customer account if new phone/email
      user = await userRepository.create({
        name: emailOrPhone.split('@')[0] || 'Customer User',
        email: emailOrPhone.includes('@') ? emailOrPhone : `${emailOrPhone}@norozz.com`,
        phone: !emailOrPhone.includes('@') ? emailOrPhone : '',
        password: 'AutoOtpPassword123!',
        role: ROLES.CUSTOMER,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      });
    }

    await otpRepository.markAsVerified(validOtp._id);

    return await this.generateTokens(user);
  }

  // 4. FORGOT & RESET PASSWORD
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.role !== ROLES.CUSTOMER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No customer account found with this email');
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await otpRepository.create({
      emailOrPhone: email,
      otp: generatedOtp,
      type: 'resetPassword',
      expiresAt,
    });

    return { email, otp: generatedOtp, message: 'Password reset OTP sent to registered email' };
  }

  async resetPassword(email, otp, newPassword) {
    const validOtp = await otpRepository.findLatestValidOtp(email, 'resetPassword');
    if (!validOtp || validOtp.otp !== otp) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired OTP code');
    }

    const user = await userRepository.findByEmail(email);
    if (!user || user.role !== ROLES.CUSTOMER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Customer user not found');
    }

    user.password = newPassword;
    await user.save();
    await otpRepository.markAsVerified(validOtp._id);

    return { message: 'Customer password reset successfully' };
  }

  // 5. REFRESH TOKEN
  async refreshToken(token) {
    if (!token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token missing');
    }

    try {
      const decoded = verifyRefreshToken(token);
      const user = await userRepository.findById(decoded.id, '+refreshToken');

      if (!user || user.refreshToken !== token) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token');
      }

      const newAccessToken = user.generateAccessToken();
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Expired or invalid refresh token');
    }
  }

  // 6. PROFILE & ADDRESS CRUD
  async getProfile(customerId) {
    const user = await userRepository.findById(customerId);
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }

  async updateProfile(customerId, updateData) {
    const updated = await userRepository.updateById(customerId, updateData);
    const obj = updated.toObject();
    delete obj.password;
    return obj;
  }

  async addAddress(customerId, addressData) {
    const user = await userRepository.findById(customerId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Customer not found');

    if (addressData.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    user.addresses.push(addressData);
    await user.save();

    return { message: 'Address added successfully', addresses: user.addresses };
  }

  async getAddresses(customerId) {
    const user = await userRepository.findById(customerId);
    return user.addresses || [];
  }

  async updateAddress(customerId, addressId, updateData) {
    const user = await userRepository.findById(customerId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Customer not found');

    const addr = user.addresses.id(addressId);
    if (!addr) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Address record not found');

    if (updateData.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    Object.assign(addr, updateData);
    await user.save();

    return { message: 'Address updated successfully', addresses: user.addresses };
  }

  async deleteAddress(customerId, addressId) {
    const user = await userRepository.findById(customerId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Customer not found');

    user.addresses.pull({ _id: addressId });
    await user.save();

    return { message: 'Address deleted successfully', addresses: user.addresses };
  }
}

export const customerAuthService = new CustomerAuthService();
