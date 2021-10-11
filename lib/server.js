"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.getCert = exports.getKey = void 0;
const handler_1 = require("./handler");
const watcher_1 = require("./watcher");
const messaging_1 = require("./messaging");
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const fs_1 = require("fs");
const path_1 = require("path");
function manageSockets(server) {
    const sockets = new Set();
    for (const event of ["connection", "secureConnection"])
        server.on(event, function (socket) {
            sockets.add(socket);
            socket.on("close", () => sockets.delete(socket));
        });
    return async function () {
        if (sockets.size > 0) {
            tiny_node_logger_1.default.debug(`destroying ${sockets.size} pending socket...`);
            for (const socket of sockets) {
                socket.destroy();
                sockets.delete(socket);
            }
        }
        else {
            tiny_node_logger_1.default.debug("no pending sockets");
        }
    };
}
function getKey() {
    return (0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, "../cert/localhost.key"), "utf-8");
}
exports.getKey = getKey;
function getCert() {
    return (0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, "../cert/localhost.crt"), "utf-8");
}
exports.getCert = getCert;
async function startServer(config) {
    const watcher = (0, watcher_1.useWatcher)(config);
    const handler = (0, handler_1.useHandler)(config);
    let module, server;
    const { basedir, server: { protocol = "https", host = "0.0.0.0", port = 3000, http2 = "preload", options = {} } = {} } = config;
    if (http2) {
        module = require("http2");
        if (protocol === "http") {
            server = module.createServer({}, handler);
        }
        else {
            const { key = getKey(), cert = getCert(), allowHTTP1 = true } = options;
            server = module.createSecureServer({
                key,
                cert,
                allowHTTP1
            }, handler);
        }
    }
    else {
        if (protocol === "http") {
            module = require("http");
            server = module.createServer({}, handler);
        }
        else {
            module = require("https");
            const { key = getKey(), cert = getCert() } = options;
            server = module.createServer({
                key,
                cert
            }, handler);
        }
    }
    server.on("upgrade", (0, messaging_1.useMessaging)(config));
    await new Promise(resolve => server.listen(port, host, resolve));
    const address = `${protocol}://${host}:${port}`;
    tiny_node_logger_1.default.info(`server started on ${address.replace("0.0.0.0", "localhost")}`);
    const flushSockets = manageSockets(server);
    let closed;
    async function shutdown() {
        return closed !== null && closed !== void 0 ? closed : (closed = (async () => {
            tiny_node_logger_1.default.info("shutting down...");
            const serverClosed = new Promise(resolve => server.close(resolve));
            const watcherClosed = watcher.close();
            const socketsFlushed = flushSockets();
            await Promise.all([
                serverClosed,
                watcherClosed,
                socketsFlushed
            ]);
            tiny_node_logger_1.default.info("server closed");
        })());
    }
    return {
        config,
        module,
        server,
        watcher,
        handler,
        address,
        shutdown
    };
}
exports.startServer = startServer;
//# sourceMappingURL=server.js.map