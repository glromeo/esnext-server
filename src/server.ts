/**
 *     _____
 *   / ____|
 *  | (___   ___ _ ____   _____ _ __
 *   \___ \ / _ \ '__\ \ / / _ \ '__|
 *   ____) |  __/ |   \ V /  __/ |
 *  |_____/ \___|_|    \_/ \___|_|
 *
 */
import {Config} from "./configure";
import {Http2Handler, HttpHandler, useHandler} from "./handler";
import {useWatcher} from "./watcher";
import {Server as HttpServer, ServerOptions as HttpServerOptions} from "http";
import {Server as HttpsServer, ServerOptions as HttpsServerOptions} from "https";
import {
    Http2SecureServer,
    Http2Server,
    SecureServerOptions as Http2SecureServerOptions,
    ServerOptions as Http2ServerOptions
} from "http2";
import {FSWatcher} from "chokidar";
import {useMessaging} from "./messaging";
import log from "tiny-node-logger";
import {Socket} from "net";
import {readFileSync} from "fs";
import {resolve} from "path";

export type ServerConfig = {
    protocol?: "http" | "https"
    host?: string
    port?: number
    http2?: "push" | "preload" | false
    options?: HttpServerOptions | HttpsServerOptions | Http2ServerOptions | Http2SecureServerOptions
};

export type Server = HttpServer | HttpsServer | Http2Server | Http2SecureServer;
export type Handler = HttpHandler | Http2Handler;

export type ServerContext = {
    config: Config
    module: any
    server: Server
    handler: Handler
    watcher: FSWatcher
    address: string
    shutdown: () => Promise<any>
}

function manageSockets(server: HttpServer | HttpsServer | Http2Server | Http2SecureServer) {

    const sockets = new Set<Socket>();

    for (const event of ["connection", "secureConnection"]) server.on(event, function (socket) {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
    });

    return async function (): Promise<void> {
        if (sockets.size > 0) {
            log.debug(`destroying ${sockets.size} pending socket...`);
            for (const socket of sockets) {
                socket.destroy();
                sockets.delete(socket);
            }
        } else {
            log.debug("no pending sockets");
        }
    };
}

export function getKey() {
    return readFileSync(resolve(__dirname, "../cert/localhost.key"), "utf-8");
}

export function getCert() {
    return readFileSync(resolve(__dirname, "../cert/localhost.crt"), "utf-8");
}

export async function startServer(config: Config): Promise<ServerContext> {

    const watcher = useWatcher(config);
    const handler = useHandler(config);

    let module, server: Server;

    const {
        basedir,
        server: {
            protocol = "https",
            host = "0.0.0.0",
            port = 3000,
            http2 = "preload",
            options = {}
        } = {}
    } = config;

    if (http2) {
        module = require("http2");
        if (protocol === "http") {
            server = module.createServer({}, handler);
        } else {
            const {
                key = getKey(),
                cert = getCert(),
                allowHTTP1 = true
            } = options as Http2SecureServerOptions;
            server = module.createSecureServer({
                key,
                cert,
                allowHTTP1
            }, handler);
        }
    } else {
        if (protocol === "http") {
            module = require("http");
            server = module.createServer({}, handler);
        } else {
            module = require("https");
            const {
                key = getKey(),
                cert = getCert()
            } = options as HttpsServerOptions;
            server = module.createServer({
                key,
                cert
            }, handler);
        }
    }

    server.on("upgrade", useMessaging(config));

    await new Promise<void>(resolve => server.listen(port, host, resolve));

    const address = `${protocol}://${host}:${port}`;
    log.info(`server started on ${address.replace("0.0.0.0", "localhost")}`);

    const flushSockets = manageSockets(server);

    let closed: Promise<void> | undefined;

    async function shutdown(): Promise<void> {
        return closed ?? (closed = (async () => {
            log.info("shutting down...");
            const serverClosed = new Promise(resolve => server.close(resolve));
            const watcherClosed = watcher.close();
            const socketsFlushed = flushSockets();
            await Promise.all([
                serverClosed,
                watcherClosed,
                socketsFlushed
            ]);
            log.info("server closed");
        })());
    }

    return {
        config,
        module,
        server,
        watcher,
        handler,
        address,
        shutdown
    };
}
