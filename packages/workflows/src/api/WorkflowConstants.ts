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
     * Version of the z/OSMF
     * @static
     * @type {string}
     * @memberOf WorkflowConstants
     */
    public static readonly ZOSMF_VERSION: string = "1.0";

    /**
     * URI base for list workflows from registry API.
     * @static
     * @type {string}
     * @memberof WorkflowConstants
     */
    public static readonly LIST_WORKFLOWS: string = "operations/list";

    /**
        * URI base for filter workflows from registry API.
        * @static
        * @type {string}
        * @memberof WorkflowConstants
        */
    public static readonly category: string = "category";

    /**
      * URI base for filter workflows from registry API.
      * @static
      * @type {string}
      * @memberof WorkflowConstants
      */
    public static readonly system: string = "system";

    /**
      * URI base for filter workflows from registry API.
      * @static
      * @type {string}
      * @memberof WorkflowConstants
      */
    public static readonly owner: string = "owner";

    /**
      * URI base for filter workflows from registry API.
      * @static
      * @type {string}
      * @memberof WorkflowConstants
      */
    public static readonly vendor: string = "vendor";

    /**
      * URI base for filter workflows from registry API.
      * @static
      * @type {string}
      * @memberof WorkflowConstants
      */
    public static readonly statusName: string = "statusName";

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


/**
 * Error message that no value for filter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof WorkflowConstants
 */
export const noFilter: IMessageDefinition = {
    message: apiErrorHeader + `No value for filter parameter was supplied.`
};
