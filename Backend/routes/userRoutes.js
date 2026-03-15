const express = require("express");
const router = express.Router();
const { getAllUsers, getOnlineUsers, getUserById } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getAllUsers);
router.get("/online", protect, getOnlineUsers);
router.get("/:id", protect, getUserById);

module.exports = router;
