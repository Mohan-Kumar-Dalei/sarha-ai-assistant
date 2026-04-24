// 🔥 Yahan hum exact naam se import kar rahe hain
const { geminiResponse, geminiStreamResponse } = require("./gemini");

const generateLLMResponse = async (input) => {
    const provider = process.env.LLM_PROVIDER || "gemini";
    if (provider === "gemini") {
        return await geminiResponse(input);
    }
    throw new Error("No LLM provider configured");
};

const generateLLMStreamResponse = async (prompt, res, userId) => {
    const provider = process.env.LLM_PROVIDER || "gemini";
    if (provider === "gemini") {
        return await geminiStreamResponse(prompt, res, userId);
    }
    throw new Error("No LLM provider configured");
};

module.exports = { generateLLMResponse, generateLLMStreamResponse };