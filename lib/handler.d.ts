/// <reference types="node" />
import { Config } from "./configure";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
export declare type HttpHandler = (req: IncomingMessage, res: ServerResponse) => void;
export declare type Http2Handler = (request: Http2ServerRequest, response: Http2ServerResponse) => void;
export declare const useHandler: (key: Config) => HttpHandler | Http2Handler;
