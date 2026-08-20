import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for OTP Requests, Login, and Auth endpoints
 * Prevents OTP Bombing, Brute-Force Password Attacks, and Credential Stuffing
 */
export const otpAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit each IP to 5 OTP/Auth attempts per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many OTP or Authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * General API Rate Limiter
 * Protects server against DDoS and API scraping
 */
export const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
