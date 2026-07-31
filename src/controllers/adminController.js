import User from '../models/userModel.js';

// @desc    Get dashboard metrics & system statistics
// @route   GET /api/admin/stats
// @access  Private/SuperAdmin
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
    const totalSuperAdmins = await User.countDocuments({ role: 'superadmin' });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const blockedUsers = await User.countDocuments({ status: 'blocked' });

    // Fetch 5 most recently created users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalSuperAdmins,
        activeUsers,
        blockedUsers,
        serverUptime: process.uptime(),
      },
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN SPECIFIC CRUD CONTROLLERS
// ==========================================

// @desc    Get all admin accounts (admin & superadmin)
// @route   GET /api/admin/admins
// @access  Private/SuperAdmin
export const getAdmins = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = { role: { $in: ['admin', 'superadmin'] } };

    if (search) {
      query.$and = [
        { role: { $in: ['admin', 'superadmin'] } },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const admins = await User.find(query).sort({ createdAt: -1 }).select('-password');

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Admin by Super Admin
// @route   POST /api/admin/admins
// @access  Private/SuperAdmin
export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Account with this email already exists',
      });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: role && ['admin', 'superadmin'].includes(role) ? role : 'admin',
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Admin details (Name, Email, Role, Status, Password)
// @route   PUT /api/admin/admins/:id
// @access  Private/SuperAdmin
export const updateAdmin = async (req, res, next) => {
  try {
    const { name, email, role, status, password } = req.body;
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
      });
    }

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (role && ['admin', 'superadmin', 'user'].includes(role)) admin.role = role;
    if (status && ['active', 'blocked'].includes(status)) {
      if (admin._id.toString() === req.user.id.toString() && status === 'blocked') {
        return res.status(400).json({
          success: false,
          message: 'You cannot block your own Super Admin account',
        });
      }
      admin.status = status;
    }
    if (password) admin.password = password; // Pre-save hook will hash it automatically

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin account updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Admin account
// @route   DELETE /api/admin/admins/:id
// @access  Private/SuperAdmin
export const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
      });
    }

    if (admin._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own Super Admin account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Admin account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// USER GENERAL CONTROLLERS
// ==========================================

// @desc    Get all users with search & filters
// @route   GET /api/admin/users
// @access  Private/SuperAdmin
export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const users = await User.find(query).sort({ createdAt: -1 }).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user by Super Admin
// @route   POST /api/admin/users
// @access  Private/SuperAdmin
export const createUserByAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

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
      role: role || 'user',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
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

// @desc    Update user role (user/admin/superadmin)
// @route   PATCH /api/admin/users/:id/role
// @access  Private/SuperAdmin
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to '${role}'`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (active/blocked)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/SuperAdmin
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent blocking oneself
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block your own Super Admin account',
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User status changed to '${status}'`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private/SuperAdmin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting oneself
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own Super Admin account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
