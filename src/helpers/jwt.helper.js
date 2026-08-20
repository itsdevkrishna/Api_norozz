import jwt from 'jsonwebtoken';

/**
 * Generate Access Token
 * @param {Object} payload 
 * @returns {String} JWT Access Token
 */
export const generateAccessToken = (payload) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET environment variable is missing.');
  }
  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' }
  );
};

/**
 * Generate Refresh Token
 * @param {Object} payload 
 * @returns {String} JWT Refresh Token
 */
export const generateRefreshToken = (payload) => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET environment variable is missing.');
  }
  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

/**
 * Verify Access Token
 * @param {String} token 
 * @returns {Object} Decoded Payload
 */
export const verifyAccessToken = (token) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET environment variable is missing.');
  }
  return jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET
  );
};

/**
 * Verify Refresh Token
 * @param {String} token 
 * @returns {Object} Decoded Payload
 */
export const verifyRefreshToken = (token) => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET environment variable is missing.');
  }
  return jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET
  );
};
