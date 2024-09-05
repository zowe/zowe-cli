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

export interface IIssueTsoCmdResponse {

    /**
     * Command response
     * @type {{message: string}[]}
     * @memberof IIssueTsoCmdResponse
     */
    cmdResponse: {message: string}[];

    /**
     * Whether the TSO PROMPT sign is received in the command response.
     * "Y": TSO Prompt is Recieved. "N": TSO Prompt is not recieved yet.
     * @type {"Y" | "N"}
     * @memberof IIssueTsoCmdResponse
     */
    tsoPromptReceived: "Y" | "N",

    /**
     * Unique identifier for the servlet entry.
     * It maps to the TSO/E address space in which the TSO/E command is issued. servletKey is returned only when cmdState is stateful for z/OS 2.4 and above
     * @type {string}
     * @memberof IIssueTsoCmdResponse
     */
    servletKey?: string;

    /**
     * The result of the response detection request. This is returned when the keyword is specified.
     * "Y": Matching record in the response was found. "N": Matching record in the response was not found.
     * @type {"Y" | "N"}
     * @memberof IIssueTsoCmdResponse
     */
    keywordDetected?: "Y" | "N",
}
