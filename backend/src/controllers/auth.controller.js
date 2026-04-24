const User = require("../models/auth.userModel");
const jwt = require("jsonwebtoken");
const { saveUserName } = require("../memory/mongo.memory");
// JWT Generate karne ka function
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "supersecretkey", {
        expiresIn: "7d",
    });
};

// @desc    Register new user
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const user = await User.create({ name, email, password });

        if (user) {
            const token = generateToken(user._id);

            // Cookie mein token set karna
            res.cookie("jwt", token, {
                httpOnly: true, // XSS attacks se bachata hai
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.status(201).json({ _id: user._id, name: user.name, email: user.email });
        }
    } catch (error) {
        console.error("🚨 BACKEND CRASH ERROR DETAILS:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Auth user & get token (Login)
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id);

            res.cookie("jwt", token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.json({ message: "Login successful", _id: user._id, name: user.name });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("🚨 BACKEND CRASH ERROR DETAILS:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Logout user & clear cookie
exports.logoutUser = (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0), // Cookie ko turant expire kar dena
    });
    res.status(200).json({ message: "Logged out successfully" });
};

exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body; // Ye InfoPanel se aaya hua Alias/Naam hai (e.g., "Boss")

        // Token se ID nikalna
        const userId = req.user && (req.user._id || req.user.id);

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID not found in token." });
        }

        // 🔥 FIX 1: Hum user ka asli signup wala naam update NAHI karenge.
        // Sirf check karenge ki user database mein exist karta hai ya nahi.
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found. Please login again." });
        }

        // 🔥 FIX 2: InfoPanel wale naam ko AI ki memory mein save karenge
        // Taki Auth DB safe rahe, aur AI ko pata chal jaye ki user ko kya bulana hai.
        if (name) {
            await saveUserName(userId.toString(), name);
        }

        // Response bhej do bina auth user ka asli naam change kiye
        res.status(200).json({
            message: "Alias updated successfully for AI",
            user: { _id: user._id, name: user.name, email: user.email } // Asli naam hi wapas bhej rahe hain
        });
    } catch (error) {
        console.error("❌ Update Profile Error:", error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};