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

import { ICommandArguments, ICommandOptionDefinition, IProfile, Logger, Session, ISession, ImperativeError } from "@zowe/imperative";

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
     * Option used in profile creation and commands for username / ID  for z/OSMF
     */
    public static ZOSMF_OPTION_USER: ICommandOptionDefinition = {
        name: "user",
        aliases: ["u"],
        description: "Mainframe (z/OSMF) user name, which can be the same as your TSO login.",
        type: "string",
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for password/passphrase for z/OSMF
     */
    public static ZOSMF_OPTION_PASSWORD: ICommandOptionDefinition = {
        name: "password",
        aliases: ["pass", "pw"],
        description: "Mainframe (z/OSMF) password, which can be the same as your TSO password.",
        type: "string",
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
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
     * Option used in profile creation and commands to indicate token-based connection to z/OSMF
     */
    public static ZOSMF_OPTION_TOKEN_TYPE: ICommandOptionDefinition = {
        name: "token-type",
        aliases: ["tt"],
        description: "The token type for z/OSMF returned in the HTTP Cookie header, for example: 'LtpaToken2'." +
            " The existence of a 'tokenType' indicates that basic authentication will not be used after a token has been obtained.",
        type: "stringOrEmpty",
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands to indicate the token value for connecting to z/OSMF
     */
    public static ZOSMF_OPTION_TOKEN_VALUE: ICommandOptionDefinition = {
        name: "token-value",
        aliases: ["tv"],
        description: "The token value associated with the token type.",
        type: "string",
        group: ZosmfSession.ZOSMF_CONNECTION_OPTION_GROUP
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
        ZosmfSession.ZOSMF_OPTION_TOKEN_TYPE,
        ZosmfSession.ZOSMF_OPTION_TOKEN_VALUE
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
            password: profile.password,
            rejectUnauthorized: profile.rejectUnauthorized,
            basePath: profile.basePath
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

        const sessionConfig: ISession = {
            hostname: args.host,
            port: args.port,
            rejectUnauthorized: args.rejectUnauthorized,
            basePath: args.basePath
        };

        this.log.debug("Using basic authentication");
        sessionConfig.type = "basic";
        sessionConfig.user = args.user;
        sessionConfig.password = args.password;

        if (args.tokenType && args.tokenValue && args.tokenValue !== "") {
            this.log.debug("Using token authentication");
            sessionConfig.type = "token";
            sessionConfig.tokenType = args.tokenType;
            sessionConfig.tokenValue = args.tokenValue;
        }

        return new Session(sessionConfig);
    }


    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
