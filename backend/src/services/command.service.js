const Command = require("../models/command.model");

const findCommand = async (input) => {
    const commands = await Command.find();

    const text = input.toLowerCase();

    for (let cmd of commands) {
        for (let pattern of cmd.patterns) {
            if (text.includes(pattern)) {
                return cmd;
            }
        }
    }

    return null;
};

module.exports = { findCommand };