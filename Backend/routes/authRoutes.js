const express  = require("express");
const router   = express.Router();
const { protect } = require("../middleware/auth");
const { register, verifyEmail, login, getMe, updateProfile } = require("../controllers/authController");
router.post("/register",       register);
router.post("/login",          login);
router.post("/firebase-login", firebaseLogin);  // NEW
router.get("/me",              protect, getMe);
router.put("/profile",         protect, updateProfile);

module.exports = router;
