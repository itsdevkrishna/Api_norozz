import jwt from 'jsonwebtoken';

/**
 * Generate Access Token
 * @param {Object} payload 
 * @returns {String} JWT Access Token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET || 'norozz_access_secret_key_12345',
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' }
  );
};

/**
 * Generate Refresh Token
 * @param {Object} payload 
 * @returns {String} JWT Refresh Token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET || 'norozz_refresh_secret_key_67890',
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

/**
 * Verify Access Token
 * @param {String} token 
 * @returns {Object} Decoded Payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET || 'norozz_access_secret_key_12345'
  );
};

/**
 * Verify Refresh Token
 * @param {String} token 
 * @returns {Object} Decoded Payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET || 'norozz_refresh_secret_key_67890'
  );
};
