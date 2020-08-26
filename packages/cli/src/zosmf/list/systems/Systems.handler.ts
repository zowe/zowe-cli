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

import { IHandlerParameters } from "@zowe/imperative";
import { ListDefinedSystems, IZosmfListDefinedSystemsResponse } from "../../../../src/provisioning/delete/instance/node_modules/@zowe/zosmf-for-zowe-sdk";
import { ZosmfBaseHandler } from "../../../../src/provisioning/delete/instance/node_modules/@zowe/zosmf-for-zowe-sdk";

/**
 * Handler to show zosmf information
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        const zosResponse: IZosmfListDefinedSystemsResponse = await ListDefinedSystems.listDefinedSystems(this.mSession);

        commandParameters.response.format.output({
            fields: ["systemNickName", "systemName", "url", "jesMemberName" ],
            output: zosResponse.items,
            format: "table",
            header: true
        });

        // Return the original zosResponse when using --response-format-json
        commandParameters.response.data.setObj(zosResponse);
    }
}
