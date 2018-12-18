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

import { IMessageDefinition, apiErrorHeader } from "@brightside/imperative";

/**
 * Constants for workflow related APIs.
 * @export
 * @class WorkflowConstants
 */
export class WorkflowConstants {

    /**
     * URI base for workflow API.
     * @static
     * @type {string}
     * @memberof WorkflowConstants
     */
    public static readonly RESOURCE: string = "/zosmf/workflow/rest";

    /**
     * URI base for workflows API.
     * @static
     * @type {string}
     * @memberof WorkflowConstants
     */
    public static readonly WORKFLOW_RESOURCE: string = "workflows";

    /**
     * URI base for starting workflow API.
     * @static
     * @type {string}
     * @memberof WorkflowConstants
     */
    public static readonly START_WORKFLOW: string = "operations/start";

    /**
     * URI base for filtering workflow by name API.
     * @static
     * @type {string}
     * @memberof WorkflowConstants
     */
    public static readonly WF_NAME: string = "workflowName";

    /**
     * Version of the z/OSMF
     * @static
     * @type {string}
     * @memberOf WorkflowConstants
     */
    public static readonly ZOSMF_VERSION: string = "1.0";

}

/**
 * Error message that no session was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof WorkflowConstants
 */
export const noSession: IMessageDefinition = {
    message: apiErrorHeader + `No session was supplied.`
};

/**
 * Error message that no z/OSMF version parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof WorkflowConstants
 */
export const nozOSMFVersion: IMessageDefinition = {
    message: apiErrorHeader + `No z/OSMF version parameter was supplied.`
};


/**
 * Error message that no workflow key string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof WorkflowConstants
 */
export const noWorkflowKey: IMessageDefinition = {
    message: apiErrorHeader + `No workflow key parameter was supplied.`
};

