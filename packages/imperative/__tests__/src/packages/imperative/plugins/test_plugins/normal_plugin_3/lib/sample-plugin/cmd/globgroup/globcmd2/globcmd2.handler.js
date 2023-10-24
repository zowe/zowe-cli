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
const imperative_cli_1 = require("imperative");
/**
 * Defining handler to be use for the 'bar' command.
 */
class GlobCmd2Handler {
    process(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const impFileLogger = imperative_cli_1.Logger.getImperativeLogger();
            impFileLogger.debug("Invoked sample-plugin globcmd2 handler");
            params.response.console.log("You have executed the globcmd2 command. It's definition was processed by globs.");
        });
    }
}
exports.default = GlobCmd2Handler;
//# sourceMappingURL=globcmd2.handler.js.map