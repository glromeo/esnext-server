/// <reference types="node" />
import { Config } from "./configure";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { FSWatcher } from "chokidar";
export declare type MessagingConfig = {
    plugins?: MessagingPlugin[];
};
export declare type MessagingPlugin = (messagingContext: MessagingContext) => void;
export declare type MessagingContext = {
    on: OnMessage;
    broadcast: SendMessage;
    config: Config;
    watcher: FSWatcher;
};
export declare type OnMessage = (type: string, cb: MessageCallback) => void;
export declare type SendMessage = (type: string, data?: any) => void;
export declare type Message = {
    type: string;
    data?: any;
};
export declare type MessageCallback = (data: any, send: SendMessage) => void;
export declare type Messaging = ((request: IncomingMessage, socket: Socket, head: Buffer) => void) & {
    on: OnMessage;
    broadcast: SendMessage;
};
export declare const useMessaging: (key: Config) => Messaging;
