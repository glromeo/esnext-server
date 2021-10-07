/// <reference types="node" />
import { Config } from "./configure";
import { Http2Handler, HttpHandler } from "./handler";
import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { Http2SecureServer, Http2Server } from "http2";
import { FSWatcher } from "chokidar";
export declare type Server = HttpServer | HttpsServer | Http2Server | Http2SecureServer;
export declare type Handler = HttpHandler | Http2Handler;
export declare type ServerContext = {
    config: Config;
    module: any;
    server: Server;
    handler: Handler;
    watcher: FSWatcher;
    address: string;
    shutdown: () => Promise<any>;
};
export declare function startServer(config: Config): Promise<ServerContext>;
