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

import { Logger } from "../../../logger";

/**
 * Imperative standard event emitter options
 * @export
 * @interface IImperativeEventEmitterOpts
 */
export interface IImperativeEventEmitterOpts {
    /**
     * The logger to use when logging the imperative event that occurred
     * @type {Logger}
     * @memberof IImperativeEventEmitterOpts
     */
    logger?: Logger;
}
