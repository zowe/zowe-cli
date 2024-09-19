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

import { join } from "path";
import { ICommandDefinition } from "../../../../../cmd";

/**
 * Definition for the 'config report-env' command.
 * @type {ICommandDefinition}
 */
export const ReportEnvDefinition: ICommandDefinition = {
    name: "report-env",
    aliases: ["re"],
    type: "command",
    handler: join(__dirname, "Report-env.handler"),
    summary: "Report the state of your working environment",
    description: "Reports key items from your environment and identifies problem conditions.",
    examples: [
        {
            description: "Report information and issues about your working environment",
            options: ""
        },
        {
            description: "Save the report about your working environment to a file",
            options: "> report.log"
        }
    ]
};
