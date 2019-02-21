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


import { AbstractSession, Headers, ImperativeError } from "@brightside/imperative";
import { ZosmfRestClient } from "../../../rest";
import {
    WorkflowConstants,
    nozOSMFVersion,
    noWorkflowName,
    noWorkflowDefinitionFile,
    noSystemName,
    noOwner,
    wrongOwner, wrongPath
} from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";
import { isNullOrUndefined } from "util";
import { ICreateWorkflow, accessT } from "./doc/ICreateWorkflow";
import { ICreatedWorkflow } from "./doc/ICreatedWorkflow";
import { IVariable } from "./doc/IVariables";

/**
 * Class to handle creation of zOSMF workflow instance
 */
export class CreateWorkflow{

    /**
     * copied from ProvisioningService.ts
     * Parsers text with properties in key1=val1,key2=val2 format and returns IInputProperty[]
     * @param {string} propertiesText - required runtime property objects passed as a string.
     * @returns {IPropertiesInput[]} array of properties, @see {IPropertiesInput}
     * @memberof ProvisioningService
     */
    public static parseProperties(propertiesText: string): IVariable[] {
        if (propertiesText === "") {
            return [];
        }
        return propertiesText.split(",").map((property) => {
            const tempArray = property.split("=");
            if (tempArray.length === 2 && tempArray[0].length > 0) {
                return {name: tempArray[0].trim(), value: tempArray[1].trim()};
            } else {
                throw new ImperativeError({msg: `Incorrect properties format: ${propertiesText}`});
            }
        });
    }
    /**
     * Create a zOSMF workflow instance
     * @param {AbstractSession} session                     - z/OSMF connection info
     * @param {string} WorkflowName                         - Name of the workflow that will be created
     * @param {string} WorkflowDefinitionFile               - Full path to USS file or DATASET/MEMBER with xml
     * @param {string} systemName                           - System where the workflow will run
     * @param {string} Owner                                - User ID of the workflow owner.
     * @param {string} VariableInputFile                    - Properties file with pre-specify values for workflow variables
     * @param {string} Variables                            - A list of one or more variables for the workflow.
     * @param {boolean} AssignToOwner                       - Indicates whether the workflow steps are assigned to the workflow owner
     * @param {accessT} AccessType                          - Specifies the access type for the workflow. Public, Restricted or Private.
     * @param {boolean} DeleteCompletedJobs                 - Specifies whether the job is deleted from the JES spool after it completes successfully.
     * @param {string} zOSMFVersion                         - Identifies the version of the zOSMF workflow service.
     * @returns {Promise<ICreatedWorkflow>}
     */
    public static createWorkflow(session: AbstractSession, WorkflowName: string, WorkflowDefinitionFile: string,
                                 systemName: string, Owner: string, VariableInputFile?: string, Variables?: string,
                                 AssignToOwner?: boolean, AccessType?: accessT, DeleteCompletedJobs?: boolean,
                                 zOSMFVersion = WorkflowConstants.ZOSMF_VERSION,
                                    // add job statement, account info, comments and resolveGlobalConflictByUsing,
                                    ): Promise<ICreatedWorkflow> {
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        WorkflowValidator.validateNotEmptyString(WorkflowName, noWorkflowName.message);
        WorkflowValidator.validateNotEmptyString(WorkflowDefinitionFile, noWorkflowDefinitionFile.message);
        WorkflowValidator.validatePath(WorkflowDefinitionFile, wrongPath.message);
        WorkflowValidator.validateNotEmptyString(systemName, noSystemName.message);
        WorkflowValidator.validateNotEmptyString(Owner, noOwner.message);
        WorkflowValidator.validateOwner(Owner, wrongOwner.message);

        if (WorkflowDefinitionFile.charAt(0) === "/" && WorkflowDefinitionFile.charAt(1) === "/") {
            WorkflowDefinitionFile = WorkflowDefinitionFile.substring(1);
        }

        const data: ICreateWorkflow = {
            workflowName: WorkflowName,
            workflowDefinitionFile: WorkflowDefinitionFile,
            system: systemName,
            owner: Owner,
            assignToOwner: AssignToOwner,
            accessType: AccessType,
            deleteCompletedJobs: DeleteCompletedJobs,
        };
        if (!isNullOrUndefined(VariableInputFile)){
            WorkflowValidator.validatePath(VariableInputFile, wrongPath.message);
            data.variableInputFile = VariableInputFile;
        }
        if (!isNullOrUndefined(Variables)){
            data.variables = this.parseProperties(Variables);
        }
        if (isNullOrUndefined(AssignToOwner)){
            data.assignToOwner = true;
        }
        if (isNullOrUndefined(AccessType)){
            data.accessType = "Public";
        }
        if (isNullOrUndefined(DeleteCompletedJobs)){
            data.deleteCompletedJobs = false;
        }

        const resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/${WorkflowConstants.WORKFLOW_RESOURCE}`;

        return ZosmfRestClient.postExpectJSON<ICreatedWorkflow>(session, resourcesQuery, [Headers.APPLICATION_JSON], data);
    }
}
