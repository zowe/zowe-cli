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

export const MaskingDefinition: ICommandDefinition = {
    name: "masking",
    description: "Test that masking is working correctly.",
    summary: "Test imperative masking",
    type: "command",
    handler: __dirname + "/Masking.handler",
    profile: {
        optional: ["secured"]
    },
    positionals: [{
        name: "info",
        description: "test argument",
        type: "string",
        required: true,
    }]
};
