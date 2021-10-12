#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const yargs_1 = __importDefault(require("yargs"));
const configure_1 = require("./configure");
const server_1 = require("./server");
const process_1 = __importDefault(require("process"));
const args = yargs_1.default
    .scriptName("esnext-server")
    .usage("$0 <cmd> [args]")
    .option("basedir", {
    alias: ["b"],
    description: "The directory containing the project (defaults to the process current working directory)",
    type: "string",
    default: process_1.default.cwd()
})
    .option("config", {
    alias: ["c"],
    description: "The config file location (by default 'server.config.js' in the project directory)",
    type: "string"
})
    .option("module", {
    alias: ["m"],
    description: "Add a module (plugin) to the server",
    type: "string"
})
    .option("debug", {
    alias: ["d"],
    description: "debug",
    type: "boolean"
})
    .help()
    .alias("help", "h")
    .parseSync();
const SHUTDOWN_TIMEOUT = 120000;
const TERMINATED_BY_CTRL_C = 130;
const CANNOT_EXECUTE = 126;
const config = (0, configure_1.configure)(args);
tiny_node_logger_1.default.level = (_a = config.log.level) !== null && _a !== void 0 ? _a : "info";
(0, server_1.startServer)(config).then(runtime => {
    process_1.default.on("unhandledRejection", (reason, p) => {
        tiny_node_logger_1.default.error("Unhandled Rejection at Promise", p, reason);
    });
    process_1.default.on("uncaughtException", err => {
        tiny_node_logger_1.default.error("Uncaught Exception thrown", err);
    });
    process_1.default.on("SIGINT", async () => {
        tiny_node_logger_1.default.info("ctrl+c detected...");
        await new Promise(done => {
            runtime.shutdown().then(done);
            setTimeout(done, SHUTDOWN_TIMEOUT);
        });
        process_1.default.exit(TERMINATED_BY_CTRL_C);
    });
    process_1.default.on("exit", () => {
        tiny_node_logger_1.default.info("done");
    });
}).catch(error => {
    tiny_node_logger_1.default.error("unable to start server", error);
    process_1.default.exit(CANNOT_EXECUTE);
});
//# sourceMappingURL=cli.js.map