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
 * The reason that AbstractSession.getApimlDecision chose its usingApiml value.
 */
export enum ApimlDecisionReason {
    /**
     * The allowedLoginMethod property was set to an apiml-* value.
     */
    ALLOWED_LOGIN_METHOD_APIML = "ALLOWED_LOGIN_METHOD_APIML",

    /**
     * The allowedLoginMethod property was set to a direct-* value.
     */
    ALLOWED_LOGIN_METHOD_DIRECT = "ALLOWED_LOGIN_METHOD_DIRECT",

    /**
     * The session's tokenType is the API Mediation Layer authentication token type.
     */
    APIML_AUTH_TOKEN_PRESENT = "APIML_AUTH_TOKEN_PRESENT",

    /**
     * The session has a basePath property.
     */
    BASE_PATH_EXISTS = "BASE_PATH_EXISTS",

    /**
     * None of the other conditions were detected.
     */
    NONE = "NONE"
}

/**
 * The result of AbstractSession.getApimlDecision, which describes whether a session
 * is expected to connect through the API Mediation Layer (APIML), and why.
 */
export interface IApimlDecision {
    /**
     * True when the session is expected to connect through APIML. False otherwise.
     */
    usingApiml: boolean;

    /**
     * The reason that usingApiml was set to its current value.
     */
    reason: ApimlDecisionReason;

    /**
     * A description of the heuristic that produced this decision.
     */
    message: string;
}
