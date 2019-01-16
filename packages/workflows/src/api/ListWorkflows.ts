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
import { AbstractSession, Headers, ImperativeError } from "@brightside/imperative";
import { WorkflowConstants, nozOSMFVersion, noVendor, noStatusName, noSystem, noOwner, noCategory, noFilter } from "./WorkflowConstants";
import { isNullOrUndefined } from "util";
import { IWorkflowInfo } from "./doc/IWorkflowInfo";
import { IWorkflowsInfo } from "./doc/IWorkflowsInfo";
import { IVariable } from "./doc/IVariables";

export class ListWorkflows {
    // Optional, request can include one or more parameters to filter the results
    public static async listWorkflows(session: AbstractSession, filteredQuery?: string, category?: string, system?: string, owner?: string,
                                      vendor?: string, statusName?: string, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION) {
    // This operation returns list of all workflows
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        WorkflowValidator.validateNotEmptyString(vendor, noVendor.message);
        WorkflowValidator.validateNotEmptyString(statusName, noStatusName.message);
        WorkflowValidator.validateNotEmptyString(system, noSystem.message);
        WorkflowValidator.validateNotEmptyString(owner, noOwner.message);
        const resourcesQuery = filteredQuery ? filteredQuery : this.getResourcesQuery(zOSMFVersion);
        return ZosmfRestClient.getExpectJSON(session, resourcesQuery, [Headers.APPLICATION_JSON]);
    }

    //   public static ListWorkflows(session: AbstractSession, owner?: string, vendor?: string,
    //     system?: string, statusName?: string, category?: string,
    //     zOSMFVersion = WorkflowConstants.ZOSMF_VERSION,WorkflowValidator.validateSession(session);
    

    // This operation returns list filtered workflows
    public static async listFilteredWorkflows(session: AbstractSession, zOSMFVersion: string, category?: string, system?: string,
                                              owner?: string, vendor?: string, statusName?: string)
    {
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        const query = this.getResourcesQuery(zOSMFVersion, category, system, owner, vendor, statusName);
        return this.listWorkflows(session, zOSMFVersion, query);
    }
    // Builds URI path from provided parameters.
    public static getResourcesQuery(zOSMFVersion: string, category?: string, system?: string, owner?: string, vendor?: string, statusName?: string) {
        let query = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/${WorkflowConstants.WORKFLOW_RESOURCE}`;
        if (!isNullOrUndefined(category)) {
            query += `?${WorkflowConstants.category}=${category}`;
        }
        if (!isNullOrUndefined(system)) {
            query += `?${WorkflowConstants.system}=${system}`;
        }
        if (!isNullOrUndefined(owner)) {
            query += `?${WorkflowConstants.owner}=${owner}`;
        }
        if (!isNullOrUndefined(vendor)) {
            query += `?${WorkflowConstants.vendor}=${vendor}`;
        }
        if (!isNullOrUndefined(statusName)) {
            query += `?${WorkflowConstants.statusName}=${statusName}`;
        }
        return query;
    }
}

