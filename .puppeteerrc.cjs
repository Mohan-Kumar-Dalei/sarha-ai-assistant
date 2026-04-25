const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Ye Puppeteer ko Chrome humare project folder ke andar save karne ko bolega
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};