"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHandler = void 0;
const use_memo_1 = require("./utils/use-memo");
exports.useHandler = (0, use_memo_1.useMemo)(config => {
    return (req, res) => {
        res.write("not implemented yet");
        res.end();
    };
});
//# sourceMappingURL=handler.js.map