"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHandler = exports.HttpVersion = void 0;
const use_memo_1 = require("./utils/use-memo");
const http2_1 = require("http2");
const router_1 = require("./router");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mime_types_1 = require("./utils/mime-types");
var HttpVersion;
(function (HttpVersion) {
    HttpVersion["V1"] = "http1";
    HttpVersion["V2"] = "http2";
})(HttpVersion = exports.HttpVersion || (exports.HttpVersion = {}));
const { HTTP_STATUS_OK, HTTP_STATUS_NOT_FOUND } = http2_1.constants;
exports.useHandler = (0, use_memo_1.useMemo)(config => {
    const router = new router_1.Router();
    const resources = config.resources
        ? path_1.default.resolve(config.basedir, config.resources)
        : path_1.default.resolve(__dirname, "../resources");
    router.get("/resources/*", function (req, res) {
        const pathname = req.url.substring(10);
        const filename = path_1.default.join(resources, pathname);
        fs_1.default.readFile(filename, (err, data) => {
            if (err) {
                res.writeHead(HTTP_STATUS_NOT_FOUND);
                res.end();
            }
            else {
                res.writeHead(HTTP_STATUS_OK, {
                    "content-type": (0, mime_types_1.contentType)(filename),
                    "content-length": data.length,
                    "cache-control": "public, max-age=86400, immutable"
                });
                res.end(data);
            }
        });
    });
    return (req, res) => {
        router.route(req, res);
    };
});
//# sourceMappingURL=handler.js.map