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

export type HTTP_VERB = "GET" | "PUT" | "POST" | "DELETE";
export const HTTP_VERB = {
    GET: "GET" as HTTP_VERB,
    PUT: "PUT" as HTTP_VERB,
    POST: "POST" as HTTP_VERB,
    DELETE: "DELETE" as HTTP_VERB,
};
