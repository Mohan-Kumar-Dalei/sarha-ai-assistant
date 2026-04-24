const User = require('../models/user.model');
const jwt = require('jsonwebtoken'); // 🔥 Token decode karne ke liye yeh zaroori hai
const getUser = async (req, res) => {
    try {
        let userId;

        // Step 1: Agar tumne auth middleware lagaya hai toh req.user se ID mil jayegi
        if (req.user && (req.user.userId || req.user.id)) {
            userId = req.user.userId || req.user.id;
        }
        // Step 2: Agar middleware missing hai, toh hum khud Cookie se token nikalenge
        else {
            // Tumhare token wali cookie ka naam jo bhi ho ('token', 'jwt', ya 'access_token')
            const token = req.cookies?.token || req.cookies?.jwt || req.cookies?.access_token;

            if (!token) {
                return res.status(401).json({ message: "Unauthorized. No token provided." });
            }

            // Token decode karo (Apna JWT_SECRET yahan match kar lena)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId || decoded.id;
        }

        if (!userId) {
            return res.status(400).json({ message: "Invalid token payload." });
        }

        // Step 3: Database mein User dhoondo
        const userRecord = await User.findOne({ userId: userId });

        if (!userRecord) {
            return res.status(404).json({ message: "User not found in database." });
        }

        // Step 4: User ka data frontend ko bhej do
        res.json(userRecord);

    } catch (error) {
        console.error("Error fetching user:", error.message);
        res.status(500).json({ message: "Internal server error or Invalid Token." });
    }
}

module.exports = { getUser };