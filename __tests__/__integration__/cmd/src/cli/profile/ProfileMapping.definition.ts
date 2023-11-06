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

import { ICommandDefinition } from "../../../../../../lib/index";
import { profileMappingCommand } from "./mapping/ProfileMapping.definition";
import { profileMappingPositionalCommand } from "./mapping-positional/ProfileMapping.definition";
import { profileMappingCommandNameType } from "./mapping-name-type/ProfileMappingNameType.definition";
import { profileMappingBaseCommand } from "./mapping-base/ProfileMappingBase.definition";

export const definition: ICommandDefinition = {
    name: "profile",
    description: "Invoke commands to validate that mapping profile fields to options is working correctly",
    summary: "Validate profile mapping",
    type: "group",
    children: [profileMappingCommand, profileMappingPositionalCommand, profileMappingCommandNameType, profileMappingBaseCommand],
};

module.exports = definition;
