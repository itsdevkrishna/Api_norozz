import { userRepository } from '../repositories/user.repository.js';
import { otpRepository } from '../repositories/otp.repository.js';
import { storageService } from './storage.service.js';
import { r2StorageService } from './r2Storage.service.js';
import { notificationService } from './notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ROLES } from '../constants/roles.constant.js';

export class PartnerAuthService {
  // 1a. REQUEST PARTNER OTP LOGIN
  async requestOtpLogin(phone) {
    const cleanPhone = phone.trim();
    const existingUser = await userRepository.findByPhone(cleanPhone);
    if (existingUser && existingUser.role !== ROLES.PARTNER) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `This mobile number is registered as a ${existingUser.role} account. Please use the appropriate portal.`
      );
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpirySec = Number(process.env.OTP_EXPIRY_SECONDS) || 300;
    const expiresAt = new Date(Date.now() + otpExpirySec * 1000);

    await otpRepository.create({
      emailOrPhone: cleanPhone,
      otp: generatedOtp,
      type: 'partnerLogin',
      expiresAt,
    });

    await notificationService.dispatchOtp(cleanPhone, generatedOtp);

    return { phone: cleanPhone, otp: generatedOtp, message: 'OTP sent successfully to mobile number' };
  }

  // 1b. VERIFY PARTNER OTP LOGIN
  async verifyOtpLogin(phone, otp) {
    const cleanPhone = phone.trim();
    const validOtp = await otpRepository.findLatestValidOtp(cleanPhone, 'partnerLogin');
    if (!validOtp || validOtp.otp !== otp) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired OTP code');
    }

    let isNewPartner = false;
    let user = await userRepository.findByPhone(cleanPhone);

    if (user && user.role !== ROLES.PARTNER) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `This account is registered as a ${user.role}. Please log in via the ${user.role} portal.`
      );
    }

    if (!user) {
      isNewPartner = true;
      const placeholderEmail = `partner_${cleanPhone.replace(/\D/g, '')}@norozz.com`;

      user = await userRepository.create({
        name: `Partner ${cleanPhone.slice(-4)}`,
        agencyName: `Technician Partner (${cleanPhone.slice(-4)})`,
        email: placeholderEmail,
        phone: cleanPhone,
        password: 'AutoOtpPartnerPass123!',
        role: ROLES.PARTNER,
        status: 'active',
        kycStatus: 'pending',
        isEmailVerified: false,
        isPhoneVerified: true,
        isProfileCompleted: false,
      });
    }

    const isPlaceholderEmail = !user.email || user.email.startsWith('partner_') && user.email.endsWith('@norozz.com');
    const isPlaceholderName = !user.name || user.name.startsWith('Partner ');
    const isMissingDob = !user.dob;
    const isMissingGender = !user.gender;
    const isMissingCity = !user.assignedCity;

    const isProfileCompleted = user.isProfileCompleted && !isPlaceholderEmail && !isPlaceholderName && !isMissingDob && !isMissingGender && !isMissingCity;

    if (!isProfileCompleted) {
      isNewPartner = true;
    }

    await otpRepository.markAsVerified(validOtp._id);

    const authResult = await this.generateTokens(user);
    return {
      ...authResult,
      isNewPartner,
      isProfileCompleted,
      kycStatus: user.kycStatus,
    };
  }

  // 1c. UPDATE PARTNER PROFILE (After OTP verify or profile edit)
  async updateProfile(partnerId, updateData) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    const allowedFields = ['name', 'agencyName', 'email', 'phone', 'dob', 'gender', 'assignedCity', 'city', 'category', 'address', 'profileImage'];
    const sanitizedData = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined && updateData[field] !== '') {
        sanitizedData[field] = updateData[field];
      }
    }

    if (sanitizedData.email) {
      const cleanEmail = sanitizedData.email.trim().toLowerCase();
      const existingUser = await userRepository.findByEmail(cleanEmail);
      if (existingUser && existingUser._id.toString() !== partnerId.toString()) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'This email address is already linked to another account');
      }
      sanitizedData.email = cleanEmail;
      sanitizedData.isEmailVerified = true;
    }

    if (sanitizedData.profileImage && sanitizedData.profileImage.startsWith('data:image')) {
      sanitizedData.profileImage = await storageService.uploadBase64Image(sanitizedData.profileImage, 'norozz_partner_profiles');
    }

    if (sanitizedData.name && !sanitizedData.agencyName) {
      sanitizedData.agencyName = `${sanitizedData.name} (${sanitizedData.category || partner.category || 'Service Partner'})`;
    }

    sanitizedData.isProfileCompleted = true;

    const updated = await userRepository.updateById(partnerId, sanitizedData);
    const obj = updated.toObject();
    delete obj.password;
    delete obj.refreshToken;

    return {
      message: 'Partner profile updated successfully',
      user: obj,
    };
  }


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

  // 5. UPLOAD KYC DOCUMENTS (Aadhaar, PAN, GST, Bank Passbook, Profile Image, Driving License, Photo) TO CLOUDFLARE R2
  async uploadDocuments(partnerId, files) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    const uploadedDocs = { ...partner.documents?.toObject?.() || partner.documents || {} };

    // Upload file buffers to Cloudflare R2
    if (files.aadhaarDoc?.[0]) {
      const f = files.aadhaarDoc[0];
      const res = await r2StorageService.uploadFile(f.buffer, f.originalname, f.mimetype, 'norozz_kyc/aadhaar');
      uploadedDocs.aadhaarDoc = res.url;
    }
    if (files.aadhaarFront?.[0]) {
      const f = files.aadhaarFront[0];
      const res = await r2StorageService.uploadFile(f.buffer, f.originalname, f.mimetype, 'norozz_kyc/aadhaar');
      uploadedDocs.aadhaarFront = res.url;
      uploadedDocs.aadhaarDoc = res.url;
    }
    if (files.aadhaarBack?.[0]) {
      const f = files.aadhaarBack[0];
      const res = await r2StorageService.uploadFile(f.buffer, f.originalname, f.mimetype, 'norozz_kyc/aadhaar');
      uploadedDocs.aadhaarBack = res.url;
    }
    if (files.panDoc?.[0]) {
      const f = files.panDoc[0];
      const res = await r2StorageService.uploadFile(f.buffer, f.originalname, f.mimetype, 'norozz_kyc/pan');
      uploadedDocs.panDoc = res.url;
    }
    if (files.gstDoc?.[0]) {
      const f = files.gstDoc[0];
      const res = await r2StorageService.uploadFile(f.buffer, f.originalname, f.mimetype, 'norozz_kyc/gst');
      uploadedDocs.gstDoc = res.url;
    }
    if (files.bankPassbookDoc?.[0]) {
      const f = files.bankPassbookDoc[0];
      const res = await r2StorageService.uploadFile(f.buffer, f.originalname, f.mimetype, 'norozz_kyc/bank');
      uploadedDocs.bankPassbookDoc = res.url;
    }
    if (files.passportPhoto?.[0]) {
      const f = files.passportPhoto[0];
      const res = await r2StorageService.uploadFile(f.buffer, f.originalname, f.mimetype, 'norozz_kyc/photo');
      uploadedDocs.passportPhoto = res.url;
    }
    if (files.drivingLicenseDoc?.[0]) {
      const f = files.drivingLicenseDoc[0];
      const res = await r2StorageService.uploadFile(f.buffer, f.originalname, f.mimetype, 'norozz_kyc/license');
      uploadedDocs.drivingLicenseDoc = res.url;
    }
    if (files.profileImage?.[0]) {
      const f = files.profileImage[0];
      const res = await r2StorageService.uploadFile(f.buffer, f.originalname, f.mimetype, 'norozz_kyc/profile');
      partner.profileImage = res.url;
    }

    partner.documents = uploadedDocs;
    await partner.save();

    return {
      message: 'KYC documents uploaded successfully to Cloudflare R2 storage.',
      kycStatus: partner.kycStatus,
      documents: partner.documents,
      profileImage: partner.profileImage,
    };
  }

  // 6. STEP-WISE ONBOARDING METHOD 0: LOCATION ACCESS (Device GPS)
  async saveOnboardingLocation(partnerId, { latitude, longitude, address, city, landmark }) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    if (latitude && longitude) {
      partner.locationCoordinates = {
        lat: Number(latitude),
        lng: Number(longitude),
      };
    }
    if (address) partner.address = address;
    if (city) {
      partner.assignedCity = city;
      partner.city = city;
    }
    if (landmark) partner.landmark = landmark;

    await partner.save();

    const obj = partner.toObject();
    delete obj.password;
    delete obj.refreshToken;

    return { message: 'Device location saved successfully', user: obj };
  }

  // 6. STEP-WISE ONBOARDING METHOD 1: DOCUMENTS UPLOAD
  async saveOnboardingDocuments(partnerId, documentsData = {}) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    const currentDocs = partner.documents ? partner.documents.toObject() : {};
    partner.documents = {
      ...currentDocs,
      ...documentsData,
    };

    await partner.save();
    const obj = partner.toObject();
    delete obj.password;
    delete obj.refreshToken;

    return { message: 'Documents saved successfully', user: obj };
  }

  // 6. STEP-WISE ONBOARDING METHOD 2: CATEGORY SELECTION
  async saveOnboardingCategory(partnerId, category) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    partner.category = category;
    await partner.save();

    const obj = partner.toObject();
    delete obj.password;
    delete obj.refreshToken;

    return { message: 'Category selected successfully', user: obj };
  }

  // 6. STEP-WISE ONBOARDING METHOD 3: SKILLS & EXPERIENCE
  async saveOnboardingSkills(partnerId, { experience, skills, certifications }) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    if (experience) partner.experience = experience;
    if (Array.isArray(skills)) partner.skills = skills;
    if (Array.isArray(certifications)) partner.certifications = certifications;

    await partner.save();

    const obj = partner.toObject();
    delete obj.password;
    delete obj.refreshToken;

    return { message: 'Skills & Experience saved successfully', user: obj };
  }

  // 6. STEP-WISE ONBOARDING METHOD 4: SERVICE AREA
  async saveOnboardingServiceArea(partnerId, { workRadius, localities }) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    if (workRadius) partner.workRadius = Number(workRadius);
    if (Array.isArray(localities)) partner.localities = localities;

    await partner.save();

    const obj = partner.toObject();
    delete obj.password;
    delete obj.refreshToken;

    return { message: 'Service area saved successfully', user: obj };
  }

  // 6. STEP-WISE ONBOARDING METHOD 5: WORKING HOURS & FINAL COMPLETE
  async saveOnboardingWorkingHours(partnerId, { workingHours }) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    if (Array.isArray(workingHours)) partner.workingHours = workingHours;
    partner.isKycSubmitted = true;
    partner.kycStatus = 'pending'; // Application submitted for City Admin approval

    await partner.save();

    const obj = partner.toObject();
    delete obj.password;
    delete obj.refreshToken;

    return { message: 'Working hours saved & onboarding completed successfully', user: obj };
  }

  // 7. SUBMIT FULL KYC & WORK SETUP (BULK FALLBACK)
  async submitKycSetup(partnerId, kycData) {
    const partner = await userRepository.findById(partnerId);
    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Partner account not found');
    }

    const {
      documents = {},
      experience,
      skills,
      certifications,
      workRadius,
      localities,
      workingHours,
      category,
    } = kycData;

    const currentDocs = partner.documents ? partner.documents.toObject() : {};
    partner.documents = {
      ...currentDocs,
      ...documents,
    };

    if (experience) partner.experience = experience;
    if (Array.isArray(skills)) partner.skills = skills;
    if (Array.isArray(certifications)) partner.certifications = certifications;
    if (workRadius) partner.workRadius = Number(workRadius);
    if (Array.isArray(localities)) partner.localities = localities;
    if (Array.isArray(workingHours)) partner.workingHours = workingHours;
    if (category) partner.category = category;

    partner.isKycSubmitted = true;
    partner.kycStatus = 'pending';

    await partner.save();

    const obj = partner.toObject();
    delete obj.password;
    delete obj.refreshToken;

    return {
      message: 'KYC & Work setup submitted successfully. Application is under review by City Admin.',
      user: obj,
      kycStatus: partner.kycStatus,
      isKycSubmitted: partner.isKycSubmitted,
    };
  }


  // 7. GET KYC STATUS
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
      isKycSubmitted: partner.isKycSubmitted || false,
      isBookingUnlocked: partner.kycStatus === 'approved',
      documents: partner.documents,
      experience: partner.experience,
      skills: partner.skills,
      workRadius: partner.workRadius,
      localities: partner.localities,
      workingHours: partner.workingHours,
    };
  }
}

export const partnerAuthService = new PartnerAuthService();
