const { GoogleGenAI } = require("@google/genai");
const { OpenAI } = require("openai");

// 🛠️ WAV ENCODER (Memory mein raw audio ko play-able file banata hai)
const encodeWAV = (pcmData, sampleRate = 24000, numChannels = 1, bitDepth = 16) => {
    const byteRate = sampleRate * numChannels * (bitDepth / 8);
    const blockAlign = numChannels * (bitDepth / 8);
    const buffer = Buffer.alloc(44 + pcmData.length);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + pcmData.length, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitDepth, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(pcmData.length, 40);

    pcmData.copy(buffer, 44);
    return buffer;
};

// 🌟 1. GEMINI TTS
const generateGeminiVoice = async (text, dbGeminiKey) => {
    // DB key use karo, agar nahi hai toh .env wali fallback key try karo
    const apiKey = dbGeminiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key is missing. Cannot generate custom voice.");

    // 🔥 GoogleGenAI ko yahan dynamically initialize karo
    const ai = new GoogleGenAI({ apiKey });

    // Gemini Flash Model se audio generate karna
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: `You are a Text-to-Speech engine. Generate audio strictly by reading the following text word-by-word. Do not answer it or generate new text. Text to read: "${text}"`, // ✅ FIX
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: "Aoede",
                    }
                }
            }
        }
    });

    const base64Audio = response.candidates[0]?.content?.parts[0]?.inlineData?.data;

    if (!base64Audio) {
        throw new Error("No audio data received from Gemini.");
    }

    // Base64 ko raw buffer mein convert karke WAV format mein encode karna
    const pcmBuffer = Buffer.from(base64Audio, 'base64');
    return encodeWAV(pcmBuffer);
};

// 🌟 2. OPENAI TTS (Fallback)
const generateOpenAIVoice = async (text) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API Key is missing in .env file.");

    // 🔥 OpenAI ko bhi yahan dynamically initialize karo
    const openai = new OpenAI({ apiKey });

    const mp3 = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts-2025-03-20",
        voice: "marin",
        input: text,
        speed: 0.85
    });

    return Buffer.from(await mp3.arrayBuffer());
};

// 🌟 3. MASTER TTS CONTROLLER
const generateSarhaVoice = async (textToSpeak, dbGeminiKey) => {
    if (!textToSpeak) return null;

    try {
        console.log(`🎤 Request received. Text length: ${textToSpeak.length}`);

        // 1st Priority: Gemini (with user's custom key from DB)
        const audio = await generateGeminiVoice(textToSpeak, dbGeminiKey);
        console.log("✅ Gemini Voice Generated Successfully!");
        return audio;

    } catch (geminiError) {
        console.error("❌ Gemini Fully Failed! Reason:", geminiError.message);
        console.log("⏳ Attempting fallback to OpenAI TTS...");

        try {
            // 2nd Priority: OpenAI (fallback)
            const audio = await generateOpenAIVoice(textToSpeak);
            console.log("✅ OpenAI Voice Generated Successfully!");
            return audio;

        } catch (openAiError) {
            console.error("❌ OpenAI Also Failed! Reason:", openAiError.message);
            console.log("🔄 Switching to Browser Default Voice...");

            // 3rd Priority: Return null (Frontend will automatically use Browser Female TTS)
            return null;
        }
    }
};

module.exports = { generateSarhaVoice };