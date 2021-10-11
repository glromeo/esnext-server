import {expect, mockquire, unrequire} from "mocha-toolkit";
import {AddressInfo} from "net";
import log from "tiny-node-logger";
import {configure, useFixture} from "./fixture";
import {Agent} from "https";
import * as http2 from "http2";
import {ClientHttp2Session} from "http2";
import {readFileSync} from "fs";
import {contentText} from "../src/utils/content-utils";
import {useMemo} from "../src/utils/use-memo";
import {ServerContext} from "../src/server";
import {resolve} from "path";

describe("server", function () {

    const options = {
        key: readFileSync("cert/localhost.key", "utf-8"),
        cert: readFileSync("cert/localhost.crt", "utf-8"),
        ca: readFileSync("cert/codebite.pem", "utf8"),
        rejectUnauthorized: false
    };

    before(function () {

        log.level = "nothing";

        mockquire("../src/handler", {
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

        unrequire("../src/server");
    });

    beforeEach(function () {
        this.cwd = process.cwd();
    });

    afterEach(function () {
        process.chdir(this.cwd);
    });

    it("starts a server with default settings and stops it", async function () {
        const {startServer} = await import("../src/server");
        const {useWatcher} = await import("../src/watcher");
        const {useHandler} = await import("../src/handler");

        const defaultConfig = useFixture("configure/default");
        const {
            config,
            module,
            server,
            watcher,
            handler,
            shutdown
        } = await startServer(defaultConfig);
        try {
            expect(config).eq(defaultConfig);
            expect(module).eq(require("http2"));
            const {address: hostname, port} = server.address() as AddressInfo;
            expect(`https://${hostname}:${port}`).eq("https://0.0.0.0:3000");
            expect(watcher).eq(useWatcher(defaultConfig));
            expect(handler).eq(useHandler(defaultConfig));
        } finally {
            await shutdown();
        }
    });

    describe("basic http functionality", function () {

        let runtime: ServerContext, module, server, baseurl;

        before(async function () {
            const config = useFixture("server/http");
            const {startServer} = await import("../src/server");
            runtime = await startServer(config);
            module = runtime.module;
            server = runtime.server;
            baseurl = runtime.address;
        });

        after(async function () {
            await runtime.shutdown();
        });

        it("the server was started using http module", function () {
            expect(module).eq(require("http"));
            expect(baseurl).eq("http://0.0.0.0:4000");
        });

        it("the server can handle a GET", async function () {
            const response = await fetch(`${baseurl}/`);
            expect(response.ok).true;
            expect(response.headers.get("content-type")).eq("text/plain; charset=UTF-8");
            expect(await response.text()).match(/HELLO/);
        });

        it("the server can handle a POST", async function () {
            const response = await fetch(`${baseurl}/`, {
                method: "POST",
                headers: {"content-type": "application/json; charset=UTF-8"},
                body: JSON.stringify({message: "HELLO"})
            });
            expect(response.ok).true;
            expect(response.headers.get("content-type")).eq("application/json; charset=UTF-8");
            expect(await response.json()).eql({message: "HELLO"});
        });
    });

    describe("basic https functionality", function () {

        let runtime: ServerContext, module, server, baseurl;

        before(async function () {
            const config = useFixture("server/https");
            const {startServer} = await import("../src/server");
            runtime = await startServer(config);
            module = runtime.module;
            server = runtime.server;
            baseurl = runtime.address;
        });

        after(async function () {
            await runtime.shutdown();
        });

        it("the server was started using https module", function () {
            expect(module).eq(require("https"));
            expect(baseurl).eq("https://0.0.0.0:4003");
        });

        it("uses built in key and cert", function () {
            expect(server.key).eq(readFileSync(resolve(__dirname, "../cert/localhost.key"), "utf-8"));
            expect(server.cert).eq(readFileSync(resolve(__dirname, "../cert/localhost.crt"), "utf-8"));
        });

        it("the server can handle a GET", async function () {
            const response = await fetch(`${baseurl}/`, {agent: new Agent(options)} as RequestInit);
            expect(response.ok).true;
            expect(response.headers.get("content-type")).eq("text/plain; charset=UTF-8");
            expect(await response.text()).match(/HELLO/);
        });

        it("the server can handle a POST", async function () {
            const response = await fetch(`${baseurl}/`, {
                method: "POST",
                headers: {"content-type": "application/json; charset=UTF-8"},
                body: JSON.stringify({message: "HELLO HTTPS"}),
                agent: new Agent(options)
            } as RequestInit);
            expect(response.ok).true;
            expect(response.headers.get("content-type")).eq("application/json; charset=UTF-8");
            expect(await response.json()).eql({message: "HELLO HTTPS"});
        });
    });

    describe("basic http2 functionality", function () {

        let runtime: ServerContext, module, server, baseurl;

        before(async function () {
            useFixture("server/http2");
            const {startServer} = await import("../src/server");
            runtime = await startServer(configure({config: "secure.config.js"}));
            module = runtime.module;
            server = runtime.server;
            baseurl = runtime.address;
        });

        after(async function () {
            await runtime.shutdown();
        });

        it("the server was started on localhost using http2 module", function () {
            expect(module).eq(require("http2"));
            expect(baseurl).eq("https://localhost:4002");
        });

        it("uses key and cert specified in the config", function () {
            const basedir = runtime.config.basedir;
            expect(server.key).eq(readFileSync(resolve(basedir, "self-signed.key"), "utf-8"));
            expect(server.cert).eq(readFileSync(resolve(basedir, "self-signed.cert"), "utf-8"));
        });

        it("the server can handle a GET", async function () {
            const response = await fetch(`${baseurl}/`, {agent: new Agent(options)} as RequestInit);
            expect(response.ok).true;
            expect(response.headers.get("content-type")).eq("text/plain; charset=UTF-8");
            expect(await response.text()).match(/HELLO/);
        });

        it("the server can handle a POST", async function () {
            const response = await fetch(`${baseurl}/`, {
                method: "POST",
                headers: {"content-type": "application/json; charset=UTF-8"},
                body: JSON.stringify({message: "HELLO H2"}),
                agent: new Agent(options)
            } as RequestInit);
            expect(response.ok).true;
            expect(response.headers.get("content-type")).eq("application/json; charset=UTF-8");
            expect(await response.json()).eql({message: "HELLO H2"});
        });

        it("the server can do http2 connect", async function () {

            const client = http2.connect(`${baseurl}/`, options);

            await Promise.all([
                new Promise<void>(resolve => {
                    const get = client.request({
                        ":path": "/",
                        ":method": "GET"
                    });
                    get.on("response", async (headers, flags) => {
                        expect(headers[":status"]).eq(200);
                        expect(headers["content-type"]).eq("text/plain; charset=UTF-8");
                        expect(flags).eq(4);
                        expect(await contentText(get)).match(/HELLO/);
                        resolve();
                    });
                }),
                new Promise<void>(resolve => {
                    const post = client.request({
                        ":path": "/",
                        ":method": "POST",
                        "content-type": "application/json; charset=UTF-8"
                    });
                    post.on("response", async (headers, flags) => {
                        expect(headers[":status"]).eq(200);
                        expect(headers["content-type"]).eq("application/json; charset=UTF-8");
                        expect(flags).eq(4);
                        expect(JSON.parse(await contentText(post))).eql({
                            message: "HELLO H2"
                        });
                        resolve();
                    });
                    post.end(JSON.stringify({message: "HELLO H2"}));
                })
            ]);

            await new Promise<void>(resolve => client.close(resolve));
        });
    });

    describe("advanced http2 functionality", function () {

        let runtime: ServerContext, module, server, baseurl;

        before(async function () {
            useFixture("server/http2");
            const {startServer} = await import("../src/server");
            runtime = await startServer(configure({config: "insecure.config.js"}));
            module = runtime.module;
            server = runtime.server;
            baseurl = runtime.address;
        });

        after(async function () {
            await runtime.shutdown();
        });

        it("the server was started using http2 module", function () {
            expect(module).eq(require("http2"));
            expect(baseurl).eq("http://0.0.0.0:4001");
        });

        it("can start/stop a server with pending connections", async () => {

            const client: ClientHttp2Session = http2.connect(`${baseurl}`, options);

            const destroyed = new Promise<void>(resolve => {
                // The server pipes what the cliend sends so because the client doesn't send anything
                // the connection is pending. Once the server connection is killed the client will get
                // the error and close.
                client.on("error", err => expect(err.code).match(/ECONNRESET/));
                client.on("close", resolve);
            });

            await new Promise<void>(resolve => {
                const req = client.request({
                    ":path": "/",
                    ":method": "POST",
                    "content-type": "text/plain; charset=UTF-8"
                });
                req.on("error", function (err) {
                    expect(err.code).match(/ECONNRESET/);
                });
                req.on("response", async (headers, flags) => {
                    expect(headers[":status"]).eq(200);
                    expect(headers["content-type"]).eq("text/plain; charset=UTF-8");
                    expect(flags).eq(4);
                    const shutdown = runtime.shutdown();
                    req.end("late message");
                    await shutdown;
                    resolve();
                });
            });

            await destroyed;

            expect(client.destroyed).eq(true);
        });
    });
});