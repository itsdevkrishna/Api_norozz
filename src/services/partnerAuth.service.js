import { userRepository } from '../repositories/user.repository.js';
import { otpRepository } from '../repositories/otp.repository.js';
import { storageService } from './storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ROLES } from '../constants/roles.constant.js';

export class PartnerAuthService {

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

  // 1. PARTNER SIGNUP (Default status: PENDING KYC)
  async signup(partnerData) {
    const existing = await userRepository.findByEmail(partnerData.email);
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Partner account with this email already exists');
    }

    const newPartner = await userRepository.create({
      ...partnerData,
      role: ROLES.PARTNER,
      kycStatus: 'pending', // Default status: Pending until City Admin approves
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true,
      documents: {
        aadhaarDoc: '',
        panDoc: '',
        gstDoc: '',
        bankPassbookDoc: '',
      },
    });

    return await this.generateTokens(newPartner);
  }

  // 2. PARTNER LOGIN
  async login(email, password) {
    const user = await userRepository.findByEmail(email, true);
    if (!user || user.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid partner credentials');
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid partner credentials');
    }

    if (user.status === 'blocked' || user.status === 'disabled') {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Partner account is suspended/blocked');
    }

    return await this.generateTokens(user);
  }

  // 3. FORGOT PASSWORD
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No partner account found with this email');
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

  // 4. RESET PASSWORD
  async resetPassword(email, otp, newPassword) {
    const validOtp = await otpRepository.findLatestValidOtp(email, 'resetPassword');
    if (!validOtp || validOtp.otp !== otp) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired OTP code');
    }

    const user = await userRepository.findByEmail(email);
    if (!user || user.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner user not found');
    }

    user.password = newPassword;
    await user.save();
    await otpRepository.markAsVerified(validOtp._id);

    return { message: 'Partner password reset successfully' };
  }

  // 5. UPLOAD KYC DOCUMENTS (Aadhaar, PAN, GST, Bank Passbook, Profile Image)
  async uploadDocuments(partnerId, files) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    const uploadedDocs = { ...partner.documents.toObject() };

    // Upload files to Cloudinary / Storage
    if (files.aadhaarDoc?.[0]) {
      const res = await storageService.uploadToCloudinary(files.aadhaarDoc[0].buffer, 'norozz_kyc/aadhaar');
      uploadedDocs.aadhaarDoc = res.secure_url || res.url || 'uploaded_aadhaar.pdf';
    }
    if (files.panDoc?.[0]) {
      const res = await storageService.uploadToCloudinary(files.panDoc[0].buffer, 'norozz_kyc/pan');
      uploadedDocs.panDoc = res.secure_url || res.url || 'uploaded_pan.pdf';
    }
    if (files.gstDoc?.[0]) {
      const res = await storageService.uploadToCloudinary(files.gstDoc[0].buffer, 'norozz_kyc/gst');
      uploadedDocs.gstDoc = res.secure_url || res.url || 'uploaded_gst.pdf';
    }
    if (files.bankPassbookDoc?.[0]) {
      const res = await storageService.uploadToCloudinary(files.bankPassbookDoc[0].buffer, 'norozz_kyc/bank');
      uploadedDocs.bankPassbookDoc = res.secure_url || res.url || 'uploaded_passbook.pdf';
    }
    if (files.profileImage?.[0]) {
      const res = await storageService.uploadToCloudinary(files.profileImage[0].buffer, 'norozz_kyc/profile');
      partner.profileImage = res.secure_url || res.url || 'uploaded_profile.jpg';
    }

    partner.documents = uploadedDocs;
    partner.kycStatus = 'pending'; // Submitted for City Admin review
    await partner.save();

    return {
      message: 'KYC documents uploaded successfully. Application submitted for City Admin approval.',
      kycStatus: partner.kycStatus,
      documents: partner.documents,
      profileImage: partner.profileImage,
    };
  }

  // 6. GET KYC STATUS
  async getKycStatus(partnerId) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    return {
      partnerId: partner._id,
      agencyName: partner.agencyName,
      name: partner.name,
      kycStatus: partner.kycStatus,
      isBookingUnlocked: partner.kycStatus === 'approved',
      documents: partner.documents,
    };
  }
}

export const partnerAuthService = new PartnerAuthService();
