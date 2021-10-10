import {expect, sinon} from "mocha-toolkit";
import {AddressInfo} from "net";
import {useFixture} from "./fixture";
import {startServer} from "../src/server";
import {WebSocket} from "ws";
import log from "tiny-node-logger";
import {fail} from "assert";

describe("server", function () {

    before(async function () {
        const cwd = process.cwd();
        log.level = "nothing";

        const {
            module,
            server,
            shutdown
        } = await startServer(useFixture("messaging"));

        expect(module).eq(require("http2"));
        const {address: hostname, port} = server.address() as AddressInfo;
        this.address = `wss://${hostname}:${port}`;

        after(async function () {
            await shutdown();
            process.chdir(cwd);
        });
    });


    it("can connect to messaging", async function () {
        const ws = new WebSocket(this.address, "esnext-dev", {rejectUnauthorized: false});
        const opened = sinon.fake();
        ws.on("open", opened);
        let state = 0;
        ws.on("message", function (raw) {
            const {type, data} = JSON.parse(String(raw));
            switch (state) {
                case 0:
                    expect(type).eq("hello");
                    expect(new Date(data.time)).closeToTime(new Date(), 1);
                    ws.send(JSON.stringify({type: "test", data: "hello from mocha!"}));
                    state = 1;
                    return;
                case 1:
                    expect(type).eq("ack");
                    expect(data).eq("OK");
                    ws.close();
                    state = 2;
                    return;
                default:
                    fail();
            }
        });
        await new Promise(resolve => ws.on("close", resolve));
        expect(opened).calledOnce;
    });

    it("can receive broadcast messages", async function () {
        const fakes = [
            sinon.fake(),
            sinon.fake(),
            sinon.fake(),
        ];
        await Promise.all(fakes.map((fake, index) => new Promise((resolve, reject) => {
            const ws = new WebSocket(this.address, "esnext-dev", {rejectUnauthorized: false});
            const opened = sinon.fake();
            ws.on("open", opened);
            let state = 0;
            ws.on("message", function (raw) {
                const {type, data} = JSON.parse(String(raw));
                switch (state) {
                    case 0:
                        expect(type).eq("hello");
                        setTimeout(() => {
                            ws.send(JSON.stringify({type: "sub", data: index}));
                        }, 50 * index);
                        state = 1;
                        return;
                    case 1:
                        expect(type).eq("bc");
                        expect(data).eq("BYE");
                        fake(index);
                        ws.close();
                        return;
                    default:
                        reject();
                }
            });
            ws.on("close", resolve);
            ws.on("error", reject);
        })));
        fakes.forEach(fake => expect(fake).calledOnce);
    });
});