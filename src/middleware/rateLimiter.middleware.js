import rateLimit from 'express-rate-limit';

/**
 * Utility to extract real client IP address even when behind proxies/load balancers
 */
export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  return (
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||
    req.ip ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
};

/**
 * Strict Rate Limiter for OTP Requests, Login, and Auth endpoints
 * Prevents OTP Bombing, Brute-Force Password Attacks, and Credential Stuffing.
 * Uses keyGenerator with getClientIp so each device/IP is isolated and tracked separately.
 */
export const otpAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each client IP to 10 OTP/Auth attempts per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req) => getClientIp(req),
  skipSuccessfulRequests: true, // Successful logins don't burn rate limit slots
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many OTP or Authentication attempts from this device. Please try again after 15 minutes.',
  },
});

/**
 * General API Rate Limiter
 * Protects server against DDoS and API scraping per client IP
 */
export const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each client IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many requests from this device. Please try again after 15 minutes.',
  },
});
