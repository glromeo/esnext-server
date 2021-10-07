/**
 * @param {import("../../index").Config} config
 */
module.exports = config => {
    config.server.protocol = "http";
    config.server.http2 = false;
    config.server.port = 4000;
}