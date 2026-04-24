require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require('cookie-parser');
const app = require("./src/app");
const connectDB = require("./src/config/db");
const setupSockets = require("./src/socket/socket")
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3000;

// 1. Create HTTP Server using Express app
const server = http.createServer(app);

// 2. Initialize Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: "*", // Development ke liye *, production mein frontend URL daalna
        methods: ["GET", "POST"],
        credential: true
    }
});


// 3. DB connect
connectDB();

// 4. Setup Sockets
setupSockets(io);

// 5. App.listen ki jagah Server.listen use karenge
server.listen(PORT, () => {
    console.log(`🚀 Server and WebSockets running on port ${PORT}`);
});