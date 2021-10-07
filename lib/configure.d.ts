/// <reference types="node" />
import { LogLevel } from "tiny-node-logger";
import http from "http";
import http2 from "http2";
import https from "https";
import { WatchOptions } from "chokidar";
export declare type Args = {
    basedir?: string;
    config?: string;
    module?: string;
    debug?: boolean;
};
export declare type Config = {
    extends?: Config;
    basedir: string;
    log: {
        level: LogLevel;
    };
    server: {
        protocol: "http" | "https";
        host: string;
        port: number;
        http2: "push" | "preload" | false;
        options: http.ServerOptions | https.ServerOptions | http2.ServerOptions | http2.SecureServerOptions;
    };
    watcher: WatchOptions;
};
export declare function configure(args?: Args): Readonly<Config>;
