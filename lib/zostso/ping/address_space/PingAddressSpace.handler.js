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
 * Handler to Send data to TSO address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class Handler extends zos_tso_for_zowe_sdk_1.ZosTsoBaseHandler {
    // Process the command and produce the ping response
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ping the address space
            const response = yield zos_tso_for_zowe_sdk_1.PingTso.ping(this.mSession, commandParameters.arguments.servletKey);
            // Print out the response
            commandParameters.response.console.log("TSO address space pinged successfully, key was: " + response.servletKey);
            // Return as an object when using --response-format-json
            commandParameters.response.data.setObj(response);
        });
    }
}
exports.default = Handler;
//# sourceMappingURL=PingAddressSpace.handler.js.map