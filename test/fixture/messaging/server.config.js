/**
 * @type {import("../index").Config}
 */
module.exports = {
    server: {
        port: 8000
    },
    messaging: {
        plugins: [require("./messaging.plugin")]
    }
};