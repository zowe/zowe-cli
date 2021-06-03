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

import {
    ICommandArguments,
    ICommandOptionDefinition,
    IProfile,
    Logger,
    SessConstants,
    Session,
    ISession
} from "@zowe/imperative";

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
        required: false,
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
    };

    public static ZOSMF_OPTION_HOST_PROFILE: ICommandOptionDefinition = {
        ...ZosmfSession.ZOSMF_OPTION_HOST,
        required: false
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
     * Option used in profile creation and commands for username / ID  for z/OSMF
     */
    public static ZOSMF_OPTION_USER: ICommandOptionDefinition = {
        name: "user",
        aliases: ["u"],
        description: "Mainframe (z/OSMF) user name, which can be the same as your TSO login.",
        type: "string",
        required: false,
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
    };

    public static ZOSMF_OPTION_USER_PROFILE: ICommandOptionDefinition = {
        ...ZosmfSession.ZOSMF_OPTION_USER,
        required: false
    };

    /**
     * Option used in profile creation and commands for password/passphrase for z/OSMF
     */
    public static ZOSMF_OPTION_PASSWORD: ICommandOptionDefinition = {
        name: "password",
        aliases: ["pass", "pw"],
        description: "Mainframe (z/OSMF) password, which can be the same as your TSO password.",
        type: "string",
        required: false,
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
    };

    public static ZOSMF_OPTION_PASSWORD_PROFILE: ICommandOptionDefinition = {
        ...ZosmfSession.ZOSMF_OPTION_PASSWORD,
        required: false
    };

    /**
     * Option used in profile creation and commands for rejectUnauthorized setting for connecting to z/OSMF
     */
    public static ZOSMF_OPTION_REJECT_UNAUTHORIZED: ICommandOptionDefinition = {
        name: "reject-unauthorized",
        aliases: ["ru"],
        description: "Reject self-signed certificates.",
        type: "boolean",
        defaultValue: true,
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for base path setting for connecting to z/OSMF
     */
    public static ZOSMF_OPTION_BASE_PATH: ICommandOptionDefinition = {
        name: "base-path",
        aliases: ["bp"],
        description: "The base path for your API mediation layer instance." +
            " Specify this option to prepend the base path to all z/OSMF resources when making REST requests." +
            " Do not specify this option if you are not using an API mediation layer.",
        type: "string",
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used to specify HTTP or HTTPS Protocol
     */
    public static ZOSMF_OPTION_PROTOCOL: ICommandOptionDefinition = {
        name: "protocol",
        description: "The protocol used (HTTP or HTTPS)",
        type: "string",
        defaultValue: "https",
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP,
        allowableValues: {values: ["http", "https"], caseSensitive: false}
    };

    /**
     * Options related to connecting to z/OSMF
     * These options can be filled in if the user creates a profile
     */
    public static ZOSMF_CONNECTION_OPTIONS: ICommandOptionDefinition[] = [
        ZosmfSession.ZOSMF_OPTION_HOST,
        ZosmfSession.ZOSMF_OPTION_PORT,
        ZosmfSession.ZOSMF_OPTION_USER,
        ZosmfSession.ZOSMF_OPTION_PASSWORD,
        ZosmfSession.ZOSMF_OPTION_REJECT_UNAUTHORIZED,
        ZosmfSession.ZOSMF_OPTION_BASE_PATH,
        ZosmfSession.ZOSMF_OPTION_PROTOCOL
    ];

    /**
     * Given command line arguments, create an session configuration object.
     * @param {IProfile} args - The arguments specified by the user
     * @returns {ISession} - A session configuration to be used for a session.
     */
    public static createSessCfgFromArgs(args: ICommandArguments): ISession {
        return {
            rejectUnauthorized: args.rejectUnauthorized,
            basePath: args.basePath,
            protocol: args.protocol ? args.protocol.toLowerCase() : 'https'
        };
    }

    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
