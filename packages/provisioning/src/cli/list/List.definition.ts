/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandDefinition } from "@brightside/imperative";
import { templateInfo } from "./templateInfo/TemplateInfo.definition";
import { catalogTemplates } from "./catalogTemplates/CatalogTemplates.definition";
import { instanceInfo } from "./instanceInfo/InstanceInfo.definition";
import { instanceVariables } from "./instanceVariables/InstanceVariables.definition";
import { registryInstances } from "./registry/RegistryInstances.definition";

export const ListCommand: ICommandDefinition = {
    name: "list",
    aliases: ["ls"],
    type: "group",
    summary: "List Provisioning Information",
    description: "Lists z/OSMF provisioning information such as the provisioned " +
    "instances from the registry, the provisioned instance details, the available provisioning templates and provisioning template details.",
    children: [templateInfo, catalogTemplates, instanceInfo, instanceVariables, registryInstances],
};
