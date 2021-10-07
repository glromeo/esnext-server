import {Config} from "./configure";
import {useMemo} from "./utils/use-memo";
import {IncomingMessage, ServerResponse} from "http";
import {Http2ServerRequest, Http2ServerResponse} from "http2";

export type HttpHandler = (req: IncomingMessage, res: ServerResponse) => void;
export type Http2Handler = (request: Http2ServerRequest, response: Http2ServerResponse) => void;

export const useHandler = useMemo<Config, HttpHandler | Http2Handler>(config => {

    return (req: IncomingMessage, res: ServerResponse) => {
        throw new Error("not implemented yet");
    };
});