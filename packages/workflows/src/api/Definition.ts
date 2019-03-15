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
        noOwner, noWorkflowDefinitionFile } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";
import { isNullOrUndefined } from "util";
import { IWorkflowDefinition } from "./doc/IWorkflowDefinition";

export class DefinitionWorkflow {
    /**
     * This operation returns properties of the workflow.
     * Parameters indicators are mandatory,request can include steps and variables indicator for requested result.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} filePath - workflow definition name with path.
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {boolean} steps - Optional parameter for listing steps properties.
     * @param {boolean} variables - Optional parameter for listing variables properties.
     * @returns {Promise<IWorkflowDefinition>} z/OSMF response object
     * @memberof Definition
     */
    // main method
    public static async getWorkflowDefinition(session: AbstractSession, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION,
                                              filePath: string, steps: boolean, variables: boolean): Promise<IWorkflowDefinition>{
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        let wfPath: string;

        WorkflowValidator.validateNotEmptyString(filePath, noWorkflowDefinitionFile.message);
        wfPath = filePath;

        let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${WorkflowConstants.WORKFLOW_DEFINITION}?${WorkflowConstants.filePath}=${wfPath}`;

        if (steps && variables){
            resourcesQuery += `&${WorkflowConstants.returnData}=${WorkflowConstants.steps},${WorkflowConstants.variables}`;

        } else if (steps)   {
            resourcesQuery += `&${WorkflowConstants.returnData}=${WorkflowConstants.steps}`;

        } else if (variables)   {
            resourcesQuery += `&${WorkflowConstants.returnData}=${WorkflowConstants.variables}`;

        }

        return ZosmfRestClient.getExpectJSON<IWorkflowDefinition>(session, resourcesQuery, [Headers.APPLICATION_JSON]);
    }

}

