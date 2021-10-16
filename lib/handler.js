"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHandler = void 0;
const use_memo_1 = require("./utils/use-memo");
const router_1 = require("./router");
exports.useHandler = (0, use_memo_1.useMemo)(config => {
    const router = new router_1.Router();
    return (req, res) => {
        res.write("not implemented yet");
        res.end();
    };
});
//# sourceMappingURL=handler.js.map