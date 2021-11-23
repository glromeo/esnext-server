import { LogLevel } from "tiny-node-logger";
import { MessagingConfig } from "./messaging";
import { ServerConfig } from "./server";
import { WatcherConfig } from "./watcher";
export declare type Args = {
    basedir?: string;
    config?: string;
    module?: string;
    debug?: boolean;
};
export declare type Config = {
    basedir: string;
    log: {
        level?: LogLevel;
    };
    server?: ServerConfig;
    watcher?: WatcherConfig;
    messaging?: MessagingConfig;
    resources?: string;
};
export declare function configure(args?: Args): Readonly<Config>;
