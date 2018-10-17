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
import { ZosmfSession } from "../../../ZosmfSession";

export const StatusDefinition: ICommandDefinition = {
    name: "status",
    description: "Confirm that z/OSMF is running on a system specified in your profile and gather " +
        "information about the z/OSMF server for diagnostic purposes. The command outputs properties " +
        "of the z/OSMF server such as version, hostname, and installed plug-ins.",
    type: "command",
    handler: __dirname + "/Status.handler",
    profile: {
        required: ["zosmf"],
    },
    options: ZosmfSession.ZOSMF_CONNECTION_OPTIONS,
    examples: [
        {
            description: "Report the status of the z/OSMF server that you specified " +
                "in your default z/OSMF profile",
            options: ""
        },
        {
            description: "Report the status of the z/OSMF server that you specified " +
                "in a supplied z/OSMF profile",
            options: "--zosmf-profile SomeZosmfProfileName"
        },
        {
            description: "Report the status of the z/OSMF server that you specified manually via command line",
            options: "--host myhost --port 443 --user myuser --pass mypass"
        },
    ]
};
