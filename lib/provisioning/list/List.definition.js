"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCommand = void 0;
const TemplateInfo_definition_1 = require("./templateInfo/TemplateInfo.definition");
const CatalogTemplates_definition_1 = require("./catalogTemplates/CatalogTemplates.definition");
const InstanceInfo_definition_1 = require("./instanceInfo/InstanceInfo.definition");
const InstanceVariables_definition_1 = require("./instanceVariables/InstanceVariables.definition");
const RegistryInstances_definition_1 = require("./registry/RegistryInstances.definition");
exports.ListCommand = {
    name: "list",
    aliases: ["ls"],
    type: "group",
    summary: "List Provisioning Information",
    description: "Lists z/OSMF provisioning information such as the provisioned " +
        "instances from the registry, the provisioned instance details, the available provisioning templates and provisioning template details.",
    children: [TemplateInfo_definition_1.templateInfo, CatalogTemplates_definition_1.catalogTemplates, InstanceInfo_definition_1.instanceInfo, InstanceVariables_definition_1.instanceVariables, RegistryInstances_definition_1.registryInstances]
};
//# sourceMappingURL=List.definition.js.map