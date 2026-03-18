const express    = require("express");
const router     = express.Router();
const protect    = require("../middleware/auth");
const {
  register,
  login,
  firebaseLogin,
  getMe,
  updateProfile,
} = require("../controllers/authController");

router.post("/register",       register);
router.post("/login",          login);
router.post("/firebase-login", firebaseLogin);
router.get("/me",              protect, getMe);
router.put("/profile",         protect, updateProfile);

module.exports = router;
