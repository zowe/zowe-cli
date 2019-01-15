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
import { WorkflowConstants, nozOSMFVersion, noWorkflowName, noWorkflowDefinitionFile, noSystemName, noOwner } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";
import { isNullOrUndefined } from "util";
import { ICreateWorkflow, accessT } from "./doc/ICreateWorkflow";
import { ICreatedWorkflow } from "./doc/ICreatedWorkflow";
import { IVariable } from "./doc/IVariables";

// copied from ProvisioningService.ts
export class CreateWorkflow{
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
        WorkflowValidator.validateNotEmptyString(systemName, noSystemName.message);
        WorkflowValidator.validateNotEmptyString(Owner, noOwner.message);
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

        return ZosmfRestClient.postExpectJSON<ICreatedWorkflow>(session, resourcesQuery, [], data);
    }
}
