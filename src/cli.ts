#!/usr/bin/env node
/********************************************
 *──────────────────────────────────────────*
 *─██████████████─██████─────────██████████─*
 *─██░░░░░░░░░░██─██░░██─────────██░░░░░░██─*
 *─██░░██████████─██░░██─────────████░░████─*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██████████─██░░██████████─████░░████─*
 *─██░░░░░░░░░░██─██░░░░░░░░░░██─██░░░░░░██─*
 *─██████████████─██████████████─██████████─*
 *──────────────────────────────────────────*
 ********************************************/

import "source-map-support/register";
import log from "tiny-node-logger";
import yargs from "yargs";
import {configure} from "./configure";
import {startServer} from "./server";
import process from "process";

const args = yargs
    .scriptName("esnext-server")
    .usage("$0 <cmd> [args]")
    .option("basedir", {
        alias: ["b"],
        description: "The directory containing the project (defaults to the process current working directory)",
        type: "string",
        default: process.cwd()
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

const config = configure(args);

log.level = config.log.level;

startServer(config).then(runtime => {

    process.on("unhandledRejection", (reason, p) => {
        log.error("Unhandled Rejection at Promise", p, reason);
    });

    process.on("uncaughtException", err => {
        log.error("Uncaught Exception thrown", err);
    });

    process.on("SIGINT", async () => {
        log.info("ctrl+c detected...");
        await new Promise(done => {
            runtime.shutdown().then(done);
            setTimeout(done, SHUTDOWN_TIMEOUT);
        });
        process.exit(TERMINATED_BY_CTRL_C);
    });

    process.on("exit", () => {
        log.info("done");
    });

}).catch(error => {
    log.error("unable to start server", error);
    process.exit(CANNOT_EXECUTE);
});

