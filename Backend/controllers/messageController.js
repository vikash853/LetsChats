/**
 * Message Controller
 * Handles sending, retrieving, and managing messages
 */
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

/**
 * @desc    Send a message
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, messageType = "text", fileUrl, fileName } = req.body;

    if (!conversationId || (!content && !fileUrl)) {
      return res.status(400).json({
        success: false,
        message: "conversationId and content (or file) are required",
      });
    }

    // Verify the user is a participant in this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Not a participant" });
    }

    // Create message
    let message = await Message.create({
      conversationId,
      sender: req.user._id,
      content,
      messageType,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
    });

    // Populate sender info for real-time broadcasting
    message = await Message.findById(message._id).populate(
      "sender",
      "username avatar"
    );

    // Update conversation's lastMessage and updatedAt
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all messages in a conversation
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Not a participant" });
    }

    const total = await Message.countDocuments({
      conversationId,
      isDeleted: false,
    });

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
    })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 }) // Oldest first
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      messages,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark messages in a conversation as read
 * @route   PUT /api/messages/read/:conversationId
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    await Message.updateMany(
      {
        conversationId: req.params.conversationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
        $set: { status: "read" },
      }
    );

    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a message (soft delete)
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Only the sender can delete their message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    await message.save();

    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getMessages, markAsRead, deleteMessage };
