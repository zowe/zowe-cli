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
import { WorkflowConstants, noWorkflowKey } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";
// import { GetWfKey } from "./GetWfKey";
import { isNullOrUndefined } from "util";

export class StartWorkflow{
    public static async startWorkflow(session: AbstractSession, workflowKey: string) {

        const zOSMFVersion = WorkflowConstants.ZOSMF_VERSION;
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(workflowKey, noWorkflowKey.message);

        let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${WorkflowConstants.WORKFLOW_RESOURCE}/${workflowKey}/${WorkflowConstants.START_WORKFLOW}`;

        return ZosmfRestClient.putExpectString(session, resourcesQuery, [Headers.APPLICATION_JSON], { });
    }
}

