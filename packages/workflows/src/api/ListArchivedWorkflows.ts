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


export class ListArchivedWorkflows {
   public static async listArchivedWorkflows(session: AbstractSession, workflowKey?: string,
                                             zOSMFVersion = WorkflowConstants.ZOSMF_VERSION) {
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
        if (workflowKey){
            resourcesQuery += `${WorkflowConstants.ARCH_WORKFLOW_RESOURCE}/${workflowKey}`;
        }
         else  {
            resourcesQuery += `${WorkflowConstants.ARCH_WORKFLOW_RESOURCE}`;
               }
        return ZosmfRestClient.getExpectJSON (session, resourcesQuery);
    }
}
