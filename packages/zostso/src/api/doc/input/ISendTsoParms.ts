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
 * Interface for TSO issue command z/OSMF parameters
 * @export
 * @interface IIssueTsoParms
 */
export interface ISendTsoParms {

    /**
     * Servlet key of an active address space
     * @type string
     * @memberOf ISendTsoParms
     */
    servletKey: string;
    /**
     * Data to be sent to the active address space
     * @type string
     * @memberOf ISendTsoParms
     */
    data: string;

}
