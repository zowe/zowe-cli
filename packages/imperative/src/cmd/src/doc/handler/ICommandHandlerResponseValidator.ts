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

import { ICommandResponse } from "../../../src/doc/response/response/ICommandResponse";
import { CommandResponse } from "../../response/CommandResponse";

export interface ICommandHandlerResponseValidator {
    validate(response: CommandResponse): Promise<ICommandResponse>;
}
