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


import { AbstractSession } from "@brightside/imperative";
import { ZosmfRestClient } from "../../../rest";
import { WorkflowConstants, nozOSMFVersion, noWorkflowKey } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";

export class DeleteWorkflow {
 public static async deleteWorkflow(session: AbstractSession, workflowKey: string,
                                    zOSMFVersion = WorkflowConstants.ZOSMF_VERSION){
    WorkflowValidator.validateSession(session);
    WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
    WorkflowValidator.validateNotEmptyString(workflowKey, noWorkflowKey.message);
    let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
    resourcesQuery += `${WorkflowConstants.WORKFLOW_RESOURCE}/${workflowKey}`;

    return ZosmfRestClient.deleteExpectString(session, resourcesQuery, []);
 }
}
