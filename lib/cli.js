#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const tiny_node_logger_1 = require("tiny-node-logger");
const server_1 = require("./server");
(0, tiny_node_logger_1.log)("starting server...");
(0, server_1.createServer)();
//# sourceMappingURL=cli.js.map