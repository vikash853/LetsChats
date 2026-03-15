/**
 * Multer Upload Configuration
 * ─────────────────────────────────────────────────────────────────
 * Handles multipart/form-data file uploads.
 * Files land in /uploads/<subfolder> on the server.
 *
 * In production, swap this out for an S3 / Cloudinary strategy —
 * just change the storage engine; the rest of the code stays the same.
 */
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

/**
 * Ensure the upload directory exists at startup.
 * We separate avatars from chat attachments for clean organisation.
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir("uploads/avatars");
ensureDir("uploads/attachments");

/**
 * Disk storage engine
 * Controls WHERE the file is saved and WHAT it's named.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route avatars vs chat files to different folders
    const isAvatar = req.path.includes("avatar") || req.path.includes("profile");
    cb(null, isAvatar ? "uploads/avatars" : "uploads/attachments");
  },
  filename: (req, file, cb) => {
    // uuid prefix prevents filename collisions when two users
    // upload a file called "photo.jpg" at the same time
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

/**
 * File type filter — only allow images and common document types.
 * This runs BEFORE the file is written to disk.
 */
const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true); // accept
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false); // reject
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per file
  },
});

module.exports = upload;
