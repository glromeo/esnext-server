import log, {LogLevel} from "tiny-node-logger";
import fs from "fs";
import path from "path";
import http from "http";
import http2 from "http2";
import https from "https";
import {WatchOptions} from "chokidar";

export type Args = {
    basedir?: string
    config?: string
    module?: string
    debug?: boolean
}

export type Config = {
    extends?: Config
    basedir: string
    log: {
        level: LogLevel
    }
    server: {
        protocol: "http" | "https"
        host: string
        port: number
        http2: "push" | "preload" | false
        options: http.ServerOptions | https.ServerOptions | http2.ServerOptions | http2.SecureServerOptions
    },
    watcher: WatchOptions
}

export function configure(args?: Args): Readonly<Config> {

    const basedir = args?.basedir ?? process.cwd();
    const config = path.resolve(basedir, args?.config ?? "server.config.js");

    function readTextFileSync(filename: string) {
        try {
            return fs.readFileSync(path.resolve(basedir, filename), "utf-8");
        } catch (ignored) {
            return fs.readFileSync(path.resolve(__dirname, "..", filename), "utf-8");
        }
    }

    const defaults: Config = {
        basedir,
        log: {
            level: "info"
        },
        server: {
            protocol: "https",
            host: "0.0.0.0",
            port: 3000,
            http2: "preload",
            options: {
                get key() {
                    return readTextFileSync("cert/localhost.key");
                },
                get cert() {
                    return readTextFileSync("cert/localhost.crt");
                },
                allowHTTP1: true
            }
        },
        watcher: {
            cwd: basedir,
            atomic: false,
            disableGlobbing: true,
            ignoreInitial: true
        }
    };

    const paths = () => [
        path.relative(basedir, config),
        basedir === process.cwd() ? "current directory" : `'${basedir}'`
    ];

    if (!fs.existsSync(config)) {
        const [what, where] = paths();
        log.info(`no '${what}' found in ${where}, using default configuration`);
        return Object.freeze(defaults);
    }

    try {
        const configurator: (config: Config) => Config = require(config);
        return configurator(defaults) ?? defaults;
    } catch (error) {
        const [what, where] = paths();
        log.error(`unable to load config '${what}' from ${where}\n`, error);
        process.exit(1);
    }
}