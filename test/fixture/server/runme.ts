import {mockquire} from "mocha-toolkit";
import {useMemo} from "../../../src/utils/use-memo";
import {configure} from "../index";
import {AddressInfo} from "net";
import log from "tiny-node-logger";

const keypress = async () => {
    process.stdin.setRawMode(true);
    return new Promise<void>(resolve => process.stdin.once("data", () => {
        process.stdin.setRawMode(false);
        resolve();
    }));
};

(async () => {
    log.level = "debug";

    mockquire("../../../src/handler", {
        useHandler: useMemo(config => function (req, res) {
            const isHttp2 = parseFloat(req.httpVersion) >= 2;
            if (req.method === "POST") {
                res.writeHead(200, isHttp2 ? undefined : "OK", {
                    "content-type": req.headers["content-type"]
                });
                req.pipe(res);
            } else {
                res.writeHead(200, isHttp2 ? undefined : "OK", {
                    "content-type": "text/plain; charset=UTF-8"
                });
                res.end("HELLO");
            }
        })
    });

    const {startServer} = await import("../../../src/server");

    const {
        server,
        shutdown
    } = await startServer(configure({basedir: `${__dirname}/http`}));

    try {
        const {port} = server.address() as AddressInfo;

        console.log(`server started at: http://localhost:${port}, press any key to continue`);
        await keypress();
        console.log("bye");

    } finally {
        await shutdown();
        process.exit(0);
    }
})();