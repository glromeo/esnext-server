const fs = require("fs");
/**
 * @type {import("../../index").Config}
 */
module.exports = {
    server: {
        protocol: "https",
        http2: "push",
        host: "localhost",
        port: 4002,
        options: {
            key: fs.readFileSync("./self-signed.key", "utf8"),
            cert: fs.readFileSync("./self-signed.cert", "utf8")
        }
    }
}