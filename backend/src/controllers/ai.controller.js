const { generateChatResponse } = require("../services/chat.service");
const { addToMemory } = require("../services/memory.service");
const { executeAction } = require("../services/action.service");

const handleAI = async (req, res) => {
    try {
        // 🔥 FIX 1: Ensure valid userId (MongoDB '_id' aur 'id' dono handle karega)
        const userId = (req.user && (req.user._id || req.user.id)) || req.body.userId;

        if (!userId) {
            // Agar ID nahi hai toh error return karo, kyunki bina ID ke DB se API key nahi milegi
            return res.status(401).json({ error: "User not authenticated. Cannot fetch API key." });
        }

        const { message } = req.body;

        // 🚀 MAJOR FIX: 'await' hata diya. Ab ye background mein save hoga bina code ko roke!
        addToMemory(userId, `User: ${message}`).catch(err => console.error("[MEMORY ERR] User msg save failed:", err));

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        const actionResult = await executeAction(message, false);
        let finalResponse = "";
        let actionType = null;

        if (actionResult) {
            let aiPrompt = message;

            // 🔥 AGAR WEATHER COMMAND HAI TOH AI KO LAMBA BOLNE KA INSTRUCTION DO
            if (typeof actionResult === 'string' && actionResult.startsWith("WEATHER_DATA:")) {
                const weatherInfo = actionResult.replace("WEATHER_DATA:", "");

                // 🔥 THE DEVNAGARI HACK IN PROMPT
                aiPrompt = `User wants detailed weather info. System extracted this data: [${weatherInfo}]. 
                CRITICAL INSTRUCTION FOR SARHA: Explain this weather data in extreme detail. Talk about the temperature, explain what the wind speed means, mention rain probability and humidity. Make your response at least 4 to 5 sentences long, conversational, helpful, and completely in natural Hinglish style. Tell the user you have opened the Zoom Earth live radar map on their screen to see sunset, sunrise, and pressure data. 
                ⚠️ STRICT RULE:  your entire speak response in DEVANAGARI SCRIPT hinglish text so the TTS engine pronounces it correctly with an Indian accent. You can keep English tech words (like 'Map', 'Radar', 'Humidity') in English alphabets. 
                Example: 'सर, मैं आपके लिए ज़ूम अर्थ (Zoom Earth) का लाइव रडार ओपन कर रही हूँ।'`;

                actionType = "weather";
            }

            // Pehle AI ko generate karne do (Stream turant shuru ho jayegi)
            finalResponse = await generateChatResponse(aiPrompt, userId, res, true);

            if (finalResponse && finalResponse.trim() !== "") {
                // Weather browser 'false' state mein hi khul gaya tha, isliye yahan wapas run karne ki zarurat nahi
                if (!actionResult.startsWith("WEATHER_DATA:")) {
                    executeAction(message, true).catch(err => console.error("Action Error:", err));
                }
            }
        } else {
            // Normal chat conversation
            finalResponse = await generateChatResponse(message, userId, res, false);
        }

        if (finalResponse) {
            // 🚀 MAJOR FIX: AI ka response bhi background mein DB mein save karo bina wait kiye
            addToMemory(userId, `Sarha: ${finalResponse}`).catch(err => console.error("[MEMORY ERR] AI msg save failed:", err));
        }

    } catch (error) {
        console.error("Controller error:", error);
        if (!res.headersSent) {
            res.status(500).end("Error processing AI request");
        }
    }
};

module.exports = { handleAI };