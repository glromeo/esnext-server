/// <reference types="node" />
import { Config } from "./configure";
import { IncomingMessage } from "http";
import { Socket } from "net";
export declare type Message = {
    type: string;
    data?: any;
};
export declare type MessageCallback = (data: any, send: SendMessage) => void;
export declare type OnMessage = (type: string, cb: MessageCallback) => void;
export declare type SendMessage = (type: string, data?: any) => void;
declare type UpgradeHandler = (request: IncomingMessage, socket: Socket, head: Buffer) => void;
export declare type Messaging = UpgradeHandler & {
    on: OnMessage;
    broadcast: SendMessage;
};
export declare const useMessaging: (key: Config) => Messaging;
export {};