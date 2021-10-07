"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = void 0;
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function configure(args) {
    var _a, _b, _c;
    const basedir = (_a = args === null || args === void 0 ? void 0 : args.basedir) !== null && _a !== void 0 ? _a : process.cwd();
    const config = path_1.default.resolve(basedir, (_b = args === null || args === void 0 ? void 0 : args.config) !== null && _b !== void 0 ? _b : "server.config.js");
    function readTextFileSync(filename) {
        try {
            return fs_1.default.readFileSync(path_1.default.resolve(basedir, filename), "utf-8");
        }
        catch (ignored) {
            return fs_1.default.readFileSync(path_1.default.resolve(__dirname, "..", filename), "utf-8");
        }
    }
    const defaults = {
        basedir,
        log: {
            level: "info"
        },
        server: {
            protocol: "https",
            host: "0.0.0.0",
            port: 3000,
            http2: "preload",
            options: {
                get key() {
                    return readTextFileSync("cert/localhost.key");
                },
                get cert() {
                    return readTextFileSync("cert/localhost.crt");
                },
                allowHTTP1: true
            }
        },
        watcher: {
            cwd: basedir,
            atomic: false,
            disableGlobbing: true,
            ignoreInitial: true
        }
    };
    const paths = () => [
        path_1.default.relative(basedir, config),
        basedir === process.cwd() ? "current directory" : `'${basedir}'`
    ];
    if (!fs_1.default.existsSync(config)) {
        const [what, where] = paths();
        tiny_node_logger_1.default.info(`no '${what}' found in ${where}, using default configuration`);
        return Object.freeze(defaults);
    }
    try {
        const configurator = require(config);
        return (_c = configurator(defaults)) !== null && _c !== void 0 ? _c : defaults;
    }
    catch (error) {
        const [what, where] = paths();
        tiny_node_logger_1.default.error(`unable to load config '${what}' from ${where}\n`, error);
        process.exit(1);
    }
}
exports.configure = configure;
//# sourceMappingURL=configure.js.map