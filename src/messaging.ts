import {useMemo} from "./utils/use-memo";
import {Config} from "./configure";
import {MultiMap} from "./utils/multi-map";
import {IncomingMessage} from "http";
import {Socket} from "net";
import chalk from "chalk";
import log from "tiny-node-logger";
import WebSocket, {RawData} from "ws";
import {useWatcher} from "./watcher";
import {FSWatcher} from "chokidar";

export type MessagingConfig = {
    plugins?: MessagingPlugin[]
}
export type MessagingPlugin = (messagingContext: MessagingContext) => void;
export type MessagingContext = { on: OnMessage, broadcast: SendMessage, config: Config, watcher: FSWatcher };

export type OnMessage = (type: string, cb: MessageCallback) => void;
export type SendMessage = (type: string, data?: any) => void;

export type Message = { type: string, data?: any };
export type MessageCallback = (data: any, send: SendMessage) => void;

export type Messaging = ((request: IncomingMessage, socket: Socket, head: Buffer) => void) & {
    on: OnMessage
    broadcast: SendMessage
}

export const useMessaging = useMemo<Config, Messaging>(config => {

    const {
        messaging: {
            plugins = []
        } = {}
    } = config;

    const sockets = new Set<WebSocket>();

    function broadcast(type: string, data?: any) {
        const message = data === undefined ? type : JSON.stringify({type, data});
        for (const ws of sockets) {
            ws.send(message);
        }
    }

    const callbacks = new MultiMap<string, MessageCallback>();

    function on(type: string, cb: MessageCallback) {
        callbacks.add(type, cb);
        log.debug("added message listener for:", chalk.magenta(type));
    }

    function openCallback(ws: WebSocket) {

        function send(type: string, data?: any) {
            const message = data === undefined ? type : JSON.stringify({type, data});
            return ws.send(message);
        }

        log.debug("client connected:", ws.url);
        sockets.add(ws);

        ws.on("error", () => {
            log.debug("client error:", ws.url);
        });

        ws.on("close", () => {
            log.debug("client disconnected:", ws.url);
            sockets.delete(ws);
        });

        ws.on("message", (payload: RawData) => {
            const {type, data}: Message = JSON.parse(String(payload));
            for (const callback of callbacks.get(type) ?? []) {
                callback(data, send);
            }
        });

        ws.send(JSON.stringify({type: "hello", data: {time: new Date().toUTCString()}}));
    }

    function errorCallback(error: Error) {
        log.error("websocket error:", error);
    }

    function closeCallback() {
        log.info("websocket closed");
    }

    function handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer) {
        if (request.headers["sec-websocket-protocol"] === "esnext-dev") {
            const wss = new WebSocket.Server({noServer: true});
            wss.on("open", openCallback);
            wss.on("error", errorCallback);
            wss.on("close", closeCallback);
            wss.handleUpgrade(request, socket, head, client => wss.emit("open", client, request));
            log.info("websocket ready");
        }
    }

    const watcher = useWatcher(config);

    for (const plugin of plugins) try {
        plugin({on, broadcast, config, watcher});
    } catch(e) {
        log.error("failed to load messaging plugin", e);
    }

    return Object.assign(handleUpgrade, {
        on,
        broadcast
    });
});