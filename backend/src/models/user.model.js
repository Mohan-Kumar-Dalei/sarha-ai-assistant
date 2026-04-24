const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: String,
    preferences: Object,
    history: [String],
    language: { type: String, default: "hindi" },
    createdAt: { type: Date, default: Date.now },
    geminiApiKey: {
        type: String,
        default: null, // Default null rahega jab tak user setup na kare
    }
}, { timestamps: true });
    module.exports = mongoose.model("User", userSchema);