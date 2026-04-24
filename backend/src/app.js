const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const aiRoutes = require("./routes/ai.routes");
const ttsRoutes = require('./routes/tts.routes');
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.route");
const path = require("path");
const app = express();


// 👇 YAHAN CHANGE KIYA HAI
// Frontend ka static folder (Build ke baad)
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use(cors({
    origin: "http://localhost:5173", // Apna React/Vite ka exact URL dalein
    credentials: true // Cookies allow karne ke liye ye zaroori hai
}));
// SPA fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});
app.use(express.json());
app.use(cookieParser());
app.use("/api/ai", aiRoutes);
app.use('/api/tts', ttsRoutes);
app.use("/api/auth", authRoutes);
app.get("/api/auth", authRoutes)
app.use("/api", userRoutes);

module.exports = app;