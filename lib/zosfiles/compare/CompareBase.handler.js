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
exports.CompareBaseHandler = void 0;
const imperative_1 = require("@zowe/imperative");
const ZosFilesBase_handler_1 = require("../ZosFilesBase.handler");
const CompareBaseHelper_1 = require("./CompareBaseHelper");
/**
 * This class is used by the various zosfiles-compare handlers as the base class for their implementation.
 * All handlers within zosfiles-compare should extend this class.
 *
 * This class should not be used outside of the zosfiles-compare package.
 *
 * @private
 */
class CompareBaseHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    /**
     * This will grab the zosmf profile and create a session before calling the subclass
     * {@link ZosFilesBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    processWithSession(commandParameters, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const helper = new CompareBaseHelper_1.CompareBaseHelper(commandParameters);
            helper.task = {
                percentComplete: 0,
                statusMessage: `Retrieving content for the first file/dataset`,
                stageName: imperative_1.TaskStage.IN_PROGRESS
            };
            commandParameters.response.progress.startBar({ task: helper.task });
            const fileContent1 = yield this.getFile1(session, commandParameters.arguments, helper);
            commandParameters.response.progress.endBar();
            commandParameters.response.progress.startBar({ task: helper.task });
            helper.task.statusMessage = `Retrieving content for the second file/dataset`;
            const fileContent2 = yield this.getFile2(session, commandParameters.arguments, helper);
            return helper.getResponse(helper.prepareContent(fileContent1), helper.prepareContent(fileContent2));
        });
    }
}
exports.CompareBaseHandler = CompareBaseHandler;
//# sourceMappingURL=CompareBase.handler.js.map