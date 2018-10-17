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
import { ICommandArguments } from "@brightside/imperative/lib/cmd/src/doc/args/ICommandArguments";

/**
 * Utility Methods for Brightside
 * @export
 */
export class ZosmfSession {

    public static ZOSMF_CONNECTION_OPTION_GROUP = "Zosmf Connection Options";

    /**
     * Option used in profile creation and commands for hostname for z/OSMF
     */
    public static ZOSMF_OPTION_HOST: ICommandOptionDefinition = {
        name: "host",
        aliases: ["H"],
        description: "The z/OSMF server host name.",
        type: "string",
        required: true,
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for port for z/OSMF
     */
    public static ZOSMF_OPTION_PORT: ICommandOptionDefinition = {
        name: "port",
        aliases: ["P"],
        description: "The z/OSMF server port.",
        type: "number",
        defaultValue: 443,
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
    };
    /**
     * Options related to connecting to z/OSMF
     * These options can be filled in if the user creates a profile
     */
    public static ZOSMF_CONNECTION_OPTIONS: ICommandOptionDefinition[] = [
        ZosmfSession.ZOSMF_OPTION_HOST,
        ZosmfSession.ZOSMF_OPTION_PORT,
        {
            name: "user",
            aliases: ["u"],
            description: "Mainframe (z/OSMF) user name, which can be the same as your TSO login.",
            type: "string",
            implies: ["pass"],
            group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
        },
        {
            name: "pass",
            aliases: ["p"],
            description: "Mainframe (z/OSMF) password, which can be the same as your TSO password.",
            type: "string",
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

    /**
     * Given command line arguments, create a REST Client Session.
     * @static
     * @param {IProfile} args - The arguments specified by the user
     * @returns {Session} - A session for usage in the z/OSMF REST Client
     */
    public static createBasicZosmfSessionFromArguments(args: ICommandArguments): Session {
        this.log.debug("Creating a z/OSMF session from arguments");
        return new Session({
            type: "basic",
            hostname: args.host,
            port: args.port,
            user: args.user,
            password: args.pass,
            base64EncodedAuth: args.auth,
            rejectUnauthorized: args.rejectUnauthorized,
        });
    }


    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
