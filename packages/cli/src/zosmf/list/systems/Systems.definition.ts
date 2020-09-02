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
import { ZosmfSession } from "../../../../src/provisioning/delete/instance/node_modules/@zowe/zosmf-for-zowe-sdk";

export const SystemsDefinition: ICommandDefinition = {
    name: "systems",
    description: "Obtain a list of systems that are defined to a z/OSMF instance.",
    type: "command",
    handler: __dirname + "/Systems.handler",
    profile: {
        optional: ["zosmf"]
    },
    options: ZosmfSession.ZOSMF_CONNECTION_OPTIONS,
    examples: [
        {
            description: "Obtain a list of systems defined to a z/OSMF instance " +
                "with your default z/OSMF profile",
            options: ""
        },
        {
            description: "Obtain a list of systems defined to a z/OSMF instance " +
                "for the specified z/OSMF profile",
            options: "--zosmf-profile SomeZosmfProfileName"
        },
        {
            description: "Obtain a list of the systems defined to a z/OSMF instance that you specified in the  command line",
            options: "--host myhost --port 443 --user myuser --password mypass"
        }
    ]
};
