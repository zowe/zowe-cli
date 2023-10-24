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
const zos_files_for_zowe_sdk_1 = require("@zowe/zos-files-for-zowe-sdk");
const ZosFilesBase_handler_1 = require("../../ZosFilesBase.handler");
/**
 * Handler to list a data set members
 * @export
 */
class AllMembersHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    processWithSession(commandParameters, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield zos_files_for_zowe_sdk_1.List.allMembers(session, commandParameters.arguments.dataSetName, {
                volume: commandParameters.arguments.volumeSerial,
                attributes: commandParameters.arguments.attributes,
                maxLength: commandParameters.arguments.maxLength,
                pattern: commandParameters.arguments.pattern,
                responseTimeout: commandParameters.arguments.responseTimeout
            });
            if (commandParameters.arguments.attributes && response.apiResponse.items.length > 0) {
                commandParameters.response.console.log(imperative_1.TextUtils.prettyJson(response.apiResponse.items));
            }
            else {
                const memberList = response.apiResponse.items.map((mem) => mem.member);
                commandParameters.response.console.log(memberList.join("\n"));
            }
            return response;
        });
    }
}
exports.default = AllMembersHandler;
//# sourceMappingURL=AllMembers.handler.js.map