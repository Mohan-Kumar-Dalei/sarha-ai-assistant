const jwt = require("jsonwebtoken");
const User = require("../models/auth.userModel");

const protect = async (req, res, next) => {
    // 👇 Safety Check: Pehle dekho req.cookies exist karta hai ya nahi
    let token = req.cookies ? req.cookies.jwt : null;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
            req.user = await User.findById(decoded.id).select("-password");
            next();
        } catch (error) {
            console.error("Auth Token Error:", error.message);
            res.status(401).json({ message: "Not authorized, invalid token" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token found" });
    }
};

module.exports = { protect };