import {expect} from "mocha-toolkit";
import log from "tiny-node-logger";
import {useFixture} from "./fixture";
import {ServerContext} from "../src/server";

describe("handler", function () {

    let runtime: ServerContext, baseurl;

    before(async function () {
        log.level = "nothing";

        const config = useFixture("server/http");
        const {startServer} = await import("../src/server");
        runtime = await startServer(config);
        baseurl = runtime.address;
    });

    after(async function () {
        await runtime.shutdown();
    });

    it("can serve node.ico", async function () {
        const response = await fetch(`${baseurl}/resources/node.ico`);
        expect(response.ok).true;
        expect(response.headers.get("content-type")).eq("image/x-icon");
        expect(response.headers.get("content-length")).eq("139832");
        expect((await response.arrayBuffer()).byteLength).eq(139832);
    });

    it("returns 404 for missing resources", async function () {
        const response = await fetch(`${baseurl}/resources/missing.ico`);
        expect(response.ok).false;
        expect(response.status).eq(404);
    });

});