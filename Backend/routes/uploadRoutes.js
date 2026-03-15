/**
 * Upload Routes
 * ─────────────────────────────────────────────────────────────────
 * POST /api/upload/avatar      — update profile picture
 * POST /api/upload/attachment  — attach a file to a chat message
 *
 * Both routes return a { url } object that the frontend stores
 * in the message or user record.
 */
const express = require("express");
const router = express.Router();
const path = require("path");
const upload = require("../utils/upload");
const { protect } = require("../middleware/auth");
const User = require("../models/User");

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload / replace the logged-in user's avatar
 * @access  Private
 */
router.post("/avatar", protect, upload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Build a public URL the frontend can display
    // e.g.  http://localhost:5000/uploads/avatars/uuid.jpg
    const url = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;

    // Persist the new avatar URL on the user document
    await User.findByIdAndUpdate(req.user._id, { avatar: url });

    res.json({ success: true, url });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/upload/attachment
 * @desc    Upload a file to attach to a chat message
 * @access  Private
 *
 * Returns { url, fileName, mimeType } so the message controller
 * can store them in the Message document.
 */
router.post("/attachment", protect, upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const url = `${req.protocol}://${req.get("host")}/uploads/attachments/${req.file.filename}`;

    res.json({
      success: true,
      url,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
