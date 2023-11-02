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

import { IHandlerResponseApi } from "../src/cmd/doc/response/api/handler/IHandlerResponseApi";
import { IHandlerResponseConsoleApi } from "../src/cmd/doc/response/api/handler/IHandlerResponseConsoleApi";
import { IHandlerResponseDataApi } from "../src/cmd/doc/response/api/handler/IHandlerResponseDataApi";
import { IHandlerProgressApi } from "../src/cmd/doc/response/api/handler/IHandlerProgressApi";
import { IHandlerFormatOutputApi } from "../src/cmd/doc/response/api/handler/IHandlerFormatOutputApi";

export class HandlerResponse implements IHandlerResponseApi {
    public console: IHandlerResponseConsoleApi = {
        log: jest.fn((message: string | Buffer, ...values: any[]) => {
            return message + "\n";
        }),
        error: jest.fn((message: string | Buffer, ...values: any[]) => {
            return message + "\n";
        }),
        errorHeader: jest.fn((message: string, delimeter?: string) => {
            return message + ":\n";
        }),
        prompt: jest.fn(),
    };
    public format: IHandlerFormatOutputApi;
    public data: IHandlerResponseDataApi = undefined;
    public progress: IHandlerProgressApi = undefined;
}
