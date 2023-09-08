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

import { ICommandDefinition } from "../../../../../../../lib";

export const WithWrappedTextDefinition: ICommandDefinition = {
    name: "with-wrapped-text",
    description: "Responds with wrapped text and non wrapped text",
    summary: "Responds with wrapped text and non wrapped text",
    handler: __dirname + "/WithWrappedText.handler",
    type: "command"
};
