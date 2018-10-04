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
import { ListRegistryInstances } from "../../../../";
import {
    explainProvisionedInstanceFull,
    explainProvisionedInstanceSummary,
    IProvisionedInstance,
    IProvisionedInstances,
    ProvisioningConstants
} from "../../../../index";
import { isNullOrUndefined } from "util";

/**
 * Handler to list registry instances
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class RegistryInstancesHandler implements ICommandHandler {

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

        const response: IProvisionedInstances = await ListRegistryInstances.listFilteredRegistry(session, ProvisioningConstants.ZOSMF_VERSION,
            commandParameters.arguments.filterByType, commandParameters.arguments.filterByExternalName);
        const instances: IProvisionedInstance[] = response["scr-list"];
        const pretty = TextUtils.prettyJson(this.formatProvisionedInstancesSummaryOutput(instances, commandParameters.arguments.allInfo));
        // Print out the response

        if (commandParameters.arguments.types) {
            commandParameters.response.console.log("z/OSMF Service Registry " +
                "- Types of Provisioned Instances.\n");
            const unique = [...new Set(instances.map((item) => item.type))];
            commandParameters.response.console.log(TextUtils.prettyJson(unique));
        } else {
            commandParameters.response.console.log("z/OSMF Service Registry");
            if (!isNullOrUndefined(commandParameters.arguments.filterByType)) {
                commandParameters.response.console.log("\nShowing ONLY \""
                    + commandParameters.arguments.filterByType.toUpperCase() + "\" instance types.");
            }
            commandParameters.response.console.log(pretty);
        }
        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }

    /**
     * Format the output of instance summary data, options may be used to further refine the output
     * @param {IProvisionedInstance} instances: one or more provisioned instance
     * @param showAllInfo : display summary (default) or all information fields
     */
    private formatProvisionedInstancesSummaryOutput(instances: IProvisionedInstance[],
                                                    showAllInfo: boolean): any[] {
        // Use defined pretty print template - IProvisionedInstancePrettyFull for displaying info
        let prettifiedInstances: any[] = [];
        if (showAllInfo) {
            prettifiedInstances = TextUtils.explainObject(instances, explainProvisionedInstanceFull, true);
        } else {
            prettifiedInstances = TextUtils.explainObject(instances, explainProvisionedInstanceSummary, false);
        }
        return prettifiedInstances;
    }
}
