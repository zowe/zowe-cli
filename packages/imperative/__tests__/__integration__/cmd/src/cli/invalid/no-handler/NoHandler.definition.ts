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

import { ICommandDefinition } from "../../../../../../../lib/index";

export const NoHandlerDefinition: ICommandDefinition = {
    name: "no-handler",
    description: "This will never get invoked. No handler specified on this definition.",
    summary: "Fails because no handler specified",
    type: "command"
};
