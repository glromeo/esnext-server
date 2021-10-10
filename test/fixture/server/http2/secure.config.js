const fs = require("fs");
/**
 * @param {import("../../index").Config} config
 */
module.exports = config => {
    config.server.protocol = "https";
    config.server.http2 = "push";
    config.server.host = "localhost";
    config.server.port = 4002;

    config.server.options.cert = fs.readFileSync("./self-signed.cert", "utf8");
    config.server.options.key = fs.readFileSync("./self-signed.key", "utf8");
}