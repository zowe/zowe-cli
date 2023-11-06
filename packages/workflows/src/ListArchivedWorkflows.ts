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

import { ZosmfRestClient, nozOSMFVersion } from "@zowe/core-for-zowe-sdk";
import { WorkflowValidator } from "./WorkflowValidator";
import { AbstractSession, Headers } from "@zowe/core-for-zowe-sdk";
import { WorkflowConstants } from "./WorkflowConstants";
import { IArchivedWorkflows } from "./doc/IArchivedWorkflows";


export class ListArchivedWorkflows {
    public static async listArchivedWorkflows(session: AbstractSession,
        zOSMFVersion = WorkflowConstants.ZOSMF_VERSION): Promise<IArchivedWorkflows> {
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        const resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/${WorkflowConstants.ARCH_WORKFLOW_RESOURCE}`;

        return ZosmfRestClient.getExpectJSON (session, resourcesQuery, [Headers.APPLICATION_JSON]);
    }
}
