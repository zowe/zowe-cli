
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
 * String type definition for properties of abstractRestClient that has a getter set.
 * This can be safely used in a getter call as a variable for the abstractRestClient object.
 * @export
 * @typedef CLIENT_PROPERTY
 */
export type CLIENT_PROPERTY = "requestSuccess" | "requestFailure" | "data" | "dataString" | "response" | "session" | "log";
export const CLIENT_PROPERTY = {
    requestSuccess: "requestSuccess" as CLIENT_PROPERTY,
    requestFailure: "requestFailure" as CLIENT_PROPERTY,
    data: "data" as CLIENT_PROPERTY,
    dataString: "dataString" as CLIENT_PROPERTY,
    response: "response" as CLIENT_PROPERTY,
    session: "session" as CLIENT_PROPERTY,
    log: "log" as CLIENT_PROPERTY,
};
