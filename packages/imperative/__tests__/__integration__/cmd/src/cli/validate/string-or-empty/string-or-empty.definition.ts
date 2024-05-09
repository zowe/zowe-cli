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

// Range for option length-range
const LENGTH_RANGE_START: number = 2;
const LENGTH_RANGE_END: number = 8;

// Range for option eggs
const EGGS_RANGE_START: number = 1;
const EGGS_RANGE_END: number = 12;

export const stringOrEmptyTestCommand: ICommandDefinition = {
    name: "string-or-empty",
    description: "Test string or empty option.",
    type: "command",
    handler: __dirname + "/string-or-empty.handler",
    options:
        [
            {
                name: "string-or-empty",
                description: "value should be string or empty",
                type: "stringOrEmpty"
            }
        ]
};
