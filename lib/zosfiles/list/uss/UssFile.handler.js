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
const zos_files_for_zowe_sdk_1 = require("@zowe/zos-files-for-zowe-sdk");
const ZosFilesBase_handler_1 = require("../../ZosFilesBase.handler");
/**
 * Handler to list a unix directory
 * @param {IHandlerParameters} params - Command handler parameters
 */
class USSFileHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    processWithSession(commandParameters, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield zos_files_for_zowe_sdk_1.List.fileList(session, commandParameters.arguments.path, {
                maxLength: commandParameters.arguments.maxLength,
                responseTimeout: commandParameters.arguments.responseTimeout
            });
            // Populate the response object
            commandParameters.response.data.setObj(response);
            commandParameters.response.data.setMessage(`Returned list of UNIX files and directories in path "${commandParameters.arguments.path}"`);
            // Format the output with the default fields
            commandParameters.response.format.output({
                fields: ["name", "mode", "size", "uid", "user"],
                output: response.apiResponse.items,
                format: "table"
            });
            return response;
        });
    }
}
exports.default = USSFileHandler;
//# sourceMappingURL=UssFile.handler.js.map