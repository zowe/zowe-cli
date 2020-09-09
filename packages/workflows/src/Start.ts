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


import { AbstractSession, Headers } from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { WorkflowConstants, noWorkflowKey, nozOSMFVersion } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";
import { IStartWorkflow, startT } from "./doc/IStartWorkflow";
import { isNullOrUndefined } from "util";

/**
 * Class to handle starting of zOSMF workflow instance
 */
export class StartWorkflow{

    /**
     * Create a zOSMF workflow instance
     * @param {AbstractSession} session                     - z/OSMF connection info
     * @param {string} workflowKey                          - Unique key that workflow instant got assigned by zOSMF
     * @param {string} resolveConflict                      - Indicates how variable conflicts are to be handled when
     *                                                        the Workflows task reads in the output file from a step.
     *                                                        Allowed values are: outputFileValue, existingValue,
     *                                                        leaveConflict(have to resolve conflict manually)
     * @param {string} step                                 - Specifies the step name that will run.
     * @param {string} subsequent                           - If the workflow contains any subsequent automated steps,
     *                                                        this property indicates whether z/OSMF is to perform the steps.
     * @param {string} zOSMFVersion                         - Identifies the version of the zOSMF workflow service.
     * @returns {Promise}
     */
    public static async startWorkflow(session: AbstractSession, workflowKey: string, resolveConflict?: startT, step?: string,
                                      subsequent?: boolean, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION) {

        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(workflowKey, noWorkflowKey.message);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);

        const data: IStartWorkflow = {};
        if (resolveConflict) {
            data.resolveConflictByUsing = resolveConflict;
        }
        if (step) {
            // TODO error if stepName doesn't exist + add to unit and system tests
            data.stepName = step;
        }
        if (!isNullOrUndefined(subsequent)) {
            data.performSubsequent = subsequent;
        }

        let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${WorkflowConstants.WORKFLOW_RESOURCE}/${workflowKey}/${WorkflowConstants.START_WORKFLOW}`;

        return ZosmfRestClient.putExpectString(session, resourcesQuery, [Headers.APPLICATION_JSON], data );
    }
}

