const commands = [
    {
        intent: "OPEN_CHROME",
        patterns: ["open", "start", "launch"],
    },
    {
        intent: "SEARCH_GOOGLE",
        patterns: ["search", "google"],
    },
    {
        intent: "SEARCH_YOUTUBE",
        patterns: ["youtube", "play on youtube"],
    },
];

module.exports = commands;