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


import { AbstractSession, Headers } from "@zowe/imperative";
import { ZosmfRestClient } from "../";
import { WorkflowConstants, nozOSMFVersion, noWorkflowKey } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";

/**
 * Class to handle canceling of zOSMF workflow instance
 */
export class CancelWorkflow {

    /**
     * Cancel a workflow instance
     * @param {AbstractSession} session                     - z/OSMF connection info
     * @param {string} workflowKey                          - Unique identifier of the workflow instance.
     * @param {string} zOSMFVersion                         - Identifies the version of the zOSMF workflow service.
     * @returns {Promise<string>}                           - Promise that specifies the new name of the canceled workflow.
     * @memberof CancelWorkflow
     */
 public static async cancelWorkflow(session: AbstractSession, workflowKey: string, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION){
    WorkflowValidator.validateSession(session);
    WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
    WorkflowValidator.validateNotEmptyString(workflowKey, noWorkflowKey.message);

    let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
    resourcesQuery += `${WorkflowConstants.WORKFLOW_RESOURCE}/${workflowKey}/${WorkflowConstants.CANCEL_WORKFLOW}`;

    return ZosmfRestClient.putExpectString(session, resourcesQuery, [Headers.APPLICATION_JSON], {} );
 }
}
