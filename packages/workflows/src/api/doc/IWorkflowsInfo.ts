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

import { IExplanationMap } from "@brightside/imperative";

/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IWorkflowsInfo
 */
export interface IWorkflowsInfo {
    /**
     * Type of the software.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    owner?: string;

    /**
     * System on which the software is provisioned.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowDefinitionFileMD5Value?: string;

    /**
     * Sysplex on which the software is provisioned.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    instanceURI?: string;

    /**
     * Vendor of the software.
     * @type {string}
     * @memberof IWorkflowsInfo
     * null - what type is that
     */
    access?: string;

    /**
     * Version of the software.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowKey?: string;

    /**
     * Description for the software.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowName?: string;

    /**
     * The user ID that identifies the owner of the software.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowVersion?: string;

    /**
     * The user ID that identifies the provider of the software.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowDescription?: string;

    /**
     * The current state of the software.
     * @type {string}
     * @memberof IWorkflowsInfo
     */
    workflowID?: string;

    /**
   * The current state of the software.
   * @type {string}
   * @memberof IWorkflowsInfo
   */
    vendor?: string;

   /**
      * The current state of the software.
      * @type {string}
      * @memberof IWorkflowsInfo
      */
   system?: string;

      /**
      * The current state of the software.
      * @type {string}
      * @memberof IWorkflowsInfo
      */
     category?: string;
   /**
      * The current state of the software.
      * @type {string}
      * @memberof IWorkflowsInfo
      */
     statusName?: string;


}

