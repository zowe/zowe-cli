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
import { IActiveWorkflows } from "./doc/IActiveWorkflows";
import { IGetWorkflowsOptions } from "./doc/IGetWorkflowsOptions";

/**
 * Get list of workflows from registry.
 * @export
 * @class ListWorkflows
 */
export class ListWorkflows {
    /**
     * This operation returns list of workflows.
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
     * @memberof ListWorkflows
     * @deprecated
     */
    public static async listWorkflows(session: AbstractSession, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION,
                                      workflowName?: string, category?: string, system?: string,
                                      owner?: string, vendor?: string, statusName?: string ) {
        return this.getWorkflows(session, {zOSMFVersion, workflowName, category, system, owner, vendor, statusName});
    }

    /**
     * This operation returns list of workflows.
     * Parameters are optional,request can include one or more parameters to filter the results.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IGetWorkflowsOptions} options - Options to filter the request
     * @returns {string} z/OSMF response object
     * @memberof ListWorkflows
     */
    public static async getWorkflows(session: AbstractSession, options: IGetWorkflowsOptions = {}) {
        WorkflowValidator.validateSession(session);
        options = {
          ...options,
          zOSMFVersion: options.zOSMFVersion ?? WorkflowConstants.ZOSMF_VERSION,
          workflowName: options.workflowName ? encodeURIComponent(options.workflowName) : null
        }
        WorkflowValidator.validateNotEmptyString(options.zOSMFVersion, nozOSMFVersion.message);
        const resourcesQuery: string = ListWorkflows.getResourceQuery(options);
        return ZosmfRestClient.getExpectJSON(session, resourcesQuery);
    }

    /**
     * This operation Builds URI path from provided parameters.
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {string} params - The array with URI path with filters for listing filtered workflows.
     * @returns {string} URI path for the REST call.
     * @memberof ListWorkflows
     * @deprecated
     */
    public static getResourcesQuery(zOSMFVersion: string, params: Array <{key: string, value: string}>) {
        let query: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/${WorkflowConstants.WORKFLOW_RESOURCE}`;
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
     * This operation Builds URI path from provided parameters.
     * @param {IGetWorkflowsOptions} params - The array with URI path with filters for listing filtered workflows.
     * @returns {string} URI path for the REST call.
     * @memberof ListWorkflows
     */
    public static getResourceQuery(params: IGetWorkflowsOptions) {
        let query: string = `${WorkflowConstants.RESOURCE}/${params.zOSMFVersion}/${WorkflowConstants.WORKFLOW_RESOURCE}`;
        let sign = "?";
        for (const key in params) {
            if (key === "zOSMFVersion") continue;
            if (params[key]) {
                // Validate if parameter value does not contains ? or &
                WorkflowValidator.validateParameter(params[key], wrongString.message);
                query += sign + `${key}=${params[key]}`;
                sign = "&";
            }
        }
        return query;
    }

    /**
     * This operation is used to return a worflow-key by given workflow name.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} workflowName - workflow name by which to list workflows
     * @param {string} zOSMFVersion - identifies the version of the provisioning service.
     * @returns {Promise<string> | null} - Promise with string containing wf key, or null if none was found
     * @throws {ImperativeError}
     * @memberof ListWorkflows
     */
    public static async getWfKey(session: AbstractSession, workflowName: string,
                                 zOSMFVersion = WorkflowConstants.ZOSMF_VERSION): Promise<string> | null{

        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        WorkflowValidator.validateNotEmptyString(workflowName, noWorkflowName.message);

        const result: IActiveWorkflows = await this.getWorkflows(session, {workflowName});

        // Check if there was more than one workflows found
        if (result.workflows.length > 1){
            throw new ImperativeError({
                msg: `More than one workflows found with name ` + workflowName
            });
        }
        return result.workflows.length !== 0 ? result.workflows[0].workflowKey : null;
    }
}
