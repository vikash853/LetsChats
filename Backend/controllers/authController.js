const User    = require("../models/User");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

// ── Register (called after OTP/Google verification on frontend) ──
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, phone, firebaseUID, authMethod, verified } = req.body;

    if (!username || !username.trim())
      return res.status(400).json({ success:false, message:"Username is required" });
    if (!password || password.length < 6)
      return res.status(400).json({ success:false, message:"Password must be at least 6 characters" });

    // Check duplicate email
    if (email) {
      const exists = await User.findOne({ email });
      if (exists)
        return res.status(400).json({ success:false, message:"Email already registered. Please sign in." });
    }

    // Check duplicate phone
    if (phone) {
      const exists = await User.findOne({ phone });
      if (exists)
        return res.status(400).json({ success:false, message:"Phone already registered. Please sign in." });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      username:    username.trim(),
      email:       email || undefined,
      phone:       phone || undefined,
      password:    hashed,
      firebaseUID: firebaseUID || undefined,
      authMethod:  authMethod || "email",
      isVerified:  verified === true,
    });

    res.status(201).json({
      success: true,
      token:   generateToken(user._id),
      user:    user.toSafeObject(),
    });
  } catch (err) { next(err); }
};

// ── Login (simple email + password, no OTP needed) ──────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success:false, message:"Email and password are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ success:false, message:"No account found with this email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success:false, message:"Incorrect password" });

    // Update lastSeen without triggering full validation
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

    res.json({
      success: true,
      token:   generateToken(user._id),
      user:    user.toSafeObject(),
    });
  } catch (err) { next(err); }
};

// ── Get current user ─────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ success:false, message:"User not found" });
    res.json({ success:true, user: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ── Update profile ───────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, bio, avatar } = req.body;
    const updates = {};
    if (username) updates.username = username.trim();
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true, runValidators: false,
    });
    res.json({ success:true, user: user.toSafeObject() });
  } catch (err) { next(err); }
};
