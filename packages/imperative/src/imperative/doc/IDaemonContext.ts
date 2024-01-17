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

import * as net from "net";
import * as stream from "stream";
import { IDaemonResponse } from "../../utilities";

/**
 * Allow for passing our own "context" / user data to the Imperative parser
 * @export
 * @interface IDaemonContext
 */
export interface IDaemonContext {

    /**
     * Stream to write response to
     * @type {net.Socket}
     * @memberof IDaemonContext
     */
    stream?: net.Socket;

    /**
     * Stream to read input from
     * @type {stream.Readable}
     * @memberof IDaemonContext
     */
    stdinStream?: stream.Readable;

    /**
     * Daemon response object from socket client
     * @type {IDaemonResponse}
     * @memberof IDaemonContext
     */
    response?: IDaemonResponse;
}
