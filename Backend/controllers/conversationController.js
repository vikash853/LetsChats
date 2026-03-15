/**
 * Conversation Controller
 * Handles creating and fetching private/group conversations
 */
const Conversation = require("../models/Conversation");
const User = require("../models/User");

/**
 * @desc    Get or create a private conversation between two users
 * @route   POST /api/conversations
 * @access  Private
 */
const accessConversation = async (req, res, next) => {
  try {
    const { userId } = req.body; // The other user's ID

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    // Check if a private conversation already exists between these two users
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId] },
    })
      .populate("participants", "-password")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username avatar" },
      });

    // If it exists, return it
    if (conversation) {
      return res.json({ success: true, conversation });
    }

    // Otherwise, create a new conversation
    const newConversation = await Conversation.create({
      participants: [req.user._id, userId],
      isGroup: false,
    });

    conversation = await Conversation.findById(newConversation._id).populate(
      "participants",
      "-password"
    );

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all conversations for the logged-in user
 * @route   GET /api/conversations
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: { $in: [req.user._id] },
    })
      .populate("participants", "-password")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username avatar" },
      })
      .sort({ updatedAt: -1 }); // Newest conversations first

    res.json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a group conversation
 * @route   POST /api/conversations/group
 * @access  Private
 */
const createGroupConversation = async (req, res, next) => {
  try {
    const { name, participants } = req.body;

    if (!name || !participants || participants.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Group name and at least 2 participants are required",
      });
    }

    // Add the creator to participants
    const allParticipants = [...new Set([...participants, req.user._id.toString()])];

    const group = await Conversation.create({
      isGroup: true,
      groupName: name,
      participants: allParticipants,
      groupAdmin: req.user._id,
    });

    const fullGroup = await Conversation.findById(group._id)
      .populate("participants", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json({ success: true, conversation: fullGroup });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add or remove a user from a group
 * @route   PUT /api/conversations/group/:id
 * @access  Private (group admin only)
 */
const updateGroupMembers = async (req, res, next) => {
  try {
    const { userId, action } = req.body; // action: 'add' or 'remove'
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Only admin can add/remove members
    if (conversation.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only admin can modify members" });
    }

    const update =
      action === "add"
        ? { $addToSet: { participants: userId } }
        : { $pull: { participants: userId } };

    const updated = await Conversation.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate("participants", "-password");

    res.json({ success: true, conversation: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  accessConversation,
  getConversations,
  createGroupConversation,
  updateGroupMembers,
};
