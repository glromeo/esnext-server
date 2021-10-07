import {configure} from "../src/configure";
import {sinon} from "mocha-toolkit";
import {useFixture} from "./fixture";
import * as path from "path";
import * as fs from "fs";
import log from "tiny-node-logger";

describe("configure", function () {

    before(function () {
        log.level = "nothing";
    })

    beforeEach(function () {
        this.cwd = process.cwd();
    });

    afterEach(function () {
        process.chdir(this.cwd);
    });

    it("can find the config in the current working directory", function () {
        const {basedir} = useFixture("configure/custom");
        const config = configure();
        expect(config.basedir).eq(basedir);
        expect(config.log.level).eq("debug");
    });

    it("otherwise defaults to the base config provided with the server", function () {
        const {basedir} = useFixture("configure/default");
        const config = configure();
        expect(config.basedir).eq(basedir);
        expect(config.log.level).eq("info");
    });

    it("basedir can be changed from current working directory", function () {
        useFixture("configure/default");
        const basedir = path.resolve(__dirname, "fixture/configure/custom");
        const config = configure({basedir: basedir});
        expect(config.basedir).eq(basedir);
        expect(config.log.level).eq("debug");
    });

    it("and, also in that case, it looks for the server.config.js otherwise uses the default", function () {
        useFixture("configure/custom");
        const basedir = path.resolve(__dirname, "fixture/configure/default");
        const config = configure({basedir: basedir});
        expect(config.basedir).eq(basedir);
        expect(config.log.level).eq("info");
    });

    it("config can be used to specify a different configuration file", function () {
        const {basedir} = useFixture("configure/custom");
        const config = configure({config: "alternative.config.js"});
        expect(config.basedir).eq(basedir);
        expect(config.log.level).eq("trace");
    });

    it("certificates are looked up by default in a folder cert in the basedir", function () {
        useFixture("configure/certificates");
        const config = configure();
        expect(config.server.options.key).eq("This is the key");
        expect(config.server.options.cert).eq("This is the cert");
    });

    it("...if they aren't found the default ones provided with the server are used", function () {
        useFixture("configure/default");
        const config = configure();
        expect(config.server.options.key).eq(fs.readFileSync(path.resolve(__dirname, "../cert/localhost.key"),"utf-8"));
        expect(config.server.options.cert).eq(fs.readFileSync(path.resolve(__dirname, "../cert/localhost.crt"),"utf-8"));
    });

    it("failures during configuration stop the process", function () {
        const stub = sinon.stub(process, 'exit');
        useFixture("configure/custom");
        configure({config: "wrong.config.js"});
        expect(process.exit).calledOnce;
        expect(process.exit).calledWith(1);
        stub.restore();
    });

});
