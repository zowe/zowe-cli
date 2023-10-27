"use strict";
var ImperativeError = require("@zowe/imperative").ImperativeError;

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defining handler to be use for the 'err' command.
 */
class ImperativeErrorHandler {
    process(params) {
        return __awaiter(this, void 0, void 0, function* () {
            params.response.console.log("Command ERR called!");
            throw new ImperativeError({msg: "Plugin threw an imperative error!", additionalDetails: "More details!"});
        });
    }
}
exports.default = ImperativeErrorHandler;
//# sourceMappingURL=imperativeError.handler.js.map
