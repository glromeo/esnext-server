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
import {Server as HttpServer} from "http";
import {Server as HttpsServer} from "https";
import {Http2SecureServer, Http2Server} from "http2";
import {FSWatcher} from "chokidar";
import {useMessaging} from "./messaging";
import log from "tiny-node-logger";
import {Socket} from "net";

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

    return async () => {
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

export async function startServer(config: Config): Promise<ServerContext> {

    const watcher = useWatcher(config);
    const handler = useHandler(config);

    let module, server: Server;

    const {
        protocol,
        host,
        port,
        options,
        http2
    } = config.server;

    if (http2) {
        module = require("http2");
        if (protocol === "http") {
            server = module.createServer(options, handler);
        } else {
            server = module.createSecureServer(options, handler);
        }
    } else {
        if (protocol === "http") {
            module = require("http");
            server = module.createServer(options, handler);
        } else {
            module = require("https");
            server = module.createServer(options, handler);
        }
    }

    server.on("upgrade", useMessaging(config));

    await new Promise<void>(resolve => server.listen(port, host, resolve));

    const address = `${protocol}://${host}:${port}`;
    log.info(`server started on ${address}`);

    const destroySockets = manageSockets(server);

    async function shutdown(this: ServerContext) {
        log.info("shutting down...");
        const serverClosed = new Promise(resolve => server.close(resolve));
        const watcherClosed = watcher.close();
        const socketsDestroyed = destroySockets();
        await Promise.all([
            serverClosed,
            watcherClosed,
            socketsDestroyed
        ]);
        log.info("server closed");
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
