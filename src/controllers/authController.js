import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'norozz_super_secret_jwt_key_2026', {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

// @desc    Login user & get JWT token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user (explicitly select password)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact Super Admin.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'user', // default role
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed default Super Admin account if none exists
// @route   POST /api/auth/seed
// @access  Public
export const seedSuperAdmin = async (req, res, next) => {
  try {
    const superAdminEmail = 'superadmin@norozz.com';
    let superAdmin = await User.findOne({ email: superAdminEmail });

    if (superAdmin) {
      return res.status(200).json({
        success: true,
        message: 'Super Admin already exists',
        credentials: {
          email: superAdminEmail,
          password: 'SuperAdmin123! (or previously set)',
        },
      });
    }

    superAdmin = await User.create({
      name: 'Super Admin',
      email: superAdminEmail,
      password: 'SuperAdmin123!',
      role: 'superadmin',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Super Admin account created successfully 🎉',
      credentials: {
        email: superAdminEmail,
        password: 'SuperAdmin123!',
        role: 'superadmin',
      },
    });
  } catch (error) {
    next(error);
  }
};
