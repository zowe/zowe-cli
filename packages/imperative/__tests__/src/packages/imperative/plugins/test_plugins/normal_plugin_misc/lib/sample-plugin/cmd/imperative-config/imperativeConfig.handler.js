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
 * Defining handler to be use for the 'imperative-config' command.
 */
class ImperativeConfigHandler {
    process(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var loadedConfig = T.ImperativeConfig.instance.loadedConfig;
            var testCliConfig = require(__dirname + "/../../../../../../test_cli/TestConfiguration");

            if (loadedConfig != null) {
                params.response.console.log("Imperative configuration is accessible from the test plugin");
            } else {
                throw new T.ImperativeError({msg: "Imperative configuration is not accessible from the test plugin"});
            }

            if (loadedConfig.rootCommandDescription === testCliConfig.rootCommandDescription) {
                params.response.console.log("Imperative configuration does contain the expected rootCommandDescription");
            } else {
                throw new T.ImperativeError({msg: "Imperative configuration does not contain the expected rootCommandDescription"});
            }

            if (loadedConfig.defaultHome === testCliConfig.defaultHome) {
                params.response.console.log("Imperative configuration does contain the expected defaultHome");
            } else {
                throw new T.ImperativeError({msg: "Imperative configuration does not contain the expected defaultHome"});
            }

            if (loadedConfig.productDisplayName === testCliConfig.productDisplayName) {
                params.response.console.log("Imperative configuration does contain the expected productDisplayName");
            } else {
                throw new T.ImperativeError({msg: "Imperative configuration does not contain the expected productDisplayName"});
            }

            if (loadedConfig.name === testCliConfig.name) {
                params.response.console.log("Imperative configuration does contain the expected name");
            } else {
                throw new T.ImperativeError({msg: "Imperative configuration does not contain the expected name"});
            }

            if (loadedConfig.profiles === testCliConfig.profiles) {
                params.response.console.log("Imperative configuration does contain the expected profiles");
            } else {
                throw new T.ImperativeError({msg: "Imperative configuration does not contain the expected profiles"});
            }
        });
    }
}
exports.default = ImperativeConfigHandler;
//# sourceMappingURL=imperativeConfig.handler.js.handler.js.map
