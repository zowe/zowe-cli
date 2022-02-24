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

import { IExplanationMap } from "@zowe/imperative";
import {
    explainProvisionedInstanceActionsFull,
    explainProvisionedInstanceActionsSummary,
    IProvisionedInstanceActions
} from "./IProvisionedInstanceActions";
import { explainProvisionedInstanceVariable, IProvisionedInstanceVariable } from "./IProvisionedInstanceVariable";

/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IProvisionedInstance
 */
export interface IProvisionedInstance {
    /**
     * Type of the software.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    type: string;

    /**
     * System on which the software is provisioned.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    system: string;

    /**
     * Sysplex on which the software is provisioned.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    sysplex: string;

    /**
     * Vendor of the software.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    vendor: string;

    /**
     * Version of the software.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    version: string;

    /**
     * Description for the software.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    description: string;

    /**
     * The user ID that identifies the owner of the software.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    owner: string;

    /**
     * The user ID that identifies the provider of the software.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    provider: string;

    /**
     * The current state of the software.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    state: string;

    /**
     * Software service instance name, used in generating names for software services instances.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    ssin?: string;

    /**
     * Instance owner's email.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    email?: string;

    /**
     * The object-id for the software services instance.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "object-id": string;

    /**
     * The object-name for the software services instance.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "object-name": string;

    /**
     * Full request URI to z/OSMF with object-id.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "object-uri"?: string;

    /**
     * Type of registry object: catalog or general.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "registry-type": string;

    /**
     * External name of the software services instance.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "external-name": string;

    /**
     * The name of the system entry in the system entry table of the software.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "system-nickname": string;

    /**
     * The identifier of the template that is used when partitioning the software represented
     * by this instance. Only valid when registry-type is catalog.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "catalog-object-id": string;

    /**
     * The name of the template that was used when partitioning the software represented by this instance.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "catalog-object-name": string;

    /**
     * The workflow key that is associated with provisioning the software.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "workflow-key"?: string;

    /**
     * The Indication of whether the workflow instance used to provision this instance
     * will be removed after the workflow is completed. Must be true or false.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "workflow-clean-after-provisioned"?: string;

    /**
     * Indicates the disposition of jobs.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "jobs-disposition"?: string;

    /**
     * The time the object was created. The time is in the ISO8601 format.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "created-time": string;

    /**
     * The time the object was updated. The time is in the ISO8601 format.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "last-modified-time": string;

    /**
     * The user ID that created the object.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "created-by-user": string;

    /**
     * The user ID that last updated the object.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "last-modified-by-user": string;

    /**
     * The name of the last action that was performed.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "last-action-name": string;

    /**
     * The action ID of the last action that was performed.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "last-action-object-id": string;

    /**
     * The state of the last action that was performed.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "last-action-state": string;

    /**
     * 	The user data.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "user-data"?: string;

    /**
     * The user data ID.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "user-data-id": string;

    /**
     * The tenant ID.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "tenant-id": string;

    /**
     * The name of the tenant.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "tenant-name": string;

    /**
     * The domain ID.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "domain-id": string;

    /**
     * The domain name.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "domain-name": string;

    /**
     * Statement of the job.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "job-statement"?: string;

    /**
     * The account information.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "account-info"?: string;

    /**
     * Indicates if auditing is performed on workflows and command actions that
     * are associated with the instance.
     * @type {boolean}
     * @memberof IProvisionedInstance
     */
    "runAsUser-audit"?: boolean;

    /**
     * The time that workflow processing started, in ISO8601 format.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "workflow-start-time"?: string;

    /**
     * The time that workflow automation last stopped, in ISO8601 format.
     * @type {string}
     * @memberof IProvisionedInstance
     */
    "workflow-stop-time"?: string;

    /**
     * For workflow type actions, if provided, the prompt variables, which are the variables
     * that are expected to be prompted for in preparation for running the software services template.
     * @type {IProvisionedInstanceVariable[]}
     * @memberof IProvisionedInstance
     */
    variables?: IProvisionedInstanceVariable[];

