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
 * Interface for starting an app on a TSO Address Space
 * @export
 * @interface ISendTsoAppParms
 */
export interface ISendTsoAppParms {

    /**
     * Body contents being sent to TSO address space app
     * @type {string}
     * @memberof ISendTsoAppParms
     */
    message: string;
    /**
     * App Key of application to be started at a TSO address space
     * @type {string}
     * @memberof ISendTsoAppParms
     */
    appKey: string;
    /**
     * Servlet key of an active address space
     * @type {string}
     * @memberof ISendTsoAppParms
     */
    servletKey: string;
}
