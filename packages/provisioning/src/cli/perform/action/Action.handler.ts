/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { IHandlerParameters, TextUtils } from "@brightside/imperative";
import { explainActionResponse, PerformAction, ProvisioningConstants } from "../../../../";
import { IProvisionedInstance, ListRegistryInstances } from "../../../../index";
import { isNullOrUndefined } from "util";
import { ZosmfBaseHandler } from "../../../../../zosmf/src/ZosmfBaseHandler";

/**
 * Handler to perform action against instance
 * @export
 * @class ActionHandler
 * @implements {ICommandHandler}
 */
export default class ActionHandler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        const registry = await ListRegistryInstances.listFilteredRegistry(this.mSession, ProvisioningConstants.ZOSMF_VERSION, null,
            commandParameters.arguments.name);
        const instances: IProvisionedInstance[] = registry["scr-list"];
        if (isNullOrUndefined(instances)) {
            commandParameters.response.console.error("No instance with name " + commandParameters.arguments.name + " was found");
        } else if (instances.length === 1) {
            const id = instances.pop()["object-id"];
            const response = await PerformAction.doProvisioningActionCommon(
                this.mSession, ProvisioningConstants.ZOSMF_VERSION, id, commandParameters.arguments.actionname);
            const pretty = TextUtils.explainObject(response, explainActionResponse, false);
            commandParameters.response.console.log(TextUtils.prettyJson(pretty));
            commandParameters.response.data.setObj(response);
        } else if (instances.length > 1) {
            commandParameters.response.console.error("Multiple instances with name " + commandParameters.arguments.name + " were found");
        }
    }
}