    /**
     * The actions for the software.
     * @type {IProvisionedInstanceActions[]}
     * @memberof IProvisionedInstance
     */
    actions?: IProvisionedInstanceActions[];
}


const prettySummary: {
    [key: string]: string;
} = {
    "external-name": "Name",
    "state": "State",
    "object-id": "Object Id",
    "type": "Type",
    "system": "System",
    "sysplex": "Sysplex",
    "version": "Version",
    "description": "Description",
    "owner": "Owner",
    "variables": "Variables",
    "actions": "Actions"
};

const prettyFull: {
    [key: string]: string;
} = {
    ...prettySummary,
    "vendor": "Vendor",
    "provider": "Provider",
    "ssin": "SSIN",
    "object-name": "Object Name",
    "version": "Version",
    "email": "E-Mail",
    "object-uri": "Object URI",
    "registry-type": "Registry Type",
    "system-nickname": "System Nickname",
    "catalog-object-id": "Catalog Object ID",
    "catalog-object-name": "Catalog Object Name",
    "workflow-key": "Workflow Key",
    "workflow-clean-after-provisioned": "Workflow Clean After Provisioned",
    "jobs-disposition": "Jobs Disposition",
    "created-time": "Created Time",
    "last-modified-time": "Last Modified Time",
    "created-by-user": "Created By User",
    "last-modified-by-user": "Last Modified By User",
    "last-action-name": "Last Action Name",
    "last-action-object-id": "Last Action Object ID",
    "last-action-state": "Last Action State",
    "user-data": "User Data",
    "user-data-id": "User Data ID",
    "tenant-id": "Tenant ID",
    "tenant-name": "Tenant Name",
    "domain-id": "Domain ID",
    "domain-name": "Domain Name",
    "job-statement": "Job Statement",
    "account-info": "Account Info",
    "runAsUser-audit": "Run As User Audit",
    "workflow-start-time": "Workflow Start Time",
    "workflow-stop-time": "Workflow Stop Time"

};

/**
 * Main explanation map object for provisioned instance summary output without variables and actions.
 * @type {IExplanationMap}
 * @memberof IProvisionedInstance
 */
export const explainProvisionedInstanceSummary: IExplanationMap = {
    ...prettySummary,
    ignoredKeys: "variables,actions",
    explainedParentKey: null
};

/**
 * Main explanation map object for provisioned instance summary output with variables.
 * @type {IExplanationMap}
 * @memberof IProvisionedInstance
 */
export const explainProvisionedInstanceSummaryWithVars: IExplanationMap = {
    ...prettySummary,
    explainedParentKey: null,
    variables: explainProvisionedInstanceVariable,
    ignoredKeys: "actions"
};

/**
 * Main explanation map object for provisioned instance summary output with actions.
 * @type {IExplanationMap}
 * @memberof IProvisionedInstance
 */
export const explainProvisionedInstanceSummaryWithActions: IExplanationMap = {
    ...prettySummary,
    explainedParentKey: null,
    actions: explainProvisionedInstanceActionsSummary,
    ignoredKeys: "variables"
};

/**
 * Main explanation map object for extended provisioned instance output.
 * @type {IExplanationMap}
 * @memberof IProvisionedInstance
 */
export const explainProvisionedInstanceExtended: IExplanationMap = {
    ...prettyFull,
    explainedParentKey: null,
    actions: explainProvisionedInstanceActionsSummary,
    ignoredKeys: "variables"
};

/**
 * Main explanation map object for full provisioned instance output.
 * @type {IExplanationMap}
 * @memberof IProvisionedInstance
 */
export const explainProvisionedInstanceFull: IExplanationMap = {
    ...prettyFull,
    explainedParentKey: null,
    ignoredKeys: null,
    variables: explainProvisionedInstanceVariable,
    actions: explainProvisionedInstanceActionsFull
};

