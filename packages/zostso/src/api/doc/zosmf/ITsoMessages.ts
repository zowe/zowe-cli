/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ITsoMessage, ITsoPromptMessage, ITsoResponseMessage } from "../../../../index";

/**
 * Interface for TSO/E messages
 * @export
 * @interface ITsoMessages
 */
export interface ITsoMessages {
    /**
     * tso message type of TSO/E messages
     * @type ITsoMessage
     * @memberOf ITsoMessages
     */
    "TSO MESSAGE"?: ITsoMessage;

    /**
     * tso prompt message type of TSO/E messages
     * @type ITsoPromptMessage
     * @memberOf ITsoMessages
     */
    "TSO PROMPT"?: ITsoPromptMessage;

    /**
     * tso response message type of TSO/E messages
     * @type ITsoResponseMessage
     * @memberOf ITsoMessages
     */
    "TSO RESPONSE"?: ITsoResponseMessage;
}
