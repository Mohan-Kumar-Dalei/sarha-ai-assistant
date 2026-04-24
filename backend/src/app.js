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
    origin: ["http://localhost:5173", "https://sarha-ai-assistant.onrender.com"], // Apna React/Vite ka exact URL dalein
    credentials: true // Cookies allow karne ke liye ye zaroori hai
}));

app.use("/api/ai", aiRoutes);
app.use('/api/tts', ttsRoutes);
app.use("/api/auth", authRoutes);
app.get("/api/auth", authRoutes)
app.use("/api", userRoutes);


// Frontend ka static folder (Build ke baad)
app.use(express.static(path.join(__dirname, '../frontend/dist')));
// SPA fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});
module.exports = app;