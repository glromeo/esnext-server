import {configure} from "../src/configure";
import {sinon} from "mocha-toolkit";
import {useFixture} from "./fixture";
import * as path from "path";
import log from "tiny-node-logger";

describe("configure", function () {

    before(function () {
        log.level = "nothing";
    });

    beforeEach(function () {
        this.cwd = process.cwd();
    });

    afterEach(function () {
        process.chdir(this.cwd);
    });

    it("can find the config in the current working directory", function () {
        const {} = useFixture("configure/custom");
        const config = configure();
        expect(config.basedir).eq("/custom");
    });

    it("otherwise defaults to the base config provided with the server", function () {
        const {basedir} = useFixture("configure/default");
        const config = configure();
        expect(config.basedir).eq(basedir);
    });

    it("basedir can be changed from current working directory", function () {
        useFixture("configure/default");
        const basedir = path.resolve(__dirname, "fixture/configure/custom");
        const config = configure({basedir: basedir});
        expect(config.basedir).eq(basedir);
    });

    it("and, also in that case, it looks for the server.config.js otherwise uses the default", function () {
        useFixture("configure/custom");
        const basedir = path.resolve(__dirname, "fixture/configure/default");
        const config = configure({basedir: basedir});
        expect(config.basedir).eq(basedir);
    });

    it("config can be used to specify a different configuration file", function () {
        const {basedir} = useFixture("configure/custom");
        const config = configure({config: "alternative.config.js"});
        expect(config.basedir).eq("/alternative");
    });

    it("failures during configuration stop the process", function () {
        const stub = sinon.stub(process, "exit");
        useFixture("configure/custom");
        configure({config: "wrong.config.js"});
        expect(process.exit).calledOnce;
        expect(process.exit).calledWith(1);
        stub.restore();
    });

});
