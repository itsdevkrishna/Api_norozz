import bcrypt from 'bcryptjs';

/**
 * Hash plain text password using bcryptjs
 * @param {String} password 
 * @returns {Promise<String>} Hashed Password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare plain text password with hashed password
 * @param {String} password 
 * @param {String} hashedPassword 
 * @returns {Promise<Boolean>} Match result
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
