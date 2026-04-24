const { executeAction } = require("../services/action.service");
const { generateChatResponse } = require("../services/chat.service");
const { addToMemory } = require("../services/memory.service");
const logger = require("../utils/logger");

const setupSockets = (io) => {
    io.on("connection", (socket) => {
        logger.info(`🔌 User connected via socket: ${socket.id}`);

        // Jab user message bheje
        socket.on("send_message", async (data) => {
            try {
                // Frontend se data expect kar rahe hain: { message: "kuch text", userId: "user123" }
                const { message, userId = "anonymous-user" } = data;

                if (!message || message.trim() === "") return;

                // Turant frontend ko batao ki AI process kar raha hai (typing indicator ke liye)
                socket.emit("processing", { status: "typing..." });

                await addToMemory(userId, `User: ${message}`);

                // 🔥 COMMAND DETECTION (No execution yet)
                const actionResult = await executeAction(message, false);

                let finalResponse;

                if (actionResult) {
                    // Command was detected
                    const chat = await generateChatResponse(
                        `User asked to perform: ${message}. Respond naturally confirming action.`,
                        userId
                    );
                    finalResponse = chat;

                    await addToMemory(userId, `Sarha: ${finalResponse}`);

                    // Send response FIRST via socket
                    socket.emit("receive_message", {
                        success: true,
                        result: finalResponse,
                        type: "command"
                    });

                    // Execute action AFTER response
                    executeAction(message, true).catch(err =>
                        logger.error("Async action error:", err)
                    );
                } else {
                    // Normal chat
                    finalResponse = await generateChatResponse(message, userId);
                    await addToMemory(userId, `Sarha: ${finalResponse}`);

                    // Send normal chat response via socket
                    socket.emit("receive_message", {
                        success: true,
                        result: finalResponse,
                        type: "chat"
                    });
                }
            } catch (error) {
                logger.error("Socket error processing message:", error);
                socket.emit("error", {
                    success: false,
                    message: "Sorry, network error ya AI timeout ho gaya."
                });
            }
        });

        // Jab user disconnect ho jaye
        socket.on("disconnect", () => {
            logger.info(`🔴 User disconnected: ${socket.id}`);
        });
    });
};

module.exports = setupSockets;