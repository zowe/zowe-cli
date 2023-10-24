"use strict";
/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Handler to disable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class RestartDaemonHandler {
    /**
     * Process the disable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     */
    process(cmdParams) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.restartDaemon();
            cmdParams.response.console.log("Zowe daemon restart is only valid when daemon mode is enabled.");
            cmdParams.response.data.setExitCode(0);
        });
    }
    /**
     * Restart daemon mode.
     *
     * @throws {ImperativeError}
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    restartDaemon() {
        return __awaiter(this, void 0, void 0, function* () {
            /* dummy routine if called from the node.js version of Zowe. */
        });
    }
}
exports.default = RestartDaemonHandler;
//# sourceMappingURL=Restart.handler.js.map