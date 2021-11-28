import log from "tiny-node-logger";
import fs from "fs";
import path from "path";
import {MessagingConfig} from "./messaging";
import {ServerConfig} from "./server";
import {WatcherConfig} from "./watcher";
import {CorsOptions} from "cors";

export type Args = {
    basedir?: string
    config?: string
    module?: string
    debug?: boolean
}

export type Config = {
    basedir: string
    server?: ServerConfig,
    watcher?: WatcherConfig,
    messaging?: MessagingConfig,
    resources?: string,
    cors?: CorsOptions
}

export function configure(args?: Args): Readonly<Config> {

    const basedir = args?.basedir ?? process.cwd();
    const config = path.resolve(basedir, args?.config ?? "server.config.js");

    const defaults: Config = {
        basedir
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
        return Object.assign(require(config), {basedir});
    } catch (error) {
        const [what, where] = paths();
        log.error(`unable to load config '${what}' from ${where}\n`, error);
        process.exit(1);
    }
}