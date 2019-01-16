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

import { IAutomationStatus } from "./IAutomationStatus";
/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IWorkflowsInfo
 */
export interface IWorkflowInfo {
    owner: string;
    accountInfo: string;
    access: string;
    productID: string;
    softwareType: string;
    workflowName: string;
    automationStatus: IAutomationStatus;
    percentComplete: string;
    workflowDescription: string;
    jobStatement: string;
    deleteCompletedJobs: string;
    productName: string;
    containsParallelSteps: string;
    workflowDefinitionFileMD5Value: string;
    isCallable: string;
    productVersion: string;
    system: string;
    vendor: string;
    scope: string;
    workflowKey: string;
    statusName: string;
    workflowVersion: string;
    category: string;
    workflowID: string;
}
