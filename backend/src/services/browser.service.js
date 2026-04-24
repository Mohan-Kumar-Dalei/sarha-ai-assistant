const puppeteer = require("puppeteer");
const logger = require("../utils/logger");
const path = require("path");

// 🔥 Global browser aur page define kiya taaki baar-baar naya window na khule
let globalBrowser = null;
let globalPage = null;

const getSharedPage = async () => {
    // 🔥 FIX 1: Agar kisi ne manual browser (Chrome) close kar diya hai, toh usko null karo
    if (globalBrowser && !globalBrowser.isConnected()) {
        console.log("[SYSTEM] Browser was closed manually. Restarting...");
        globalBrowser = null;
        globalPage = null;
    }

    // 🔥 FIX 2: Agar kisi ne sirf Tab (Page) close kar diya hai
    if (globalPage && globalPage.isClosed()) {
        console.log("[SYSTEM] Page was closed manually. Opening new tab...");
        globalPage = null;
    }

    // Naya browser launch logic (Same as before)
    if (!globalBrowser) {
        globalBrowser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            userDataDir: path.join(__dirname, "../../../browser_session"),
            args: [
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-position=maximized',
                '--disable-setuid-sandbox',
                '--ignore-gpu-blocklist',
                '--enable-webgl',
                '--disable-infobars',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--allow-running-insecure-content',
                '--disable-site-isolation-trials',
                '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
                '--disable-features=CrossSiteDocumentBlockingIfIsolating,CrossSiteDocumentBlockingAlways',
                '--disable-features=CrossSiteDocumentBlockingNever',
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            ignoreDefaultArgs: ['--disable-extensions'],
            ignoreHTTPSErrors: true,
        });

        const context = globalBrowser.defaultBrowserContext();
        await context.overridePermissions('https://www.google.com', ['geolocation']);
        await context.overridePermissions('https://zoom.earth', ['geolocation']);
    }

    // Agar page dead hai ya abhi tak bana nahi, toh naya page banao
    if (!globalPage) {
        const pages = await globalBrowser.pages();
        globalPage = pages.length > 0 ? pages[0] : await globalBrowser.newPage();
    }

    // 🔥 FIX 3: Try-Catch around bringToFront (100% Crash Proof)
    try {
        await globalPage.bringToFront();
    } catch (error) {
        console.log("[SYSTEM] Recovering from page bringToFront error...");
        globalPage = await globalBrowser.newPage();
        await globalPage.bringToFront();
    }

    return globalPage;
};

const openYouTubeSearch = async (query) => {
    try {
        const page = await getSharedPage();
        await page.goto("https://www.youtube.com", { waitUntil: "domcontentloaded", timeout: 10000 });

        const selectors = ["input[aria-label='Search']", "input[placeholder='Search']", "input#search", "input[name='search_query']", "#search"];
        let found = false;
        for (let sel of selectors) {
            try {
                await page.waitForSelector(sel, { timeout: 2000 });
                await page.click(sel, { clickCount: 3 }); // Puraana text clear karo
                await page.type(sel, query);
                found = true;
                break;
            } catch (e) { }
        }

        if (!found) return false;
        await page.keyboard.press("Enter");
        return true;
    } catch (error) {
        logger.error("Browser error:", error.message);
        return false;
    }
};

const checkAndOpenWeather = async (location = "Bhubaneswar") => {
    try {
        const page = await getSharedPage();

        // 1. Google Weather Data extract karna
        const searchQuery = encodeURIComponent(`weather in ${location}`);
        await page.goto(`https://www.google.com/search?q=${searchQuery}&hl=en`, { waitUntil: "domcontentloaded" });

        let temp = "N/A", condition = "N/A", humidity = "N/A", wind = "N/A", rain = "N/A";
        try {
            await page.waitForSelector('#wob_tm', { timeout: 3000 });
            temp = await page.$eval('#wob_tm', el => el.innerText);
            condition = await page.$eval('#wob_dc', el => el.innerText);
            humidity = await page.$eval('#wob_hm', el => el.innerText);
            wind = await page.$eval('#wob_ws', el => el.innerText);
            rain = await page.$eval('#wob_pp', el => el.innerText);
        } catch (e) {
            logger.warn("Detailed weather fetch failed");
        }

        // 2. Zoom Earth open karna
        const safeCityName = location.split(" ")[0].trim().toLowerCase();
        const zoomEarthUrl = `https://zoom.earth/places/india/${safeCityName}/`;

        await page.goto(zoomEarthUrl, { waitUntil: "domcontentloaded" });

        // 🔥 Sirf raw data return karenge, AI khud detailed sentence banayegi
        return `Temperature: ${temp}°C, Condition: ${condition}, Wind: ${wind}, Humidity: ${humidity}, Rain Probability: ${rain}`;
    } catch (error) {
        logger.error("Weather browser error:", error.message);
        return "Weather fetch failed.";
    }
};

module.exports = { openYouTubeSearch, checkAndOpenWeather };