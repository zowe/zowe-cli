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
import { ListCommand } from "./list/List.definition";
import { ProvisionCommand } from "./provision/Provision.definition";
import { PerformCommand } from "./perform/Perform.definition";
import { DeleteCommand } from "./delete/Delete.definition";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";

const definition: ICommandDefinition = {
    name: "provisioning",
    aliases: ["pv"],
    type: "group",
    summary: "Perform z/OSMF provisioning tasks",
    description: "Perform z/OSMF provisioning tasks on Published Templates in the Service Catalog " +
    "and Provisioned Instances in the Service Registry.",
    children: [
        ListCommand, ProvisionCommand, PerformCommand, DeleteCommand
    ],
    passOn: [
        {
            property: "options",
            value: ZosmfSession.ZOSMF_CONNECTION_OPTIONS,
            merge: true,
            ignoreNodes: [
                {type: "group"}
            ]
        }
    ]
};
export = definition;
