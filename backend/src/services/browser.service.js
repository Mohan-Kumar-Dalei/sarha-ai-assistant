const puppeteer = require("puppeteer");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs");
const os = require("os");

// 🌐 Browser aur Page setup
let globalBrowser = null;
let globalPage = null;

// 🛠️ SMART BROWSER PATH DISCOVERY LOGIC
const getBrowserPath = () => {
    // 1. Render Environment Variable Check
    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
        console.log(`🌐 [SYSTEM] Using ENV Browser at: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const platform = os.platform();
    let paths = [];

    if (platform === 'win32') { // Windows
        paths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
        ];
    } else if (platform === 'darwin') { // Mac
        paths = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
    } else if (platform === 'linux') { // Linux (Render Fallbacks)
        paths = [
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser'
        ];

        // 🔥 RENDER ULTIMATE FIX: Dynamically find Chrome in project folder
        try {
            // process.cwd() tumhara 'backend' folder hoga
            const cacheChromeDir = path.join(process.cwd(), ".cache", "puppeteer", "chrome");

            if (fs.existsSync(cacheChromeDir)) {
                // Folder ke andar ke versions padho (e.g., 'linux-147.0.7727.56')
                const versions = fs.readdirSync(cacheChromeDir);
                if (versions.length > 0) {
                    // Exact path banao bina version number hardcode kiye
                    const exactChromePath = path.join(cacheChromeDir, versions[0], "chrome-linux64", "chrome");

                    // isko list mein sabse upar daal do taaki sabse pehle yahi check ho
                    paths.unshift(exactChromePath);
                }
            }
        } catch (err) {
            console.log("⚠️ [SYSTEM] Cache search error:", err.message);
        }
    }

    // 2. Local OS Discovery
    for (let p of paths) {
        if (fs.existsSync(p)) {
            console.log(`🌐 [SYSTEM] Found & Using Browser at: ${p}`);
            return p;
        }
    }

    // 3. Fallback
    console.log(`🌐 [SYSTEM] Local browser not found. Using Puppeteer's default.`);
    return null;
};

const getSharedPage = async () => {
    // FIX 1: Browser Connection Check
    if (globalBrowser && !globalBrowser.isConnected()) {
        console.log("[SYSTEM] Browser was closed. Restarting...");
        globalBrowser = null;
        globalPage = null;
    }

    // FIX 2: Page Closure Check
    if (globalPage && globalPage.isClosed()) {
        console.log("[SYSTEM] Page was closed. Opening new tab...");
        globalPage = null;
    }

    if (!globalBrowser) {
        const isProduction = process.env.NODE_ENV === 'production';

        globalBrowser = await puppeteer.launch({
            // 🔥 RENDER FIX: Production mein headless true hona zaroori hai
            headless: isProduction ? "new" : false,
            defaultViewport: null,
            // 🛑 RENDER FIX: Production mein userDataDir ko handle karna mushkil hota hai, isliye sirf local mein rakhein
            userDataDir: isProduction ? null : path.join(__dirname, "../../../browser_session"),
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-position=maximized',
                '--disable-dev-shm-usage',
                '--disable-gpu', // Render par GPU nahi hota
                '--no-first-run',
                '--no-zygote',
                '--single-process' // Memory bachane ke liye Render par useful hai
            ],
            executablePath: getBrowserPath(),
            ignoreHTTPSErrors: true,
        });

        const context = globalBrowser.defaultBrowserContext();
        await context.overridePermissions('https://www.google.com', ['geolocation']);
        await context.overridePermissions('https://zoom.earth', ['geolocation']);
    }

    if (!globalPage) {
        const pages = await globalBrowser.pages();
        globalPage = pages.length > 0 ? pages[0] : await globalBrowser.newPage();
    }

    try {
        await globalPage.bringToFront();
    } catch (error) {
        globalPage = await globalBrowser.newPage();
    }

    return globalPage;
};

const openYouTubeSearch = async (query) => {
    try {
        const page = await getSharedPage();
        await page.goto("https://www.youtube.com", { waitUntil: "domcontentloaded", timeout: 20000 });

        const selectors = ["input[aria-label='Search']", "input[placeholder='Search']", "input#search", "input[name='search_query']"];
        let found = false;
        for (let sel of selectors) {
            try {
                await page.waitForSelector(sel, { timeout: 3000 });
                await page.click(sel, { clickCount: 3 });
                await page.type(sel, query);
                found = true;
                break;
            } catch (e) { }
        }

        if (found) await page.keyboard.press("Enter");
        return found;
    } catch (error) {
        logger.error("YouTube browser error:", error.message);
        return false;
    }
};

const checkAndOpenWeather = async (location = "Bhubaneswar") => {
    try {
        const page = await getSharedPage();
        const searchQuery = encodeURIComponent(`weather in ${location}`);

        await page.goto(`https://www.google.com/search?q=${searchQuery}&hl=en`, { waitUntil: "domcontentloaded", timeout: 20000 });

        let temp = "N/A", condition = "N/A", humidity = "N/A", wind = "N/A", rain = "N/A";
        try {
            await page.waitForSelector('#wob_tm', { timeout: 5000 });
            temp = await page.$eval('#wob_tm', el => el.innerText);
            condition = await page.$eval('#wob_dc', el => el.innerText);
            humidity = await page.$eval('#wob_hm', el => el.innerText);
            wind = await page.$eval('#wob_ws', el => el.innerText);
            rain = await page.$eval('#wob_pp', el => el.innerText);
        } catch (e) {
            logger.warn("Detailed weather fetch failed, basic info only.");
        }

        // Zoom Earth logic
        const safeCityName = location.split(" ")[0].trim().toLowerCase();
        const zoomEarthUrl = `https://zoom.earth/places/india/${safeCityName}/`;

        // Background mein Zoom Earth khol do
        page.goto(zoomEarthUrl).catch(e => console.log("Zoom Earth Load failed"));

        return `Temperature: ${temp}°C, Condition: ${condition}, Wind: ${wind}, Humidity: ${humidity}, Rain Probability: ${rain}`;
    } catch (error) {
        logger.error("Weather browser error:", error.message);
        return "Weather fetch failed.";
    }
};

module.exports = { openYouTubeSearch, checkAndOpenWeather };