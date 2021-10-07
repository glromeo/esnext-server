/**
 * @param {import("../../index").Config} config
 */
module.exports = config => {
    config.server.protocol = "https";
    config.server.http2 = false;
    config.server.port = 4003;
}