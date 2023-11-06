"use strict";
var T = require("@zowe/imperative");

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
 * Defining handler to be use for the 'imperative-apis' command.
 */
class ImperativeApisHandler {
    process(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var iApi = T.Imperative.api;

            if (iApi != null) {
                params.response.console.log("Imperative APIs are accessible from the test plugin");
            } else {
                throw new T.ImperativeError({msg: "Imperative APIs are not accessible from the test plugin"});
            }

            if (iApi.imperativeLogger != null) {
                params.response.console.log("Imperative APIs imperativeLogger is accessible from the test plugin");
            } else {
                throw new T.ImperativeError({msg: "Imperative APIs imperativeLogger is not accessible from the test plugin"});
            }

            if (iApi.appLogger != null) {
                params.response.console.log("Imperative APIs appLogger is accessible from the test plugin");
            } else {
                throw new T.ImperativeError({msg: "Imperative APIs appLogger is not accessible from the test plugin"});
            }
        });
    }
}
exports.default = ImperativeApisHandler;
//# sourceMappingURL=imperativeApis.handler.js.handler.js.map
