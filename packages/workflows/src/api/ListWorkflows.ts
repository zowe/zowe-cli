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
import { AbstractSession } from "@brightside/imperative";
import { WorkflowConstants, nozOSMFVersion } from "./WorkflowConstants";
import { isNullOrUndefined } from "util";

export class ListWorkflows {
    // Optional, request can include one or more parameters to filter the results
    public static async listWorkflows(session: AbstractSession, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION, category?: string, system?: string,
                                      owner?: string, vendor?: string, statusName?: string ) {
    // This operation returns list of all workflows
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        let resourcesQuery;
        if (category || system || owner || vendor || statusName) {
            resourcesQuery = this.getResourcesQuery(zOSMFVersion, category, system, owner, vendor, statusName);
        } else {
            resourcesQuery = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/${WorkflowConstants.WORKFLOW_RESOURCE}`;
        }
        return ZosmfRestClient.getExpectJSON(session, resourcesQuery);
       // return ZosmfRestClient.getExpectJSON(session, resourcesQuery, [Headers.APPLICATION_JSON]);
    }
    // Builds URI path from provided parameters.
    public static getResourcesQuery(zOSMFVersion: string, category?: string, system?: string, owner?: string, vendor?: string, statusName?: string) {
        let query = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/${WorkflowConstants.WORKFLOW_RESOURCE}`;
        let flag = false;
        let sign;
        if (!isNullOrUndefined(category)) {
            if (flag) {
                sign = `&`;
            } else {
                sign = `?`;
                flag = true;
            }
            query += sign + `${WorkflowConstants.category}=${category}`;
        }
        if (!isNullOrUndefined(system)) {
            if (flag) {
                sign = `&`;
            } else {
                sign = `?`;
                flag = true;
            }
            query += sign + `${WorkflowConstants.system}=${system}`;
        }
        if (!isNullOrUndefined(owner)) {
            if (flag) {
                sign = `&`;
            } else {
                sign = `?`;
                flag = true;
            }
            query += sign + `${WorkflowConstants.owner}=${owner}`;
        }
        if (!isNullOrUndefined(vendor)) {
            if (flag) {
                sign = `&`;
            } else {
                sign = `?`;
                flag = true;
            }
            query += sign + `${WorkflowConstants.vendor}=${vendor}`;
        }
        if (!isNullOrUndefined(statusName)) {
            if (flag) {
                sign = `&`;
            } else {
                sign = `?`;
                flag = true;
            }
            query += sign + `${WorkflowConstants.statusName}=${statusName}`;
        }
        return query;
    }
}

