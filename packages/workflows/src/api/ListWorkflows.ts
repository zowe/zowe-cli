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

import { ZosmfRestClient } from "../../../rest";
import { WorkflowValidator } from "./WorkflowValidator";
import { AbstractSession } from "@brightside/imperative";
import { WorkflowConstants, nozOSMFVersion } from "./WorkflowConstants";

/**
 * Get list of workflows from registry.
 * @export
 * @class ListWorkflows
 */
export class ListWorkflows {
    /**
     * This operation returns list of workflows. 
     * Parametrs are optional,request can include one or more parameters to filter the results.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} category - URI path with filters for listing filtered registry instances.
     * @returns {Promise<IProvisionedInstances>} z/OSMF response object
     * @memberof ListWorkflows
     */
 
    public static async listWorkflows(session: AbstractSession, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION,
                                      category?: string, system?: string,
                                      owner?: string, vendor?: string, statusName?: string ) {
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        
        const resourcesQuery: string = ListWorkflows.getResourcesQuery(zOSMFVersion,
            [
                {key: WorkflowConstants.category, value : category},
                {key: WorkflowConstants.system, value : system},
                {key: WorkflowConstants.owner, value : owner},
                {key: WorkflowConstants.vendor, value : vendor},
                {key: WorkflowConstants.statusName, value : statusName},
            ]
        );

       return await ZosmfRestClient.getExpectJSON(session, resourcesQuery);
    }

    /**
     * This operation Builds URI path from provided parameters.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} filteredQuery - URI path with filters for listing filtered registry instances.
     * @returns {string} URI path for the REST call.
     * @memberof ListRegistryInstances
     */

    public static getResourcesQuery(zOSMFVersion: string ,params: {key: string, value: string}[]) {
        let query: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/${WorkflowConstants.WORKFLOW_RESOURCE}`;
        let sign = "?";
        params.forEach(element => {
            if (element.value) {
                // some validator ?
                query += sign + `${element.key}=${element.value}`;
                sign = "&";
            }
        });
        return query;
    }
}
