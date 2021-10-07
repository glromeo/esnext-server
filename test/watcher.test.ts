import "mocha-toolkit";
import log from "tiny-node-logger";
import {useFixture} from "./fixture";
import {useWatcher} from "../src/watcher";
import {rmSync, writeFileSync} from "fs";
import {expect, sinon} from "mocha-toolkit";

describe("watcher", function () {

    before(function () {
        this.level = log.level;
        log.level = "debug";
        this.writer = log.writer;
        log.writer = () => true;
        this.debug = log.debug;
        log.debug = sinon.fake();
    });

    after(function () {
        log.level = this.level;
        log.writer = this.writer;
        log.debug = this.debug;
    });

    it("watcher watches only what has explicitly been added to it", async function () {
        const config = useFixture("watcher");
        const watcher = useWatcher(config);

        writeFileSync("esnext.plugin.js", "module.exports = config => {}");

        watcher.add("esnext.plugin.js");

        await new Promise(resolve => watcher.on("ready", resolve));

        setTimeout(() => rmSync("esnext.plugin.js"));

        await new Promise(resolve => watcher.on("unlink", resolve));

        await watcher.close();

        expect(log.debug).calledWith("created workspace watcher");
        expect(log.debug).not.calledWith("watcher", "add", "esnext.plugin.js");
        expect(log.debug).calledWith("watcher", "unlink", "esnext.plugin.js");
    });
});