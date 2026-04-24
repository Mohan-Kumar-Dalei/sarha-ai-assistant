const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const aiRoutes = require("./routes/ai.routes");
const ttsRoutes = require('./routes/tts.routes');
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.route");
const path = require("path");
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173", "https://sarha-ai-assistant-zf5p.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
}));

// 1. API Routes (Sabse pehle check honge)
app.use("/api/ai", aiRoutes);
app.use('/api/tts', ttsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);

// 2. Static Folder Path (Small 'f' ke saath)
// __dirname se Backend/src se nikal kar frontend/dist tak ka rasta
const frontendPath = path.resolve(__dirname, "../../frontend/dist");

// 3. Static files serve karo
app.use(express.static(frontendPath));

// 4. SMART Fallback (Isse error nahi aayega)
app.get(".*", (req, res) => {
    // Agar request '/api' ya assets ki file ke liye hai jo nahi mili, toh HTML mat bhejo
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        return res.status(404).send("File or Route not found");
    }
    // Baaki sab ke liye React ki index.html bhejo
    res.sendFile(path.join(frontendPath, "index.html"));
});

module.exports = app;