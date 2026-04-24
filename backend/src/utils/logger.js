const logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ""),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    debug: (msg) => process.env.DEBUG && console.log(`[DEBUG] ${msg}`)
};

module.exports = logger;