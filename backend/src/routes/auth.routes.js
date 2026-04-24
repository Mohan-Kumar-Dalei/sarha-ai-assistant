const express = require("express");
const { registerUser, loginUser, logoutUser, updateProfile } = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/update-profile", protect, updateProfile)
router.get("/check-auth", protect, (req, res) => {
    res.status(200).json({ isAuthenticated: true, user: req.user });
});
module.exports = router;