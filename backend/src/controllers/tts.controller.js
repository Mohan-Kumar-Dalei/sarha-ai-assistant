const { generateSarhaVoice } = require("../services/tts.service");
const AuthUser = require("../models/auth.userModel");

const getSarhaAudio = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).send("Text is required");
        }

        // 1. User ki DB wali Gemini Key nikalna (agar available ho)
        let userGeminiKey = null;
        if (req.user) {
            const userId = req.user._id || req.user.id;
            const user = await AuthUser.findById(userId);
            userGeminiKey = user?.geminiApiKey;
        }

        // 2. Audio generate karna
        const audioBuffer = await generateSarhaVoice(text, userGeminiKey);

        if (!audioBuffer) {
            return res.status(500).send("Audio generation failed");
        }

        // 🌟 THE MAGIC FIX: Format Detection
        // WAV files hamesha "RIFF" bytes se start hoti hain, warna wo MP3 hai
        const isWav = audioBuffer.toString('utf8', 0, 4) === 'RIFF';

        res.set({
            'Content-Type': isWav ? 'audio/wav' : 'audio/mpeg',
            'Content-Length': audioBuffer.length,
            'Accept-Ranges': 'bytes'
        });

        res.end(audioBuffer);

    } catch (error) {
        console.error("TTS Controller Error:", error.message);
        if (!res.headersSent) {
            res.status(500).send("System error");
        }
    }
};

module.exports = { getSarhaAudio };