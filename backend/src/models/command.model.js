const mongoose = require("mongoose");

const commandSchema = new mongoose.Schema({
    name: String,        // chrome
    intent: String,      // OPEN_APP
    patterns: [String],  // ["open chrome", "chrome kholo"]
    command: String      // path or command
});

module.exports = mongoose.model("Command", commandSchema);