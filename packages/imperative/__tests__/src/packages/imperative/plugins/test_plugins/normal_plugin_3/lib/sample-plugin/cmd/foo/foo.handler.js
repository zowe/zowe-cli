"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const imperative_cli_1 = require("@zowe/imperative");
class FooHandler {
    process(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = imperative_cli_1.ImperativeConfig.instance.config.api.profiles.get("foo");
            const successMsg = "You executed the Foo command with size = " +
                profile.size + " and duration = " + profile.duration;
            params.response.console.log(successMsg);
        });
    }
}
exports.default = FooHandler;
//# sourceMappingURL=foo.handler.js.map