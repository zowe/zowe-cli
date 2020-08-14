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

import { ICommandDefinition } from "@zowe/imperative";
import { TemplateDefinition } from "./template/Template.definition";


export const ProvisionCommand: ICommandDefinition = {
    name: "provision",
    aliases: ["prov"],
    type: "group",
    summary: "Provision published software service templates.",
    description: "Using z/OSMF cloud provisioning services provision available templates.",
    children: [TemplateDefinition]
};
