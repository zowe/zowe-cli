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

/**
 * Constants for various job related info
 * @export
 * @class JobsConstants
 */
export class JobsConstants {
    /**
     * Step data query string
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly STEP_DATA: string = "step-data=Y";

    /**
     * Query identifier
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly QUERY_ID: string = "?";

    /**
     * Query parm delimiter
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly COMBO_ID: string = "&";

    /**
     * Query id for getting job by an owner
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly QUERY_OWNER: string = "owner=";

    /**
     * Query id for getting a job by prefix
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly QUERY_PREFIX: string = "prefix=";

    /**
     * Query id for getting a specific job id
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly QUERY_JOBID: string = "jobid=";

    /**
     * Query id for getting max jobs
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly QUERY_MAX_JOBS: string = "max-jobs=";

    /**
     * Wildcard prefix
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly DEFAULT_PREFIX: string = "*";

    /**
     * Maximum number of jobs to obtain
     * @static
     * @type {number}
     * @memberof JobsConstants
     */
    public static readonly DEFAULT_MAX_JOBS: number = 1000;

    /**
     * URI base jobs API
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly RESOURCE: string = "/zosmf/restjobs/jobs";

    /**
     * URI endpoint for getting spool file content
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly RESOURCE_SPOOL_FILES: string = "/files";

    /**
     * URI endpoint for getting JCL
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly RESOURCE_JCL_CONTENT: string = "/JCL";

    /**
     * URI endpoint for getting spool files
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly RESOURCE_SPOOL_CONTENT: string = "/records";

    /**
     * Cancel request constant
     * @static
     * @memberof JobsConstants
     */
    public static readonly REQUEST_CANCEL = "cancel";

    /**
     * Default version of cancel
     * @static
     * @memberof JobsConstants
     */
    public static readonly DEFAULT_CANCEL_VERSION = "1.0";

     /**
     * Hold a job 
     * @static
     * @memberof JobsConstants
     */
         public static readonly REQUEST_HOLD = "hold";

     /**
     * Release a job 
     * @static
     * @memberof JobsConstants
     */
      public static readonly REQUEST_RELEASE = "release";

    /**
     * Execution data query string
     * @static
     * @type {string}
     * @memberof JobsConstants
     */
    public static readonly EXEC_DATA: string = "exec-data=Y";
}
