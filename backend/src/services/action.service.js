const { exec } = require("child_process");
const { checkAndOpenWeather, openYouTubeSearch } = require("./browser.service");
const { getTime, getDate } = require("../utils/dateTime");

const appCommands = {
    "start chrome": ["chrome", "google chrome"],
    "start msedge": ["edge", "microsoft edge"],
    "start firefox": ["firefox", "mozilla"],
    "code": ["vs code", "vscode", "visual studio code", "bs4", "bsc", "v s code", "base code"],
    "start notepad": ["notepad", "note pad", "text editor"],
    "calc": ["calculator", "calc", "math"],
    "start spotify": ["spotify", "music player", "gana bajao", "gana baja sakte ho"],
    "start brave": ["brave", "brave browser", " web browser", "prem browser", "favorite browser"],
    "start whatsapp://": ["whatsapp", "whats app", "watsapp"]
};

// 🛑 SMART APP CLOSE DICTIONARY
const appCloseCommands = {
    "chrome.exe": ["chrome", "google chrome", "browser"],
    "msedge.exe": ["edge", "microsoft edge"],
    "firefox.exe": ["firefox", "mozilla"],
    "Code.exe": ["vs code", "vscode", "visual studio code", "bs4", "bsc", "v s code"],
    "notepad.exe": ["notepad", "note pad", "text editor"],
    "calculator.exe": ["calculator", "calc", "math"],
    "Spotify.exe": ["spotify", "music player"],
    "brave.exe": ["brave", "brave browser", "web browser", "prem browser", "favorite browser"],
    "WhatsApp.exe": ["whatsapp", "whats app", "watsapp"]
};

const cleanInput = (text) => {
    return text
        .toLowerCase()
        .replace(/sarha|sara|please|karo|kar do|open|khol|launch|start|search|mera|my|kya|hai|ho|han|aur|batao|kaisa/g, "")
        .trim();
};

const openApplication = (input, execute = true) => {
    const text = input.toLowerCase();

    for (const [command, keywords] of Object.entries(appCommands)) {
        for (const keyword of keywords) {
            if (text.includes(`open ${keyword}`) || text.includes(`${keyword} kholo`) || text.includes(keyword)) {
                const appNameToSpeak = keywords[0];

                if (!execute) {
                    return `Sir, main ${appNameToSpeak} open kar rahi hoon.`;
                } else {
                    console.log(`[SYSTEM] Opening ${appNameToSpeak} with command: ${command}`);

                    exec(process.platform === 'win32' ? command : `open -a "${appNameToSpeak}"`, (error) => {
                        if (error) {
                            console.error(`❌ Failed to open ${appNameToSpeak}:`, error.message);
                        }
                    });
                    return "APP_OPENED";
                }
            }
        }
    }
    return null;
};

// 🛠️ FUNCTION TO CLOSE APP
const closeApplication = (input, execute = true) => {
    const text = input.toLowerCase();

    if (text.includes("close") || text.includes("band") || text.includes("exit") || text.includes("kill")) {
        for (const [processName, keywords] of Object.entries(appCloseCommands)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    const appNameToSpeak = keywords[0];

                    if (!execute) {
                        return `Sir, main ${appNameToSpeak} close kar rahi hoon.`;
                    } else {
                        console.log(`[SYSTEM] Closing ${appNameToSpeak} (Process: ${processName})`);

                        const command = process.platform === 'win32'
                            ? `taskkill /F /IM ${processName} /T`
                            : `pkill -f "${appNameToSpeak}"`;

                        exec(command, (error) => {
                            if (error) {
                                console.error(`❌ Failed to close ${appNameToSpeak}:`, error.message);
                            }
                        });
                        return "APP_CLOSED";
                    }
                }
            }
        }
    }
    return null;
};

