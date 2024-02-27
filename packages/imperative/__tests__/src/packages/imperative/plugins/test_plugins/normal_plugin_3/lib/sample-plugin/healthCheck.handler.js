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
class HealthCheckHandler {
    process(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const impFileLogger = imperative_cli_1.Logger.getImperativeLogger();
            impFileLogger.debug("Invoked health check handler");
            params.response.console.log("You would report problems identified by healthCheck.");
            yield undefined;
        });
    }
}
exports.default = HealthCheckHandler;
//# sourceMappingURL=healthCheck.handler.js.map