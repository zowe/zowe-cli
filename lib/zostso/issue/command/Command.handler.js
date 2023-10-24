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
const zos_tso_for_zowe_sdk_1 = require("@zowe/zos-tso-for-zowe-sdk");
/**
 * Handler to issue command to TSO address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class Handler extends zos_tso_for_zowe_sdk_1.ZosTsoBaseHandler {
    // Process the command and produce the TSO response
    processCmd(params) {
        return __awaiter(this, void 0, void 0, function* () {
            // Issue the TSO command
            const response = yield zos_tso_for_zowe_sdk_1.IssueTso.issueTsoCommand(this.mSession, params.arguments.account, params.arguments.commandText, this.mTsoStart);
            // If requested, suppress the startup
            if (!params.arguments.suppressStartupMessages) {
                this.console.log(response.startResponse.messages);
            }
            this.console.log(response.commandResponse);
            // Return as an object when using --response-format-json
            this.data.setObj(response);
        });
    }
}
exports.default = Handler;
//# sourceMappingURL=Command.handler.js.map