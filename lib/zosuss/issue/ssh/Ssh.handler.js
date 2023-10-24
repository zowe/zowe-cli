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
const zos_uss_for_zowe_sdk_1 = require("@zowe/zos-uss-for-zowe-sdk");
/**
 * Handle to issue an USS ssh command
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class Handler extends zos_uss_for_zowe_sdk_1.SshBaseHandler {
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            let rc;
            this.parameters = commandParameters;
            if (commandParameters.arguments.cwd) {
                rc = yield zos_uss_for_zowe_sdk_1.Shell.executeSshCwd(this.mSession, commandParameters.arguments.command, commandParameters.arguments.cwd, this.handleStdout.bind(this));
            }
            else {
                rc = yield zos_uss_for_zowe_sdk_1.Shell.executeSsh(this.mSession, commandParameters.arguments.command, this.handleStdout.bind(this));
            }
            commandParameters.response.data.setExitCode(rc);
        });
    }
    handleStdout(data) {
        this.parameters.response.console.log(Buffer.from(data));
    }
}
exports.default = Handler;
//# sourceMappingURL=Ssh.handler.js.map