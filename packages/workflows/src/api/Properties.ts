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


import { AbstractSession, Headers } from "@brightside/imperative";
import { ZosmfRestClient } from "../../../rest";
import { WorkflowConstants, nozOSMFVersion,
        noOwner, noWorkflowKey } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";
import { isNullOrUndefined } from "util";
import { IWorkflowInfo } from "./doc/IWorkflowInfo";

export class PropertiesWorkflow {
    /**
     * This operation returns properties of the workflow.
     * Parameters indicators are mandatory,request can include steps and variables indicator for requested result.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} workflowfKey - Key of workflow.
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {boolean} steps - Optional parameter for listing steps properties.
     * @param {boolean} variables - Optional parameter for listing variables properties.
     * @returns {Promise<IWorkflowInfo>} z/OSMF response object
     * @memberof Properties
     */
    // main method
    public static async getWorkflowProperties(session: AbstractSession, workflowKey: string, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION,
                                              steps: boolean, variables: boolean): Promise<IWorkflowInfo>{
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        let wfKey: string;

        WorkflowValidator.validateNotEmptyString(workflowKey, noWorkflowKey.message);
        wfKey = workflowKey;

        let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${WorkflowConstants.WORKFLOW_RESOURCE}/${wfKey}`;

        if (steps && variables){
            resourcesQuery += `?${WorkflowConstants.returnData}=${WorkflowConstants.steps},${WorkflowConstants.variables}`;

        } else if (steps)   {
            resourcesQuery += `?${WorkflowConstants.returnData}=${WorkflowConstants.steps}`;

        } else if (variables)   {
            resourcesQuery += `?${WorkflowConstants.returnData}=${WorkflowConstants.variables}`;

        }

        return ZosmfRestClient.getExpectJSON<IWorkflowInfo>(session, resourcesQuery, [Headers.APPLICATION_JSON]);
    }

}

