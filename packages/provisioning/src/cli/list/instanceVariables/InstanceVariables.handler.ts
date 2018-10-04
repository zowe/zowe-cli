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

import { isNullOrUndefined } from "util";
import { ListInstanceVariables } from "../../../api/ListInstanceVariables";
import { ICommandHandler, IHandlerParameters, Session, TextUtils } from "@brightside/imperative";
import { IProvisionedInstance, IProvisionedInstanceVariable, ListRegistryInstances, ProvisioningConstants } from "../../../../../provisioning";


/**
 * Handler to list instance variables
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class InstanceVariablesHandler implements ICommandHandler {

    public async process(commandParameters: IHandlerParameters) {
        const profile = commandParameters.profiles.get("zosmf");

        const session = new Session({
            type: "basic",
            hostname: profile.host,
            port: profile.port,
            user: profile.user,
            password: profile.pass,
            base64EncodedAuth: profile.auth,
            rejectUnauthorized: profile.rejectUnauthorized,
        });

        const registry = await ListRegistryInstances.listFilteredRegistry(session, ProvisioningConstants.ZOSMF_VERSION, null,
            commandParameters.arguments.name);
        const instances: IProvisionedInstance[] = registry["scr-list"];
        if (isNullOrUndefined(instances)) {
            commandParameters.response.console.error("No instance with name " + commandParameters.arguments.name + " was found");
        } else if (instances.length === 1) {
            const id = instances.pop()["object-id"];
            const variables: IProvisionedInstanceVariable[] = (await ListInstanceVariables.listVariablesCommon(
                session, ProvisioningConstants.ZOSMF_VERSION, id)).variables;
            commandParameters.response.format.output({
                fields: ["name", "value", "visibility", "update-registry"],
                output: variables,
                format: "table",
                header: true
            });
            commandParameters.response.data.setObj(variables);
        } else if (instances.length > 1) {
            commandParameters.response.console.error("Multiple instances with name " + commandParameters.arguments.name + " were found");
        }
    }
}
