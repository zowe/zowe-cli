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

import { ICommandResponseApi } from "../../doc/response/api/processor/ICommandResponseApi";
import { ICommandResponse } from "../../doc/response/response/ICommandResponse";
import { IImperativeError } from "../../../error";

export class CommandResponse implements ICommandResponseApi {
    public responseFormat: "json" | "default";
    public silent: boolean;
    public failed(): void {
        throw new Error("Method not implemented.");
    }
    public succeeded(): void {
        throw new Error("Method not implemented.");
    }
    public setError(details: IImperativeError): void {
        throw new Error("Method not implemented.");
    }
    public buildJsonResponse(): ICommandResponse {
        throw new Error("Method not implemented.");
    }
    public writeJsonResponse(): ICommandResponse {
        throw new Error("Method not implemented.");
    }
    public endProgressBar(): void {
        throw new Error("Method not implemented.");
    }
}
