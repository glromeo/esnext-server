"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessaging = void 0;
const use_memo_1 = require("./utils/use-memo");
const multi_map_1 = require("./utils/multi-map");
const chalk_1 = __importDefault(require("chalk"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const ws_1 = __importDefault(require("ws"));
const watcher_1 = require("./watcher");
exports.useMessaging = (0, use_memo_1.useMemo)(config => {
    const { messaging: { plugins = [] } = {} } = config;
    const sockets = new Set();
    function broadcast(type, data) {
        const message = data === undefined ? type : JSON.stringify({ type, data });
        for (const ws of sockets) {
            ws.send(message);
        }
    }
    const callbacks = new multi_map_1.MultiMap();
    function on(type, cb) {
        callbacks.add(type, cb);
        tiny_node_logger_1.default.debug("added message listener for:", chalk_1.default.magenta(type));
    }
    function openCallback(ws) {
        function send(type, data) {
            const message = data === undefined ? type : JSON.stringify({ type, data });
            return ws.send(message);
        }
        tiny_node_logger_1.default.debug("client connected:", ws.url);
        sockets.add(ws);
        ws.on("error", () => {
            tiny_node_logger_1.default.debug("client error:", ws.url);
        });
        ws.on("close", () => {
            tiny_node_logger_1.default.debug("client disconnected:", ws.url);
            sockets.delete(ws);
        });
        ws.on("message", (payload) => {
            var _a;
            const { type, data } = JSON.parse(String(payload));
            for (const callback of (_a = callbacks.get(type)) !== null && _a !== void 0 ? _a : []) {
                callback(data, send);
            }
        });
        ws.send(JSON.stringify({ type: "hello", data: { time: new Date().toUTCString() } }));
    }
    function errorCallback(error) {
        tiny_node_logger_1.default.error("websocket error:", error);
    }
    function closeCallback() {
        tiny_node_logger_1.default.info("websocket closed");
    }
    function handleUpgrade(request, socket, head) {
        if (request.headers["sec-websocket-protocol"] === "esnext-dev") {
            const wss = new ws_1.default.Server({ noServer: true });
            wss.on("open", openCallback);
            wss.on("error", errorCallback);
            wss.on("close", closeCallback);
            wss.handleUpgrade(request, socket, head, client => wss.emit("open", client, request));
            tiny_node_logger_1.default.info("websocket ready");
        }
    }
    const watcher = (0, watcher_1.useWatcher)(config);
    for (const plugin of plugins)
        try {
            plugin({ on, broadcast, config, watcher });
        }
        catch (e) {
            tiny_node_logger_1.default.error("failed to load messaging plugin", e);
        }
    return Object.assign(handleUpgrade, {
        on,
        broadcast
    });
});
//# sourceMappingURL=messaging.js.map