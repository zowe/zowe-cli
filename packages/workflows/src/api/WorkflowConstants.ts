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
     * URI base for list workflows from registry API.
     * @static
     * @type {string}
     * @memberof WorkflowConstants
     */
    public static readonly LIST_WORKFLOWS: string = "operations/list";

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

    /**
     * URI base for filter workflows from registry API.
     * @static
     * @type {string}
     * @memberof WorkflowConstants
     */
    public static readonly workflowName: string = "workflowName";


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
 * Error message that no workflow definition file parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof WorkflowConstants
 */
export const noWorkflowDefinitionFile: IMessageDefinition = {
    message: apiErrorHeader + `No workflow definition file parameter was supplied.`
};
/**
 * Error message that no workflow name parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof WorkflowConstants
 */
export const noWorkflowName: IMessageDefinition = {
    message: apiErrorHeader + `No workflow name parameter was supplied.`
};
/**
 * Error message that no system name parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof WorkflowConstants
 */
export const noSystemName: IMessageDefinition = {
    message: apiErrorHeader + `No system name parameter was supplied.`
};
/**
 * Error message that no system name parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof WorkflowConstants
 */
export const wrongString: IMessageDefinition = {
    message: apiErrorHeader + `Parameter contains wrong character - & or ?.`
};
/**
 * Error message that no owner parameter string was supplied.
 * @static
 * @type {IMessageDefinition}
 * @memberof WorkflowConstants
 * TODO: userID validation: consists of one to eight alphanumeric characters (A-Z, a-z, 0-9, #, $, and @)
 */
export const noOwner: IMessageDefinition = {
    message: apiErrorHeader + `No owner parameter was supplied.`
};
export const wrongPath: IMessageDefinition = {
    message: apiErrorHeader + `Wrong format of USS path or DSNAME supplied.`
};
export const wrongOwner: IMessageDefinition = {
    message: apiErrorHeader + `Wrong format of user ID supplied.`
};

