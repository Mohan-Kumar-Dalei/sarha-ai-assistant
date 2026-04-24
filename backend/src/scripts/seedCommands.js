const mongoose = require("mongoose");
const Command = require("../models/command.model");
const commands = require("../config/defaultCommands");
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
};

const seed = async () => {
    try {
        await connectDB();

        await Command.deleteMany();
        await Command.insertMany(commands);

        console.log("✅ Commands added");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();