const User   = require("../models/User");
const jwt    = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/sendEmail");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username?.trim() || !email || !password)
      return res.status(400).json({ success:false, message:"All fields are required" });
    if (password.length < 6)
      return res.status(400).json({ success:false, message:"Password must be at least 6 characters" });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ success:false, message:"Email already registered. Please sign in." });

    const hashed      = await bcrypt.hash(password, 12);
    const verifyToken  = crypto.randomBytes(32).toString("hex");
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({ username: username.trim(), email: email.toLowerCase(), password: hashed, verifyToken, verifyExpiry, isVerified: false });

    try {
      await sendVerificationEmail(email, username.trim(), verifyToken);
    } catch (emailErr) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ success:false, message:"Failed to send verification email. Please try again." });
    }

    res.status(201).json({ success:true, message:`Verification email sent to ${email}. Please check your inbox.` });
  } catch (err) { next(err); }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success:false, message:"Invalid link" });
    const user = await User.findOne({ verifyToken: token, verifyExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success:false, message:"Link expired or invalid. Please register again." });
    user.isVerified = true; user.verifyToken = undefined; user.verifyExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ success:true, message:"Email verified! You can now sign in.", token: generateToken(user._id), user: user.toSafeObject() });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, message:"Email and password are required" });
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return res.status(401).json({ success:false, message:"No account found with this email" });
    if (!user.isVerified) return res.status(401).json({ success:false, message:"Please verify your email first. Check your inbox." });
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ success:false, message:"Incorrect password" });
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });
    res.json({ success:true, token: generateToken(user._id), user: user.toSafeObject() });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success:false, message:"User not found" });
    res.json({ success:true, user: user.toSafeObject() });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username, bio, avatar } = req.body;
    const updates = {};
    if (username) updates.username = username.trim();
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new:true, runValidators:false });
    res.json({ success:true, user: user.toSafeObject() });
  } catch (err) { next(err); }
};
