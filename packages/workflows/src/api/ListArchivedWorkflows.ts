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
import { AbstractSession, ImperativeError } from "@brightside/imperative";
import { WorkflowConstants, nozOSMFVersion, wrongString, noWorkflowName } from "./WorkflowConstants";
import { IArchivedWorkflows } from "./doc/IArchivedWorkflows";
import { IWorkflowInfo } from "./doc/IWorkflowInfo";

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
     * @param {string} owner - the URI path with optional parameter for listing filtered workflows.
     * @returns {string} z/OSMF response object
     * @memberof ListArchivedWorkflows
     */
   public static async listArchivedWorkflows(session: AbstractSession, workflowKey?: string,
                                             zOSMFVersion = WorkflowConstants.ZOSMF_VERSION) {
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
       // resourcesQuery += `${WorkflowConstants.ARCH_WORKFLOW_RESOURCE}`;
       // resourcesQuery += `?${WorkflowConstants.workflowKey}=${workflowKey}`;
        if (workflowKey){
            resourcesQuery += `${WorkflowConstants.ARCH_WORKFLOW_RESOURCE}?${WorkflowConstants.workflowKey}=${workflowKey}`;
        }
         else  {
            resourcesQuery += `${WorkflowConstants.ARCH_WORKFLOW_RESOURCE}`;}
        return ZosmfRestClient.getExpectJSON(session, resourcesQuery);
    }
}
/*}
    /**
     * This operation is used to return a worflow-key by given workflow name.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} workflowName - workflow name by which to list workflows
     * @param {string} zOSMFVersion - identifies the version of the provisioning service.
     * @returns {Promise<string> | null} - Promise with string containing wf key, or null if none was found
     * @throws {ImperativeError}
     * @memberof ListArchivedWorkflows
     */
  /* public static async getWfKey(session: AbstractSession, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION,
                                workflowKey?: string )// : Promise<string> | null
                                {

        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        WorkflowValidator.validateNotEmptyString(workflowKey, noWorkflowName.message);

        const result: IArchivedWorkflows = await this.listArchivedWorkflows(session, zOSMFVersion, workflowKey);
       // return result.archivedWorkflows[0].workflowKey;

        // Check if there was more than one workflows found
        if (result.archivedWorkflows.length > 1){
            throw new ImperativeError({
                msg: `More than one workflows found with name ` + workflowKey,
            });
        }
        return result.archivedWorkflows.length !== 0 ? result.archivedWorkflows[0].workflowKey : null;
 }*/
