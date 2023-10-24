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
class Handler extends zos_tso_for_zowe_sdk_1.ZosTsoBaseHandler {
    // Stop the tso address space associated with the servlet key
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            // Stop the address space
            const servletKey = commandParameters.arguments.servletkey;
            const response = yield zos_tso_for_zowe_sdk_1.StopTso.stop(this.mSession, servletKey);
            // Print response and return as an object when using --response-format-json
            commandParameters.response.console.log(`TSO address space ended successfully, key was: ${response.servletKey}`);
            commandParameters.response.data.setObj(response);
        });
    }
}
exports.default = Handler;
//# sourceMappingURL=AddressSpace.handler.js.map