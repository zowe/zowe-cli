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
const CompareBase_handler_1 = require("../CompareBase.handler");
/**
 * Handler to view a data set's content
 * @export
 */
class UssFileHandler extends CompareBase_handler_1.CompareBaseHandler {
    getFile1(session, args, helper) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield zos_files_for_zowe_sdk_1.Get.USSFile(session, args.ussFilePath1, Object.assign(Object.assign({}, helper.file1Options), { task: helper.task }));
        });
    }
    getFile2(session, args, helper) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield zos_files_for_zowe_sdk_1.Get.USSFile(session, args.ussFilePath2, Object.assign(Object.assign({}, helper.file2Options), { task: helper.task }));
        });
    }
}
exports.default = UssFileHandler;
//# sourceMappingURL=UssFile.handler.js.map