module.exports = [
    {
        name: "chrome",
        intent: "OPEN_APP",
        patterns: ["open chrome", "chrome kholo"],
        command: "start chrome"
    },
    {
        name: "youtube",
        intent: "SEARCH_YOUTUBE",
        patterns: ["youtube", "youtube search", "search youtube", "play on youtube", "open youtube"],
        command: "https://www.youtube.com/results?search_query="
    },
    {
        name: "google",
        intent: "SEARCH_GOOGLE",
        patterns: ["search", "google"],
        command: "https://www.google.com/search?q="
    }
];