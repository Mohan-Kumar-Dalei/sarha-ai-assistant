const express = require("express");
const { handleAI } = require("../controllers/ai.controller");
const router = express.Router();
// 🔥 FIX: Wahi model use karo jo login ke liye use hota hai
const AuthUser = require("../models/auth.userModel");
const { protect } = require("../middlewares/auth.middleware");

router.post("/", protect, handleAI);

router.post("/save-key", protect, async (req, res) => {
    try {
        const { apiKey } = req.body;

        // Token se ID nikalna
        const userId = req.user._id || req.user.id;

        if (!apiKey) {
            return res.status(400).json({ success: false, message: "API Key is required" });
        }

        // 🔥 Dhoondho usi collection mein jahan login user save hua tha
        const user = await AuthUser.findById(userId);

        if (!user) {
            console.log("❌ User not found in AuthUser collection. ID:", userId);
            return res.status(404).json({ success: false, message: "User not found. Please login again." });
        }

        // Key save karo
        user.geminiApiKey = apiKey;
        await user.save();

        console.log("✅ Key saved successfully for:", user.email);
        res.status(200).json({ success: true, message: "Gemini API Key saved successfully!" });
    } catch (error) {
        console.error("🚨 [SAVE-KEY] Server Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;