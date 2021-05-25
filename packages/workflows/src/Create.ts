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


import { AbstractSession, Headers, ImperativeError } from "@zowe/imperative";
import { ZosmfRestClient, nozOSMFVersion } from "@zowe/core-for-zowe-sdk";
import {
    WorkflowConstants,
    noWorkflowName,
    noWorkflowDefinitionFile,
    noSystemName,
    noOwner,
    wrongOwner
} from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";
import { isNullOrUndefined } from "util";
import { ICreateWorkflow, accessT } from "./doc/ICreateWorkflow";
import { ICreatedWorkflow } from "./doc/ICreatedWorkflow";
import { ICreatedWorkflowLocal } from "./doc/ICreatedWorkflowLocal";
import { IVariable } from "./doc/IVariable";
import { Upload, Delete } from "@zowe/zos-files-for-zowe-sdk";
import { basename } from "path";
import { IParamsCreateWorkflow } from "./doc/IParamsCreateWorkflow";
import { IParamsCreateWorkflowLocal } from "./doc/IParamsCreateWorkflowLocal";

/**
 * Class to handle creation of zOSMF workflow instance
 */
export class CreateWorkflow {

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
                return { name: tempArray[0].trim(), value: tempArray[1].trim() };
            } else {
                throw new ImperativeError({ msg: `Incorrect properties format: ${propertiesText}` });
            }
        });
    }
    /**
     * Create a zOSMF workflow instance
     * @deprecated Use createWorkflow2 instead
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
                                 zOSMFVersion = WorkflowConstants.ZOSMF_VERSION
        // add job statement, account info, comments and resolveGlobalConflictByUsing,
    ): Promise<ICreatedWorkflow> {
        return this.createWorkflow2({session,
                                     WorkflowName,
                                     WorkflowDefinitionFile,
                                     systemName,
                                     Owner,
                                     VariableInputFile,
                                     Variables,
                                     AssignToOwner,
                                     AccessType,
                                     DeleteCompletedJobs,
                                     zOSMFVersion
        });
    }
    /**
     * Create a zOSMF workflow instance
     * @param {IParamsCreateWorkflow} createWorkflowParams  - Parameters for the creation of the workflow
     * @returns {Promise<ICreatedWorkflow>}
     */
    public static createWorkflow2(createWorkflowParams: IParamsCreateWorkflow
    ): Promise<ICreatedWorkflow> {
        WorkflowValidator.validateSession(createWorkflowParams.session);
        WorkflowValidator.validateNotEmptyString(createWorkflowParams.zOSMFVersion, nozOSMFVersion.message);
        WorkflowValidator.validateNotEmptyString(createWorkflowParams.WorkflowName, noWorkflowName.message);
        WorkflowValidator.validateNotEmptyString(createWorkflowParams.WorkflowDefinitionFile, noWorkflowDefinitionFile.message);
        WorkflowValidator.validateNotEmptyString(createWorkflowParams.systemName, noSystemName.message);
        WorkflowValidator.validateNotEmptyString(createWorkflowParams.Owner, noOwner.message);
        WorkflowValidator.validateOwner(createWorkflowParams.Owner, wrongOwner.message);

        if (createWorkflowParams.WorkflowDefinitionFile.charAt(0) === "/" && createWorkflowParams.WorkflowDefinitionFile.charAt(1) === "/") {
            createWorkflowParams.WorkflowDefinitionFile = createWorkflowParams.WorkflowDefinitionFile.substring(1);
        }

        const data: ICreateWorkflow = {
            workflowName: createWorkflowParams.WorkflowName,
            workflowDefinitionFile: createWorkflowParams.WorkflowDefinitionFile,
            system: createWorkflowParams.systemName,
            owner: createWorkflowParams.Owner,
            assignToOwner: createWorkflowParams.AssignToOwner,
            accessType: createWorkflowParams.AccessType,
            deleteCompletedJobs: createWorkflowParams.DeleteCompletedJobs
        };
        if (!isNullOrUndefined(createWorkflowParams.VariableInputFile)) {
            if (createWorkflowParams.VariableInputFile.charAt(0) === "/" && createWorkflowParams.VariableInputFile.charAt(1) === "/") {
                createWorkflowParams.VariableInputFile = createWorkflowParams.VariableInputFile.substring(1);
            }
            data.variableInputFile = createWorkflowParams.VariableInputFile;
        }
        if (!isNullOrUndefined(createWorkflowParams.Variables)) {
            data.variables = this.parseProperties(createWorkflowParams.Variables);
        }
        if (isNullOrUndefined(createWorkflowParams.AssignToOwner)) {
            data.assignToOwner = true;
        }
        if (isNullOrUndefined(createWorkflowParams.AccessType)) {
            data.accessType = "Public";
        }
        if (isNullOrUndefined(createWorkflowParams.DeleteCompletedJobs)) {
            data.deleteCompletedJobs = false;
        }
        if (!isNullOrUndefined(createWorkflowParams.JobStatement)) {
            data.jobStatement = createWorkflowParams.JobStatement.join("\n");
        }
        if (!isNullOrUndefined(createWorkflowParams.zOSMFVersion)) {
            createWorkflowParams.zOSMFVersion = WorkflowConstants.ZOSMF_VERSION;
        }

        const resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${createWorkflowParams.zOSMFVersion}/${WorkflowConstants.WORKFLOW_RESOURCE}`;

        return ZosmfRestClient.postExpectJSON<ICreatedWorkflow>(createWorkflowParams.session, resourcesQuery, [Headers.APPLICATION_JSON], data);
    }
    /**
     * Create a zOSMF workflow instance using local files
     * @deprecated Use createWorkflowLocal2 instead
     * @param {AbstractSession} session                     - z/OSMF connection info
     * @param {string} WorkflowName                         - Name of the workflow that will be created
     * @param {string} WorkflowDefinitionFile               - Local workflow definition file
     * @param {string} systemName                           - System where the workflow will run
     * @param {string} Owner                                - User ID of the workflow owner.
     * @param {string} VariableInputFile                    - Local properties file with pre-specify values for workflow variables
     * @param {string} Variables                            - A list of one or more variables for the workflow.
     * @param {boolean} AssignToOwner                       - Indicates whether the workflow steps are assigned to the workflow owner
     * @param {accessT} AccessType                          - Specifies the access type for the workflow. Public, Restricted or Private.
     * @param {boolean} DeleteCompletedJobs                 - Specifies whether the job is deleted from the JES spool after it completes successfully.
     * @param {string} zOSMFVersion                         - Identifies the version of the zOSMF workflow service.
     * @param {boolean} keepFiles                           - Identifies if the uploaded uss files should be kept.
     * @param {string} customDir                            - Path to specific USS directory in which to upload the temp files.
     * @returns {Promise<ICreatedWorkflowLocal>}
     */
    public static async createWorkflowLocal(session: AbstractSession, WorkflowName: string, WorkflowDefinitionFile: string,
                                            systemName: string, Owner: string, VariableInputFile?: string, Variables?: string,
                                            AssignToOwner?: boolean, AccessType?: accessT, DeleteCompletedJobs?: boolean,
                                            keepFiles?: boolean, customDir?: string,
                                            zOSMFVersion = WorkflowConstants.ZOSMF_VERSION): Promise<ICreatedWorkflowLocal> {
        return this.createWorkflowLocal2({
            session,
            WorkflowName,
            WorkflowDefinitionFile,
            systemName,
            Owner,
            VariableInputFile,
            Variables,
            AssignToOwner,
            AccessType,
            DeleteCompletedJobs,
            keepFiles,
            customDir,
            zOSMFVersion
        });
    }

    /**
     * Create a zOSMF workflow instance using local files
     * @param {IParamsCreateWorkflowLocal} createWorkflowLocalParams - Parameters for the workflow creation
     * @returns {Promise<ICreatedWorkflowLocal>}
     */
    public static async createWorkflowLocal2(createWorkflowLocalParams: IParamsCreateWorkflowLocal): Promise<ICreatedWorkflowLocal> {
        WorkflowValidator.validateSession(createWorkflowLocalParams.session);
        WorkflowValidator.validateNotEmptyString(createWorkflowLocalParams.zOSMFVersion, nozOSMFVersion.message);
        WorkflowValidator.validateNotEmptyString(createWorkflowLocalParams.WorkflowName, noWorkflowName.message);
        WorkflowValidator.validateNotEmptyString(createWorkflowLocalParams.WorkflowDefinitionFile, noWorkflowDefinitionFile.message);
        WorkflowValidator.validateNotEmptyString(createWorkflowLocalParams.systemName, noSystemName.message);
        WorkflowValidator.validateNotEmptyString(createWorkflowLocalParams.Owner, noOwner.message);
        WorkflowValidator.validateOwner(createWorkflowLocalParams.Owner, wrongOwner.message);

        const tempDefinitionFile: string = CreateWorkflow.getTempFile(createWorkflowLocalParams.session.ISession.user,
            createWorkflowLocalParams.WorkflowDefinitionFile, createWorkflowLocalParams.customDir);
        await CreateWorkflow.uploadTempFile(createWorkflowLocalParams.session, createWorkflowLocalParams.WorkflowDefinitionFile, tempDefinitionFile);

        let tempVariableInputFile: string;

        if (createWorkflowLocalParams.VariableInputFile) {
            tempVariableInputFile = CreateWorkflow.getTempFile(createWorkflowLocalParams.session.ISession.user,
                createWorkflowLocalParams.VariableInputFile, createWorkflowLocalParams.customDir);
            await CreateWorkflow.uploadTempFile(createWorkflowLocalParams.session, createWorkflowLocalParams.VariableInputFile,
                tempVariableInputFile);
        }

        const workflowParams: IParamsCreateWorkflow = {
            Owner: createWorkflowLocalParams.Owner,
            WorkflowDefinitionFile: tempDefinitionFile,
            WorkflowName: createWorkflowLocalParams.WorkflowName,
            session: createWorkflowLocalParams.session,
            systemName: createWorkflowLocalParams.systemName,
            AccessType: createWorkflowLocalParams.AccessType,
            AssignToOwner: createWorkflowLocalParams.AssignToOwner,
            DeleteCompletedJobs: createWorkflowLocalParams.DeleteCompletedJobs,
            JobStatement: createWorkflowLocalParams.JobStatement,
            VariableInputFile: createWorkflowLocalParams.VariableInputFile,
            Variables: createWorkflowLocalParams.Variables,
            zOSMFVersion: createWorkflowLocalParams.zOSMFVersion
        };
        const resp: ICreatedWorkflowLocal = await this.createWorkflow2(workflowParams);

        if (!createWorkflowLocalParams.keepFiles) {
            resp.failedToDelete = [await CreateWorkflow.deleteTempFile(createWorkflowLocalParams.session, tempDefinitionFile)];
            if (createWorkflowLocalParams.VariableInputFile) {
                !resp.failedToDelete[0] ?
                    resp.failedToDelete = [await CreateWorkflow.deleteTempFile(createWorkflowLocalParams.session, tempVariableInputFile)] :
                    resp.failedToDelete.push(await CreateWorkflow.deleteTempFile(createWorkflowLocalParams.session, tempVariableInputFile));
            }
        } else {
            resp.filesKept = [tempDefinitionFile];
            if (createWorkflowLocalParams.VariableInputFile) {
                resp.filesKept.push(tempVariableInputFile);
            }
        }

        return resp;
    }

    /**
     * Get a full path with file name for a temporary USS file
     * @param {string} userId                               - User ID to add to the file name.
     * @param {string} localFile                            - Local file name.
     * @param {string} customDir                            - Custom directory.
     * @returns {string}
     */
    public static getTempFile(userId: string, localFile: string, customDir?: string): string {
        let remoteFile: string;
        if (customDir) {
            remoteFile = customDir + "/" + basename(localFile);
        } else {
            remoteFile = WorkflowConstants.tempPath + "/" + userId + Date.now().toString() + basename(localFile);
        }
        return remoteFile;
    }

    /**
     *  Upload USS files to default dir, or a user specified one
     * @param {AbstractSession} session                     - z/OSMF connection info.
     * @param {string} localFile                            - Local file to upload.
     * @param {string} remoteFile                           - Remote location to upload to.
     * @throws {ImperativeError}                            - In case something goes wrong.
     */
    public static async uploadTempFile(session: AbstractSession, localFile: string, remoteFile: string) {
        try {
            await Upload.fileToUSSFile(session, localFile, remoteFile, true);
        } catch (error) {
            throw new ImperativeError({
                msg: "Failed to create temporary uss file\n" + (error.message) + "\n" + (error.additionalDetails)
            });
        }
    }

    /**
     * Delete USS file
     * @param {AbstractSession} session                     - z/OSMF connection info.
     * @param {string} ussFileName                          - USS file to delete.
     */
    public static async deleteTempFile(session: AbstractSession, ussFileName: string): Promise<string> {
        try {
            let deletableLocation: string;
            ussFileName.startsWith("/") ? deletableLocation = ussFileName.slice(1) : deletableLocation = ussFileName;
            await Delete.ussFile(session, deletableLocation);
        } catch (error) {
            return ussFileName;
        }
        return;
    }
}