const executeAction = async (input, execute = true) => {
    if (!input) return null;
    const text = input.toLowerCase();

    // 🛑 1. SHUTDOWN
    if (text.includes("shutdown") || text.includes("shutdown the system") || text.includes("laptop band karo") || text.includes("system band karo") || text.includes("system ko shutdown kardo")) {
        if (!execute) {
            return "System shutdown initiated";
        } else {
            const command = process.platform === 'win32' ? 'shutdown /s /f /t 5' : 'shutdown -h +1';
            console.log(`[SYSTEM] Shutting down in 5 seconds...`);
            exec(command, (error) => {
                if (error) {
                    console.error("❌ Shutdown Failed:", error.message);
                }
            });
            return "System shutdown initiated";
        }
    }

    // 😴 2. SLEEP
    if (text.includes("so jao") || text.includes("sleep mode") || text.includes("chup ho jao")) {
        return "SLEEP_TRIGGER";
    }

    // 🕒 3. TIME/DATE
    if (["kya time", "time kya", "kitna baje", "time batao"].some(q => text.includes(q)) || text.trim() === "time") return `Abhi time hai ${getTime()}`;
    if (["aaj ki date", "kya date", "tarikh kya", "date batao"].some(q => text.includes(q)) || text.trim() === "date") return `Aaj ki date hai ${getDate()}`;

    // 🌤️ 4. WEATHER
    const weatherQuestions = ["weather", "mausam", "barish", "temperature"];
    if (weatherQuestions.some(q => text.includes(q))) {
        let loc = "Bhubaneswar";
        if (text.includes(" in ")) loc = text.split(" in ").pop().trim();
        else if (text.includes(" of ")) loc = text.split(" of ").pop().trim();
        else {
            let cleaned = cleanInput(text).replace(/weather|mausam|information|details/g, "").trim();
            if (cleaned.length > 0 && cleaned.split(" ").length <= 3) loc = cleaned;
        }
        loc = loc.replace(/today|tomorrow|now|information|details/g, "").trim();
        if (!loc) loc = "Bhubaneswar";

        if (!execute) {
            const details = await setTimeout(() => checkAndOpenWeather(loc), 30000);
            return `WEATHER_DATA:${loc}|${details}`;
        } else {
            return "Weather already opened";
        }
    }

    // 🔥 5. YOUTUBE (SMART SEARCH)
    if (text.includes("youtube")) {
        let rawQuery = text
            .replace(/okay now/g, "")
            .replace(/open youtube/g, "")
            .replace(/youtube open karo/g, "")
            .replace(/youtube par/g, "")
            .replace(/on youtube/g, "")
            .replace(/youtube/g, "")
            .replace(/\band\b/g, "")
            .replace(/\baur\b/g, "")
            .replace(/\bplease\b/g, "")
            .replace(/search karo/g, "")
            .replace(/search for/g, "")
            .replace(/search/g, "")
            .replace(/play/g, "")
            .replace(/chalao/g, "")
            .replace(/lagao/g, "")
            .replace(/karo/g, "")
            .replace(/open/g, "")
            .replace(/okay/g, "")
            .replace(/kya/g, "")
            .replace(/sar/g, "")
            .replace(/sara/g, "")
            .replace(/sarha/g, "")
            .replace(/tum/g, "")
            .replace(/kar/g, "")
            .replace(/sakte/g, "")
            .replace(/hoon/g, "")
            .replace(/hai/g, "")
            .replace(/mere/g, "")
            .replace(/liye/g, "")
            .trim();

        let query = cleanInput(rawQuery);

        if (execute) openYouTubeSearch(query || "");
        return query ? `YouTube par ${query} search kar rahi hoon` : "YouTube khol rahi hoon";
    }

    // 🎵 6. SPOTIFY (SMART SEARCH & PLAY)
    if (text.includes("spotify") || text.includes("gana play karo") || text.includes("play song")) {
        let rawQuery = text
            .replace(/okay now/g, "")
            .replace(/open spotify/g, "")
            .replace(/spotify open karo/g, "")
            .replace(/spotify par/g, "")
            .replace(/on spotify/g, "")
            .replace(/spotify/g, "")
            .replace(/\band\b/g, "")
            .replace(/\baur\b/g, "")
            .replace(/\bplease\b/g, "")
            .replace(/search karo/g, "")
            .replace(/search for/g, "")
            .replace(/search/g, "")
            .replace(/play/g, "")
            .replace(/gana/g, "")
            .replace(/song/g, "")
            .replace(/chalao/g, "")
            .replace(/bajao/g, "")
            .replace(/lagao/g, "")
            .replace(/karo/g, "")
            .replace(/open/g, "")
            .replace(/okay/g, "")
            .replace(/sar/g, "")
            .replace(/sara/g, "")
            .replace(/sarha/g, "")
            .replace(/tum/g, "")
            .replace(/kar/g, "")
            .replace(/sakte/g, "")
            .replace(/hoon/g, "")
            .replace(/hai/g, "")
            .replace(/mere/g, "")
            .replace(/liye/g, "")
            .trim();

        let query = cleanInput(rawQuery);

        if (execute) {
            if (query) {
                console.log(`[SYSTEM] Searching Spotify for: ${query}`);

                // Native Desktop App URI Search
                const command = process.platform === 'win32'
                    ? `start spotify:search:${encodeURIComponent(query)}`
                    : `open "spotify:search:${encodeURIComponent(query)}"`;

                exec(command, (error) => {
                    if (error) {
                        console.error("❌ Spotify App failed to open, falling back to Web browser:", error.message);
                        // Fallback: Agar App nahi khuli toh Browser me khol dega
                        const webUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
                        const fallbackCmd = process.platform === 'win32' ? `start "" "${webUrl}"` : `open "${webUrl}"`;
                        exec(fallbackCmd);
                    }
                });
            } else {
                // Agar user ne sirf "open spotify" bola hai bina kisi gaane ke
                exec(process.platform === 'win32' ? "start spotify" : "open -a Spotify");
            }
        }

        return query ? `Sir, main Spotify par ${query} play kar rahi hoon.` : "Spotify open kar rahi hoon.";
    }

    // 🛑 7. SABSE PEHLE APP CLOSE CHECK KARO
    const closeResponse = closeApplication(text, execute);
    if (closeResponse) {
        return closeResponse;
    }

    // ⚙️ 8. OPEN APPS
    const appResponse = openApplication(text, execute);
    if (appResponse) {
        return appResponse;
    }

    return null;
};

module.exports = { executeAction };