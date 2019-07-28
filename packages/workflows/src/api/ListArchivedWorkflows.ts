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
import { AbstractSession, ImperativeError } from "@zowe/imperative";
import { WorkflowConstants, nozOSMFVersion, wrongString, noWorkflowName } from "./WorkflowConstants";
import { IArchivedWorkflows } from "./doc/IArchivedWorkflows";

/**
 * Get list of archived workflows from registry.
 * @export
 * @class ListArchivedWorkflows
 */
export class ListArchivedWorkflows {
    /**
     * This operation returns list of archived workflows.
     * Parameters are optional,request can include one or more parameters to filter the results.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} workflowName - the URI path with optional parameter for listing filtered workflows.
     * @param {string} category - the URI path with optional parameter for listing filtered workflows.
     * @param {string} system - the URI path with optional parameter for listing filtered workflows.
     * @param {string} owner - the URI path with optional parameter for listing filtered workflows.
     * @param {string} vendor - the URI path with optional parameter for listing filtered workflows.
     * @param {string} statusName - the URI path with optional parameter for listing filtered workflows.
     * @returns {string} z/OSMF response object
     * @memberof ListArchivedWorkflows
     */
    public static async listArchivedWorkflows(session: AbstractSession, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION,
                                              workflowName?: string, category?: string, system?: string,
                                              owner?: string, vendor?: string, statusName?: string ): Promise<IArchivedWorkflows> {
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        const resourcesQuery: string = ListArchivedWorkflows.getResourcesQuery(zOSMFVersion,
            [
                {key: WorkflowConstants.workflowName, value : workflowName ? encodeURIComponent(workflowName) : null},
                {key: WorkflowConstants.category, value : category},
                {key: WorkflowConstants.system, value : system},
                {key: WorkflowConstants.owner, value : owner},
                {key: WorkflowConstants.vendor, value : vendor},
                {key: WorkflowConstants.statusName, value : statusName},
            ]
        );
        return ZosmfRestClient.getExpectJSON(session, resourcesQuery);
    }

    /**
     * This operation Builds URI path from provided parameters.
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} params - The array with URI path with filters for listing filtered workflows.
     * @returns {string} URI path for the REST call.
     * @memberof LisArchivedWorkflows
     */
    public static getResourcesQuery(zOSMFVersion: string, params: Array <{key: string, value: string}>): string {
        let query: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/${WorkflowConstants.ARCH_WORKFLOW_RESOURCE}`;
        let sign = "?";
        params.forEach((element) => {
            if (element.value) {
                // Validate if parameter value does not contains ? or &
                WorkflowValidator.validateParameter(element.value, wrongString.message);
                query += sign + `${element.key}=${element.value}`;
                sign = "&";
            }
        });
        return query;
    }

    /**
     * This operation is used to return an archived worflow-key by given workflow name.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} workflowName - workflow name by which to list workflows
     * @param {string} zOSMFVersion - identifies the version of the provisioning service.
     * @returns {Promise<string> | null} - Promise with string containing wf key, or null if none was found
     * @throws {ImperativeError}
     * @memberof ListArchivedWorkflows
     */
    public static async getWfKey(session: AbstractSession, workflowName: string,
                                 zOSMFVersion = WorkflowConstants.ZOSMF_VERSION): Promise<string> | null{

        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        WorkflowValidator.validateNotEmptyString(workflowName, noWorkflowName.message);

        const result: IArchivedWorkflows = await this.listArchivedWorkflows(session, zOSMFVersion, workflowName);

        // Check if there was more than one workflows found
        if (result.archivedWorkflows.length > 1){
            throw new ImperativeError({
                msg: `More than one workflows found with name ` + workflowName,
            });
        }
        return result.archivedWorkflows.length !== 0 ? result.archivedWorkflows[0].workflowKey : null;
    }
}
