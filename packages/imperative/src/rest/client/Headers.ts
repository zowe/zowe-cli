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

import { IHeaderContent } from "./doc/IHeaderContent";

export class Headers {
    public static readonly CONTENT_TYPE: string = "Content-Type";
    public static readonly CONTENT_LENGTH: string = "Content-Length";
    public static readonly CONTENT_ENCODING: string = "Content-Encoding";
    public static readonly CONTENT_ENCODING_TYPES = ["br", "deflate", "gzip"] as const;
    public static readonly APPLICATION_JSON: IHeaderContent = {"Content-Type": "application/json"};
    public static readonly TEXT_PLAIN: IHeaderContent = {"Content-Type": "text/plain"};
    public static readonly TEXT_PLAIN_UTF8: object = {"Content-Type": "text/plain; charset=utf8"};
    public static readonly OCTET_STREAM: IHeaderContent = {"Content-Type": "application/octet-stream"};
    public static readonly BASIC_AUTHORIZATION: object = {Authorization: ""};
    public static readonly COOKIE_AUTHORIZATION: object = {Cookie: ""};
}

export type ContentEncoding = typeof Headers.CONTENT_ENCODING_TYPES[number];
