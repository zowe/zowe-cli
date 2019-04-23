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

import { IHandlerParameters, TextUtils } from "@brightside/imperative";
import { ListDefinedSystems, IZosmfListDefinedSystemsResponse } from "../../../..";
import { ZosmfBaseHandler } from "../../../ZosmfBaseHandler";

/**
 * Handler to show zosmf information
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        const zosResponse: IZosmfListDefinedSystemsResponse = await ListDefinedSystems.listDefinedSystems(this.mSession);

        commandParameters.response.console.log("Number of retreived system definitions: " + zosResponse.numRows + "\n");
        commandParameters.response.format.output({
            fields: ["systemNickName", "systemName", "url", ],
            output: zosResponse.items,
            format: "table",
            header: true,
        });

        // Return the original zosResponse when using --response-format-json
        commandParameters.response.data.setObj(zosResponse);
    }
}
