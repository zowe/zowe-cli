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

import { ICommandHandler, IHandlerParameters, Session, TextUtils } from "@brightside/imperative";
import { explainActionResponse, PerformAction, ProvisioningConstants } from "../../../../";
import { IProvisionedInstance, ListRegistryInstances } from "../../../../index";
import { isNullOrUndefined } from "util";
/**
 * Handler to perform action against instance
 * @export
 * @class ActionHandler
 * @implements {ICommandHandler}
 */
export default class ActionHandler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {


        const zosmfProfile = commandParameters.profiles.get("zosmf");
        const session = new Session({
            type: "basic",
            hostname: zosmfProfile.host,
            port: zosmfProfile.port,
            user: zosmfProfile.user,
            password: zosmfProfile.pass,
            base64EncodedAuth: zosmfProfile.auth,
            rejectUnauthorized: zosmfProfile.rejectUnauthorized
        });

        const registry = await ListRegistryInstances.listFilteredRegistry(session, ProvisioningConstants.ZOSMF_VERSION, null,
            commandParameters.arguments.name);
        const instances: IProvisionedInstance[] = registry["scr-list"];
        if (isNullOrUndefined(instances)) {
            commandParameters.response.console.error("No instance with name " + commandParameters.arguments.name + " was found");
        } else if (instances.length === 1) {
            const id = instances.pop()["object-id"];
            const response = await PerformAction.doProvisioningActionCommon(
                session, ProvisioningConstants.ZOSMF_VERSION, id, commandParameters.arguments.actionname);
            const pretty = TextUtils.explainObject(response, explainActionResponse, false);
            commandParameters.response.console.log(TextUtils.prettyJson(pretty));
            commandParameters.response.data.setObj(response);
        } else if (instances.length > 1) {
            commandParameters.response.console.error("Multiple instances with name " + commandParameters.arguments.name + " were found");
        }
    }
}
