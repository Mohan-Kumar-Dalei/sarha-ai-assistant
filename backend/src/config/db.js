const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"])
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                console.log("Connected to MongoDB");
            })
            .catch((err) => {
                console.log(err);
            });
    } catch (error) {
        console.error("DB Error:", error);
        process.exit(1);
    }
};

module.exports = connectDB;