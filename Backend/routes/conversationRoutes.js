const express = require("express");
const router = express.Router();
const {
  accessConversation,
  getConversations,
  createGroupConversation,
  updateGroupMembers,
} = require("../controllers/conversationController");
const { protect } = require("../middleware/auth");

router.post("/", protect, accessConversation);
router.get("/", protect, getConversations);
router.post("/group", protect, createGroupConversation);
router.put("/group/:id", protect, updateGroupMembers);

module.exports = router;
