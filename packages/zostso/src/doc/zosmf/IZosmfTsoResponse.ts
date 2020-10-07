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

import { ITsoMessages, IZosfmMessages } from "../../";

/**
 * z/OSMF synchronous most tso command response messages. See the z/OSMF REST API publication for complete details.
 * @export
 * @interface IZosmfTsoResponse
 */
export interface IZosmfTsoResponse {

    /**
     * unique identifier for the servlet entry
     * @type string
     * @memberOf IZosmfTsoResponse
     */
    servletKey: string;

    /**
     * message queue ID
     * @type string
     * @memberOf IZosmfTsoResponse
     */
    queueID?: string;

    /**
     * structure version
     * @type string
     * @memberOf IZosmfTsoResponse
     */
    ver: string;

    /**
     * reconnected indicator
     * @type boolean
     * @memberOf IZosmfTsoResponse
     */
    reused: boolean;

    /**
     * timeout indicator
     * @type boolean
     * @memberOf IZosmfTsoResponse
     */
    timeout: boolean;

    /**
     * z/OSMF messages
     * @type IZosfmMessages[]
     * @memberOf IZosmfTsoResponse
     */
    msgData?: IZosfmMessages[];

    /**
     * id of the session
     * @type string
     * @memberOf IZosmfTsoResponse
     */
    sessionID?: string;

    /**
     * TSO/E messages that were received during the request
     * @type ITsoMessages[]
     * @memberOf IZosmfTsoResponse
     */
    tsoData?: ITsoMessages[];

    /**
     * application messages
     * @type string
     * @memberOf IZosmfTsoRespons
     */
    appData?: string;
}

