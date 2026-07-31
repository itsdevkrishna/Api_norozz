import { BaseController } from './base.controller.js';
import { partnerAuthService } from '../services/partnerAuth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class PartnerAuthController extends BaseController {

  setCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  signup = asyncHandler(async (req, res) => {
    const result = await partnerAuthService.signup(req.body);
    this.setCookie(res, result.refreshToken);
    return this.sendCreated(res, result, 'Partner agency onboarding application created. Status: PENDING KYC.');
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await partnerAuthService.login(email, password);
    this.setCookie(res, result.refreshToken);
    return this.sendSuccess(res, result, 'Partner login successful');
  });

  logout = asyncHandler(async (req, res) => {
    res.clearCookie('refreshToken');
    return this.sendSuccess(res, null, 'Partner logged out successfully');
  });

  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await partnerAuthService.forgotPassword(email);
    return this.sendSuccess(res, result, 'Password reset OTP generated successfully');
  });

  resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const result = await partnerAuthService.resetPassword(email, otp, newPassword);
    return this.sendSuccess(res, result, result.message);
  });

  uploadDocuments = asyncHandler(async (req, res) => {
    const result = await partnerAuthService.uploadDocuments(req.user._id, req.files || {});
    return this.sendSuccess(res, result, result.message);
  });

  getKycStatus = asyncHandler(async (req, res) => {
    const result = await partnerAuthService.getKycStatus(req.user._id);
    return this.sendSuccess(res, result, 'Partner KYC Status retrieved successfully');
  });
}

export const partnerAuthController = new PartnerAuthController();
