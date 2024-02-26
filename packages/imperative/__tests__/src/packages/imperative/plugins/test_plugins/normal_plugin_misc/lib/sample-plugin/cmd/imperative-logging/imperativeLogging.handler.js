"use strict";
var T = require("@zowe/imperative");
var path = require("path");

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
 * Defining handler to be use for the 'imperative-logging' command.
 */
class ImperativeLoggingHandler {
    process(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var aLogger = T.Imperative.api.appLogger;
            aLogger.debug(`Log message from test plugin: DEBUG: ${params.arguments.test}`);
            aLogger.info(`Log message from test plugin: INFO: ${params.arguments.test}`);
            aLogger.warn(`Log message from test plugin: WARN: ${params.arguments.test}`);
            aLogger.error(`Log message from test plugin: ERROR: ${params.arguments.test}`);

            var iLogger = T.Imperative.api.imperativeLogger;
            iLogger.debug(`Log message from test plugin: DEBUG: ${params.arguments.test}`);
            iLogger.info(`Log message from test plugin: INFO: ${params.arguments.test}`);
            iLogger.warn(`Log message from test plugin: WARN: ${params.arguments.test}`);
            iLogger.error(`Log message from test plugin: ERROR: ${params.arguments.test}`);

            var config = T.ImperativeConfig.instance.loadedConfig;
            params.response.console.log(`${params.arguments.test}: Messages logged successfully to the following locations`);
            params.response.console.log(path.join(config.defaultHome, "imperative", "logs", "imperative.log"));
            params.response.console.log(path.join(config.defaultHome, config.name, "logs", config.name + ".log"));
            yield undefined;
        });
    }
}
exports.default = ImperativeLoggingHandler;
//# sourceMappingURL=imperativeLogging.handler.js.handler.js.map
