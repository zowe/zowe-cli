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
const imperative_1 = require("@zowe/imperative");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
const CheckStatus_messages_1 = require("../../constants/CheckStatus.messages");
/**
 * Handler to show zosmf information
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
class Handler extends zosmf_for_zowe_sdk_1.ZosmfBaseHandler {
    processCmd(commandParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            // our getZosmfInfo API does all of the work
            const zosResponse = yield zosmf_for_zowe_sdk_1.CheckStatus.getZosmfInfo(this.mSession);
            /* After a successful retrieval, collect the zosmf response object
             * into an object that provides a better display.
             */
            const mainZosmfProps = {
                zosmf_port: zosResponse.zosmf_port,
                zosmf_saf_realm: zosResponse.zosmf_saf_realm,
                zos_version: zosResponse.zos_version,
                zosmf_full_version: zosResponse.zosmf_full_version,
                api_version: zosResponse.api_version
            };
            // display the information that we got
            let userToDisplay;
            if (this.mSession.ISession.user === undefined ||
                this.mSession.ISession.user === null ||
                this.mSession.ISession.user.length === 0) {
                userToDisplay = "with a token";
            }
            else {
                userToDisplay = this.mSession.ISession.user;
            }
            commandParameters.response.console.log(imperative_1.TextUtils.formatMessage(CheckStatus_messages_1.CheckStatusMessages.cmdSucceeded.message, {
                userName: userToDisplay,
                hostName: zosResponse.zosmf_hostname,
                mainZosmfProps: imperative_1.TextUtils.prettyJson(mainZosmfProps),
                pluginStatus: imperative_1.TextUtils.prettyJson(zosResponse.plugins)
            }));
            // Return the original zosResponse when using --response-format-json
            commandParameters.response.data.setObj(zosResponse);
        });
    }
}
exports.default = Handler;
//# sourceMappingURL=Status.handler.js.map