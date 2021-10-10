const fs = require("fs");

/**
 * @param {import("../index").Config} config
 */
module.exports = config => {
    config.server.protocol = "https";
    config.server.http2 = "push";
    config.server.host = "localhost";
    config.server.port = 8000;
    config.messaging.plugins = [require("./messaging.plugin")];
}