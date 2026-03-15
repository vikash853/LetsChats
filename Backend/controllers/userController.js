/**
 * User Controller
 * Handles user listing and search
 */
const User = require("../models/User");

/**
 * @desc    Get all users (except the logged-in user)
 * @route   GET /api/users
 * @access  Private
 */
const getAllUsers = async (req, res, next) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { username: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    // Exclude the current user from results
    const users = await User.find({
      ...keyword,
      _id: { $ne: req.user._id },
    }).select("-password");

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get online users
 * @route   GET /api/users/online
 * @access  Private
 */
const getOnlineUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      isOnline: true,
      _id: { $ne: req.user._id },
    }).select("username avatar isOnline lastSeen");

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getOnlineUsers, getUserById };
