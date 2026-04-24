const { GoogleGenAI } = require("@google/genai"); // Naya import
const User = require("../models/auth.userModel");

const geminiStreamResponse = async (prompt, res, userId) => {

    // 1. Database se User aur uski API key fetch karo
    const user = await User.findById(userId);

    if (!user || !user.geminiApiKey) {
        const errorMsg = "Gemini API key not found. Please setup your key in the dashboard.";
        if (res && !res.writableEnded) {
            res.write(`[ERROR]: ${errorMsg}`);
            res.end();
        }
        throw new Error(errorMsg);
    }

    // 2. 🔥 Naye GoogleGenAI SDK se initialize karo
    const ai = new GoogleGenAI({ apiKey: user.geminiApiKey });

    // Note: 'gemini-2.5-flash' trigger ho sakta hai agar available na ho
    const modelsToTry = [
        "gemini-3-flash-preview",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b"
    ];

    const maxRetries = 3;

    for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[LLM] Attempting stream with ${modelName} (Try ${attempt}/${maxRetries})...`);

                // 🔥 Naya syntax stream generate karne ke liye
                const responseStream = await ai.models.generateContentStream({
                    model: modelName,
                    contents: prompt,
                });

                let fullText = "";

                for await (const chunk of responseStream) {
                    // 🔥 Naye SDK mein chunk.text ek property hai, function nahi
                    const chunkText = chunk.text;

                    if (chunkText) {
                        fullText += chunkText;
                        if (res && !res.writableEnded) {
                            res.write(chunkText);
                        }
                    }
                }

                if (res && !res.writableEnded) res.end();
                return fullText;

            } catch (error) {
                // 🔥 REAL ERROR LOGGING STARTS HERE
                const statusCode = error.status || (error.response && error.response.status);
                let errorMessage = error.message || "Unknown Error";

                console.error(`\n🚨 --- GEMINI ERROR DETECTED ---`);
                console.error(`Status Code: ${statusCode}`);

                // Check for Quota Limit
                if (statusCode === 429) {
                    console.error(`Type: QUOTA EXHAUSTED`);
                    console.error(`Message: Your API key has reached its limit. Please wait or use a different key.`);
                }
                // Check for Invalid API Key
                else if (statusCode === 401 || statusCode === 403) {
                    console.error(`Type: AUTHENTICATION ERROR`);
                    console.error(`Message: Your API Key is invalid or expired.`);
                }
                // Check for Model Not Found
                else if (statusCode === 404) {
                    console.error(`Type: MODEL NOT FOUND`);
                    console.error(`Message: The model '${modelName}' does not exist.`);
                }
                // Check for Safety/Content Blocking
                else if (errorMessage.includes("SAFETY")) {
                    console.error(`Type: CONTENT BLOCKED`);
                    console.error(`Message: The request was blocked by safety filters.`);
                }
                else {
                    console.error(`Raw Message: ${errorMessage}`);
                }
                console.error(`-----------------------------------\n`);

                // RETRY LOGIC
                if ((statusCode === 503 || statusCode === 429) && attempt < maxRetries) {
                    console.log(`[RETRY] Server Busy/Quota Hit. Waiting 2s...`);
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }

                console.log(`[LLM] Switching to next fallback model...`);
                break;
            }
        }
    }
    throw new Error("Critical: All generative models failed to respond.");
};

module.exports = { geminiStreamResponse };