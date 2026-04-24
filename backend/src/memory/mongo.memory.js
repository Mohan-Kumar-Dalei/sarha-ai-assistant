const User = require("../models/user.model"); // [cite: 111]
const { MAX_HISTORY } = require("../utils/constants"); // [cite: 84]
const logger = require("../utils/logger");

const saveMessage = async (userId, message) => {
    let user = await User.findOne({ userId }); // [cite: 85]
    if (!user) user = new User({ userId, history: [] }); // [cite: 86]

    user.history.push(message);
    if (user.history.length > MAX_HISTORY) user.history.shift(); // [cite: 87]
    await user.save();
};

const getMessages = async (userId) => {
    try {
        const user = await User.findOne({ userId }); // [cite: 88]
        return user?.history || []; // [cite: 90]
    } catch (error) {
        logger.error("Error fetching messages:", error);
        return [];
    }
};

const saveUserName = async (userId, name) => {
    let user = await User.findOne({ userId }); // [cite: 92]
    if (!user) user = new User({ userId }); // [cite: 93]
    user.name = name;
    await user.save(); // [cite: 94]
};

const getUserName = async (userId) => {
    const user = await User.findOne({ userId }); // [cite: 95]
    return user?.name || null;
};

const setLanguage = async (userId, lang) => {
    let user = await User.findOne({ userId }); // [cite: 96]
    if (!user) user = new User({ userId });
    user.language = lang;
    await user.save();
};

const getLanguage = async (userId) => {
    const user = await User.findOne({ userId }); // [cite: 98]
    return user?.language || "english"; // [cite: 99]
};

module.exports = {
    saveMessage, getMessages, saveUserName, getUserName, setLanguage, getLanguage
};