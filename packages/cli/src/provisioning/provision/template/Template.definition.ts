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

import { ICommandDefinition } from "@zowe/core-for-zowe-sdk";
import { Constants } from "../../../Constants";

export const TemplateDefinition: ICommandDefinition = {
    name: "template",
    aliases: ["tem"],
    type: "command",
    summary: "Provision a published software service template.",
    description: "Using z/OSMF cloud provisioning services, provision available templates.\n" +
        "You can view available templates using the " + Constants.BINARY_NAME + " provisioning list " +
        "catalog-templates command.",
    handler: __dirname + "/Template.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "name",
            type: "string",
            description: "The name of a z/OSMF cloud provisioning template.",
            required: true
        }
    ],
    options: [

        {
            name: "properties",
            aliases: ["p"],
            description: "A sequence of string enclosed \"name=value\"" +
                " pairs of prompt variables.\n" +
                "e.g: \"CSQ_MQ_SSID=ZCT1,CSQ_CMD_PFX=!ZCT1\".",
            type: "string"
        },
        {
            name: "properties-file",
            aliases: ["pf"],
            description: "Path to .yml file containing properties.",
            type: "string"
        },
        {
            name: "domain-name",
            aliases: ["dn"],
            description: "Required if the user has consumer authorization " +
                "to more than one domain with this template name.",
            type: "string"
        },
        {
            name: "tenant-name",
            aliases: ["tn"],
            description: "Required if the user has consumer authorization to" +
                " more than one tenant in the same domain " +
                "that contains this template name.",
            type: "string"
        },
        {
            name: "user-data-id",
            aliases: ["udi"],
            description: "ID for the user data specified with user-data." +
                " Passed into the software services registry.",
            type: "string"

        },
        {
            name: "user-data",
            aliases: ["ud"],
            description: "User data that is passed into the software services registry. " +
                "Can be specified only if user-data-id is provided.",
            type: "string"
        },
        {
            name: "account-info",
            aliases: ["ai"],
            description: "Account information to use in the JCL JOB statement. " +
                "The default is the account information that " +
                "is associated with the resource pool for the tenant.",
            type: "string"
        },
        {
            name: "system-nick-names",
            aliases: ["snn"],
            description: "Each string is the nickname of the system " +
                "upon which to provision the software service defined by the " +
                "template. The field is required if the resource pool " +
                "associated with the tenant used for this operation " +
                "is not set up to automatically select a system. Only one nickname is allowed." +
                "If the field is provided it is validated.\n" +
                "e.g: \"SYSNAME1,SYSNAME2\".",

            type: "string"
        }
    ],
    examples: [
        {
            description: "Provision a published software service template.",
            options: "template1"
        }
    ]
};
