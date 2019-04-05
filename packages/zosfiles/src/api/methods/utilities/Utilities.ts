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

import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { AbstractSession, ImperativeExpect, Headers } from "@zowe/imperative";
import { Tag } from "./doc/Tag";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosmfRestClient } from "../../../../../rest";

export class Utilities {
    public static async chtag(session: AbstractSession, ussFileName: string, type: Tag, codeset?: string): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(ussFileName,ZosFilesMessages.missingUSSFileName.message);

        if (type === Tag.BINARY) {
            ImperativeExpect.toBeEqual(codeset,undefined,"A codeset cannot be specified for a binary file.");
        }

        const url = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussFileName;
        const payload = { request: "chtag", action: "set", type: type.valueOf()} as any;
        if (codeset) {
            payload.codeset = codeset;
        }

        await ZosmfRestClient.putExpectJSON(session,
            url,
            [Headers.APPLICATION_JSON, { [Headers.CONTENT_LENGTH] : JSON.stringify(payload).length.toString() }],
            payload);

        return {
            success: true,
            commandResponse: "File tagged successfully."
        };
    }
}
