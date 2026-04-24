const { generateLLMStreamResponse } = require("../llm");
const { getContext } = require("./memory.service");
const { getLanguage, getUserName } = require("../memory/mongo.memory");
const { getTime, getDate } = require("../utils/dateTime");
const logger = require("../utils/logger");

const generateChatResponse = async (input, userId, res, isCommand = false) => {
    try {
        // 1. Validation: Ensure userId exists
        if (!userId) {
            throw new Error("UserId is missing in generateChatResponse");
        }

        const context = await getContext(userId) || "";
        const lang = await getLanguage(userId) || "hindi";
        const userName = await getUserName(userId) || "Sir";

        let prompt = "";

        // Common System Instructions for both cases
        const systemRules = `
You are Sarha, an ultra-fast AI Assistant."
CRITICAL VOICE RULES:
1. NO MARKDOWN: Never use **, #, _, or bullet points.
2. HINDI RULE: Use strictly DEVANAGARI SCRIPT for Hindi words.
3. LANGUAGE: Default to English unless user speaks Hindi.
4. if user asks for his name then respond with the name you have in database which is ${userName}.
5. If user asks for time, date, or weather, provide that information in a conversational way with long words.
6. dont tell in user that you are an AI model, just be a helpful assistant. Always be conversational and use emojis to make the conversation lively.
7. If you don't know the answer, say "माफ़ कीजिए सर, मुझे इस बारे में जानकारी नहीं है। or Sorry sir, I don't have information on that." and nothing else. Do not say anything else or try to make up an answer.
8. DO NOT repeat the user's name in every response. Use it very sparingly, naturally, and only when absolutely necessary (like a first greeting).
9. EXTREMELY CONCISE: You are a voice assistant. Keep your responses VERY short (Maximum 1 or 2 short sentences). Never generate long paragraphs. Direct to the point.
`;

        if (isCommand) {
            prompt = `
${systemRules}
BEHAVIOR: Always assume you executed the command successfully. Be conversational with emojis.
Time: ${getTime()} | Date: ${getDate()}
Context: ${context}
User Command: ${input}
`;
        } else {
            prompt = `
${systemRules}
Time: ${getTime()} | Date: ${getDate()}
User Message: ${input}
`;
        }

        // 🔥 FIX: Added 'userId' as the 3rd argument here!
        // Ab ye ID aage jayegi aur DB se API key fetch ho payegi.
        const fullText = await generateLLMStreamResponse(prompt, res, userId);

        // 🔥 CLEANUP: Removing any accidental markdown symbols for clean TTS
        const cleanText = fullText.replace(/[*#_~`]/g, '').trim();

        return cleanText;

    } catch (error) {
        logger.error("Chat generation error:", error);
        if (!res.headersSent) {
            res.status(500).end("System error.");
        } else {
            res.end();
        }
        throw error;
    }
};

module.exports = { generateChatResponse };