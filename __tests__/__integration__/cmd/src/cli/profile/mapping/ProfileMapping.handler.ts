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

import { ICommandHandler, IHandlerParameters } from "../../../../../../../lib/index";

/**
 * Test of mapping of profile fields to options
 * @export
 * @class ProfileMappingHandler
 * @implements {ICommandHandler}
 */
export default class ProfileMappingHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        params.response.console.log("Color: " + params.arguments.color);
        params.response.console.log("Description: " + params.arguments.bananaDescription);
        params.response.console.log("Mold type: " + params.arguments.moldType);
        params.response.console.log("Sweetness: " + params.arguments.sweetness);
        params.response.console.log("Ripe: " + params.arguments.ripe);
        params.response.console.log("Sides: " + params.arguments.sides);
        if (params.arguments.names != null) {
            params.response.console.log("Names:" + params.arguments.names.join(","));
        }
    }
}
