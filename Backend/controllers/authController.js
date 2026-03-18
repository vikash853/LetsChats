const User     = require("../models/User");
const jwt      = require("jsonwebtoken");
const bcrypt   = require("bcryptjs");
const admin    = require("../config/firebaseAdmin"); // Firebase Admin SDK

// ── Generate JWT ──────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

// ── Register ──────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({ username, email, password: hashed });
    res.status(201).json({ success: true, token: generateToken(user._id), user: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ── Login ─────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    user.lastSeen = new Date();
    await user.save();
    res.json({ success: true, token: generateToken(user._id), user: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ── Firebase Login (Phone OTP + Google OAuth) ─────────────────
// Frontend sends: { firebaseUID, method: "phone"|"google", phone?, email?, name?, photo? }
exports.firebaseLogin = async (req, res, next) => {
  try {
    const { firebaseUID, method, phone, email, name, photo } = req.body;

    if (!firebaseUID || !method)
      return res.status(400).json({ success: false, message: "Missing firebaseUID or method" });

    // Verify token with Firebase Admin (optional but recommended for security)
    // const decoded = await admin.auth().getUser(firebaseUID);

    let user;

    if (method === "phone") {
      // Find by phone or firebaseUID
      user = await User.findOne({ $or: [{ phone }, { firebaseUID }] });
      if (!user) {
        // Auto-create account for new phone users
        user = await User.create({
          username:   "User_" + phone.slice(-4),
          phone,
          firebaseUID,
          authMethod: "phone",
          password:   await bcrypt.hash(Math.random().toString(36), 10),
        });
      }
    } else if (method === "google") {
      // Find by email or firebaseUID
      user = await User.findOne({ $or: [{ email }, { firebaseUID }] });
      if (!user) {
        // Auto-create account for new Google users
        user = await User.create({
          username:   name || email.split("@")[0],
          email,
          firebaseUID,
          authMethod: "google",
          avatar:     photo,
          password:   await bcrypt.hash(Math.random().toString(36), 10),
        });
      } else {
        // Update avatar if changed
        if (photo && !user.avatar) { user.avatar = photo; await user.save(); }
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid method" });
    }

    user.lastSeen = new Date();
    await user.save();

    res.json({ success: true, token: generateToken(user._id), user: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ── Get Me ────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ── Update Profile ────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id, { username, bio, avatar }, { new: true, runValidators: true }
    );
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) { next(err); }
};