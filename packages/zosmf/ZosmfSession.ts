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

import { ICommandOptionDefinition, IProfile, Logger, Session } from "@brightside/imperative";

/**
 * Utility Methods for Brightside
 * @export
 */
export class ZosmfSession {

    public static ZOSMF_CONNECTION_OPTION_GROUP = "Zosmf Connection Options";
    /**
     * Options related to connecting to z/OSMF
     * These options can be filled in if the user creates a profile
     */
    public static ZOSMF_CONNECTION_OPTIONS: ICommandOptionDefinition[] = [
        {
            name: "host",
            aliases: ["H"],
            description: "The z/OSMF server host name.",
            type: "string",
            required: true,
            group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
        },
        {
            name: "port",
            aliases: ["P"],
            description: "The z/OSMF server port.",
            type: "number",
            defaultValue: 443,
            group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
        },
        {
            name: "user",
            aliases: ["u"],
            description: "Mainframe (z/OSMF) user name, which can be the same as your TSO login.",
            type: "string",
            implies: ["password"],
            group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
        },
        {
            name: "pass",
            aliases: ["p"],
            description: "Mainframe (z/OSMF) password, which can be the same as your TSO password.",
            type: "string",
            implies: ["user"],
            group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
        },
        {
            name: "reject-unauthorized",
            aliases: ["ru"],
            description: "Reject self-signed certificates.",
            type: "boolean",
            defaultValue: true,
            group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
        },
    ];


    /**
     * Given a z/OSMF profile, create a REST Client Session.
     * @static
     * @param {IProfile} profile - The z/OSMF profile contents
     * @returns {Session} - A session for usage in the z/OSMF REST Client
     */
    public static createBasicZosmfSession(profile: IProfile): Session {
        this.log.debug("Creating a z/OSMF session from the profile named %s", profile.name);
        return new Session({
            type: "basic",
            hostname: profile.host,
            port: profile.port,
            user: profile.user,
            password: profile.pass,
            base64EncodedAuth: profile.auth,
            rejectUnauthorized: profile.rejectUnauthorized,
        });
    }


    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
