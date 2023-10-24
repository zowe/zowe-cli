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
exports.ProvisionCommand = void 0;
const Template_definition_1 = require("./template/Template.definition");
exports.ProvisionCommand = {
    name: "provision",
    aliases: ["prov"],
    type: "group",
    summary: "Provision published software service templates.",
    description: "Using z/OSMF cloud provisioning services provision available templates.",
    children: [Template_definition_1.TemplateDefinition]
};
//# sourceMappingURL=Provision.definition.js.map