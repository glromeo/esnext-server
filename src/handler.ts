import {parse as parseURL} from "fast-url-parser";
import {Config} from "./configure";
import {useMemo} from "./utils/use-memo";
import {IncomingMessage, ServerResponse} from "http";
import {constants, Http2ServerRequest, Http2ServerResponse} from "http2";
import {PathVariables, Router} from "./router";
import path from "path";
import {readFile} from "fs";
import {contentType} from "./utils/mime-types";

export enum HttpVersion {
    V1 = "http1",
    V2 = "http2"
}

export type Req<V> = V extends HttpVersion.V1 ? IncomingMessage : Http2ServerRequest;
export type Res<V> = V extends HttpVersion.V1 ? ServerResponse : Http2ServerResponse;

export type Handler<V extends HttpVersion> = (req: Req<V>, res: Res<V>, params?: PathVariables) => void;

const {HTTP_STATUS_OK, HTTP_STATUS_NOT_FOUND} = constants;

export const useHandler = useMemo<Config, Handler<HttpVersion.V1 | HttpVersion.V2>>(config => {

    const router = new Router();

    /**
     *   ____  _        _   _        ____
     *  / ___|| |_ __ _| |_(_) ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *  \___ \| __/ _` | __| |/ __| | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *   ___) | || (_| | |_| | (__  |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *  |____/ \__\__,_|\__|_|\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *
     */
    const resources = config.resources
        ? path.resolve(config.basedir, config.resources)
        : path.resolve(__dirname, "../resources");

    router.get("/resources/*", function <V = HttpVersion.V1 | HttpVersion.V2>(req: Req<V>, res: Res<V>) {
        const {pathname} = parseURL(req.url!);
        const filename = path.join(resources, pathname.substring(10));
        sendFile(filename, res);
    });

    function sendFile<V>(filename: string, res: Res<HttpVersion>) {
        readFile(filename, (err, data) => {
            if (err) {
                res.writeHead(HTTP_STATUS_NOT_FOUND);
                res.end();
            } else {
                res.writeHead(HTTP_STATUS_OK, {
                    "content-type": contentType(filename),
                    "cache-control": "public, max-age=86400, immutable"
                });
                res.end(data);
            }
        });
    }

    /**
     *   ____  _        _   _        ____
     *  / ___|| |_ __ _| |_(_) ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *  \___ \| __/ _` | __| |/ __| | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *   ___) | || (_| | |_| | (__  |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *  |____/ \__\__,_|\__|_|\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *
     */
    // router.register("/resources/*", function resourcesMiddleware(req: IncomingMessage, res: ServerResponse) {
    //     const {pathname} = parseURL(req.url);
    //     const filename = path.join(options.resources, pathname.substring(10));
    //     sendFile(filename, res);
    // });

    return (req, res) => {
        router.route(req, res);
    };
});