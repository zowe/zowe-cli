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

import { IHandlerParameters, TextUtils } from "@zowe/core-for-zowe-sdk";
import {
    explainProvisionedInstanceFull,
    explainProvisionedInstanceSummary,
    IProvisionedInstance,
    IProvisionedInstances,
    ProvisioningConstants,
    ListRegistryInstances
} from "@zowe/provisioning-for-zowe-sdk";
import { isNullOrUndefined } from "util";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";

/**
 * Handler to list registry instances
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class RegistryInstancesHandler extends ZosmfBaseHandler {

    public async processCmd(commandParameters: IHandlerParameters) {

        const response: IProvisionedInstances = await ListRegistryInstances.listFilteredRegistry(this.mSession, ProvisioningConstants.ZOSMF_VERSION,
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
