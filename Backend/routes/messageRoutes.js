const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, markAsRead, deleteMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.post("/", protect, sendMessage);
router.get("/:conversationId", protect, getMessages);
router.put("/read/:conversationId", protect, markAsRead);
router.delete("/:id", protect, deleteMessage);

module.exports = router;
