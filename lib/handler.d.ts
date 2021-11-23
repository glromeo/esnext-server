/// <reference types="node" />
import { Config } from "./configure";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { PathVariables } from "./router";
export declare enum HttpVersion {
    V1 = "http1",
    V2 = "http2"
}
export declare type Req<V> = V extends HttpVersion.V1 ? IncomingMessage : Http2ServerRequest;
export declare type Res<V> = V extends HttpVersion.V1 ? ServerResponse : Http2ServerResponse;
export declare type Handler<V = HttpVersion.V1 | HttpVersion.V2> = (req: Req<V>, res: Res<V>, params?: PathVariables) => void;
export declare const useHandler: (key: Config) => Handler<HttpVersion>;
