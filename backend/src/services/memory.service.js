const { saveMessage, getMessages } = require("../memory/mongo.memory");
const logger = require("../utils/logger");

// 🌟 NAYA LOGIC: Ab ye RAM ki jagah seedha MongoDB se baat karega
const addToMemory = async (userId, message) => {
    try {
        if (!userId) return;

        // MongoDB mein message save karo
        await saveMessage(userId.toString(), message);
        console.log(`[MEMORY] Message saved to DB for user: ${userId}`);
    } catch (error) {
        logger.error("Error adding to DB memory:", error);
    }
};

const getContext = async (userId) => {
    try {
        if (!userId) return "";

        // DB se pichle messages nikalo context ke liye
        const history = await getMessages(userId.toString());

        // AI ko samajhne ke liye history ko ek string mein badlo
        return history.join("\n");
    } catch (error) {
        logger.error("Error fetching context from DB:", error);
        return "";
    }
};

module.exports = { addToMemory, getContext };