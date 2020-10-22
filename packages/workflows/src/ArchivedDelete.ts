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


import { AbstractSession } from "@zowe/imperative";
import { ZosmfRestClient, nozOSMFVersion } from "@zowe/core-for-zowe-sdk";
import { WorkflowConstants, noWorkflowKey } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";

/**
 * Class to handle deletion of an archived z/OSMF workflow from a z/OS system
 */
export class ArchivedDeleteWorkflow {

    /**
     * Delete archived workflow
     * @param {AbstractSession} session                     - z/OSMF connection info
     * @param {string} workflowKey                          - Unique identifier of the workflow instance.
     * @param {string} zOSMFVersion                         - Identifies the version of the zOSMF workflow service.
     * @returns {string}
     */
    public static async archivedDeleteWorkflow(session: AbstractSession, workflowKey: string,
                                               zOSMFVersion = WorkflowConstants.ZOSMF_VERSION){
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        WorkflowValidator.validateNotEmptyString(workflowKey, noWorkflowKey.message);
        let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${WorkflowConstants.ARCH_WORKFLOW_RESOURCE}/${workflowKey}`;

        return ZosmfRestClient.deleteExpectString(session, resourcesQuery, null);
    }
}
