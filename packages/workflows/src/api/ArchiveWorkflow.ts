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
import { AbstractSession, Headers } from "@brightside/imperative";
import { WorkflowConstants, noWorkflowKey, nozOSMFVersion } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";
import { IArchivedWorkflow } from "./doc/IArchivedWorkflow";

/**
 * Class to handle archiving the workflow instance in z/OSMF
 *
 * @export
 * @class ArchiveWorkflow
 */
export class ArchiveWorkflow {
    /**
     * Archives the workflow based on the workflow key
     *
     * @static
     * @param {AbstractSession} session z/OSMF session
     * @param {string} workflowKey Workflow key of the workflow to be archived
     * @param {string} [zOSMFVersion=WorkflowConstants.ZOSMF_VERSION] z/OSMF REST API version
     * @returns {Promise<IArchivedWorkflow>} Promise of the output of the workflow archiving
     * @memberof ArchiveWorkflow
     */
    public static archiveWorfklowByKey(session: AbstractSession,
                                       workflowKey: string,
                                       zOSMFVersion: string=WorkflowConstants.ZOSMF_VERSION): Promise<IArchivedWorkflow> {
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(workflowKey, noWorkflowKey.message);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);

        let query: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/${WorkflowConstants.WORKFLOW_RESOURCE}`;
        query+=`/${workflowKey}/${WorkflowConstants.ARCHIVE_WORKFLOW}`;

        return ZosmfRestClient.postExpectJSON(session, query, [Headers.APPLICATION_JSON], null);
    }
}
