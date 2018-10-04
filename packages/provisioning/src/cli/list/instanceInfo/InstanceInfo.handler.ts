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
import {
    explainProvisionedInstanceExtended,
    explainProvisionedInstanceFull,
    explainProvisionedInstanceSummary,
    explainProvisionedInstanceSummaryWithActions,
    explainProvisionedInstanceSummaryWithVars,
    IProvisionedInstance,
    ListRegistryInstances,
    ProvisioningConstants
} from "../../../../index";
import { ListInstanceInfo } from "../../../api/ListInstanceInfo";
import { isNullOrUndefined } from "util";

/**
 * Handler to list instance info
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class InstanceInfoHandler implements ICommandHandler {

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
            const response: IProvisionedInstance = await ListInstanceInfo.listInstanceCommon(session, ProvisioningConstants.ZOSMF_VERSION, id);
            const pretty = this.formatProvisionedInstanceSummaryOutput(response, commandParameters.arguments.display);
            commandParameters.response.console.log(TextUtils.prettyJson(pretty));
            commandParameters.response.data.setObj(response);
        } else if (instances.length > 1) {
            commandParameters.response.console.error("Multiple instances with name " + commandParameters.arguments.name + " were found");
        }
    }

    /**
     * Format the output of instance summary data, options may be used to further refine the output
     * @param {IProvisionedInstance} instance: one or more provisioned instance
     * @param option: command options
     */
    private formatProvisionedInstanceSummaryOutput(instance: IProvisionedInstance, option: string): any[] {

        let prettifiedInstance: any = {};
        option = isNullOrUndefined(option) ? "ACTIONS" : option.toUpperCase();

        // Prettify the output
        switch (option) {
            // extended general information with actions summarised
            case "EXTENDED" :
                prettifiedInstance = TextUtils.explainObject(instance, explainProvisionedInstanceExtended, false);
                break;

            // summary info with actions
            case "SUMMARY" :
                prettifiedInstance = TextUtils.explainObject(instance, explainProvisionedInstanceSummary, false);
                break;

            // summary info with variables
            case "VARS" :
                prettifiedInstance = TextUtils.explainObject(instance, explainProvisionedInstanceSummaryWithVars, false);
                break;

            // summary info with extended actions and variables
            case "FULL" :
                prettifiedInstance = TextUtils.explainObject(instance, explainProvisionedInstanceFull, false);
                break;
            // default - summary with actions, variables ignored
            case "ACTIONS" :
                prettifiedInstance = TextUtils.explainObject(instance, explainProvisionedInstanceSummaryWithActions, false);
                break;
            default:
                prettifiedInstance = TextUtils.explainObject(instance, explainProvisionedInstanceSummaryWithActions, false);
                break;
        }

        return prettifiedInstance;

    }
}
