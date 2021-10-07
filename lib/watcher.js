"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWatcher = void 0;
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const chokidar_1 = __importDefault(require("chokidar"));
const chalk_1 = __importDefault(require("chalk"));
const use_memo_1 = require("./utils/use-memo");
exports.useWatcher = (0, use_memo_1.useMemo)(config => {
    const watcher = chokidar_1.default.watch([], config.watcher);
    tiny_node_logger_1.default.debug("created workspace watcher");
    watcher.on("ready", () => tiny_node_logger_1.default.info("workspace watcher is", chalk_1.default.bold("ready")));
    if (tiny_node_logger_1.default.includes("debug")) {
        watcher.on("all", (event, file) => tiny_node_logger_1.default.debug("watcher", event, file));
        const close = watcher.close;
        watcher.close = function () {
            return close.apply(this).then(() => {
                tiny_node_logger_1.default.debug("workspace watcher closed");
            });
        };
    }
    return watcher;
});
//# sourceMappingURL=watcher.js.map