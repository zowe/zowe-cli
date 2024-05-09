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

import { IProfileProperty } from "../../../../../profiles";
import { ICommandOptionDefinition } from "../../option/ICommandOptionDefinition";
/**
 * Extended version of a team profile schema property that can include option definitions
 * for auto-generated commands.
 * @export
 * @interface ICommandProfileProperty
 * @extends {IProfileProperty}
 */
export interface ICommandProfileProperty extends IProfileProperty {
    /**
     * This option definition will be used to auto-generate profile commands.
     * This is the same type used by normal Imperative command definitions.
     */
    optionDefinition?: ICommandOptionDefinition;
    optionDefinitions?: ICommandOptionDefinition[];
}
