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

import { OutgoingHttpHeaders } from "http";

import { HTTP_VERB } from "../types/HTTPVerb";

export interface IHTTPSOptions {
    headers: OutgoingHttpHeaders;
    hostname: string;
    method: HTTP_VERB;
    path: string;
    port: string;
    rejectUnauthorized: boolean;
    cert?: string;
    key?: string;
    // pfx?: string;
    // passphrase?: string;
    hash?: string;
}
