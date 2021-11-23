/// <reference types="node" />
import { Config } from "./configure";
import { Handler, HttpVersion } from "./handler";
import { Server as HttpServer, ServerOptions as HttpServerOptions } from "http";
import { Server as HttpsServer, ServerOptions as HttpsServerOptions } from "https";
import { Http2SecureServer, Http2Server, SecureServerOptions as Http2SecureServerOptions, ServerOptions as Http2ServerOptions } from "http2";
import { FSWatcher } from "chokidar";
export declare type ServerConfig = {
    protocol?: "http" | "https";
    host?: string;
    port?: number;
    http2?: "push" | "preload" | false;
    options?: HttpServerOptions | HttpsServerOptions | Http2ServerOptions | Http2SecureServerOptions;
};
export declare type Server = HttpServer | HttpsServer | Http2Server | Http2SecureServer;
export declare type ServerContext = {
    config: Config;
    module: any;
    server: Server;
    handler: Handler<HttpVersion>;
    watcher: FSWatcher;
    address: string;
    shutdown: () => Promise<any>;
};
export declare function getKey(): string;
export declare function getCert(): string;
export declare function startServer(config: Config): Promise<ServerContext>;
