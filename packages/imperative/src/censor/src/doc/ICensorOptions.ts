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

import { ICommandDefinition, ICommandArguments, ICommandProfileTypeConfiguration } from "../../../cmd";
import { Config } from "../../../config";
import { IProfileTypeConfiguration } from "../../../profiles";

export interface ICensorOptions {
    /**
     * An array of profile schema definitions
     */
    profiles?: IProfileTypeConfiguration[] | ICommandProfileTypeConfiguration[];

    /**
     * The team config API
     */
    config?: Config;

    /**
     * The command definition for the command being executed
     */
    commandDefinition?: ICommandDefinition;

    /**
     * The command arguments for the command being executed
     */
    commandArguments?: ICommandArguments;
}