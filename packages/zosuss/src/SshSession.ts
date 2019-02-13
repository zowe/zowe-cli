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

import { ICommandArguments, ICommandOptionDefinition, IProfile, Logger, Session } from "@brightside/imperative";

/**
 * Utility Methods for Brightside
 * @export
 */
export class SshSession {

    public static SSH_CONNECTION_OPTION_GROUP = "Zos Ssh Connection Options";

    /**
     * Option used in profile creation and commands for hostname for z/OS SSH
     */
    public static SSH_OPTION_HOST: ICommandOptionDefinition = {
        name: "host",
        aliases: ["H"],
        description: "The z/OS SSH server host name.",
        type: "string",
        required: true,
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for port for z/OS SSH
     */
    public static SSH_OPTION_PORT: ICommandOptionDefinition = {
        name: "port",
        aliases: ["P"],
        description: "The z/OS SSH server port.",
        type: "number",
        defaultValue: 22,
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for username / ID  for z/OS SSH
     */
    public static SSH_OPTION_USER: ICommandOptionDefinition = {
        name: "user",
        aliases: ["u"],
        description: "Mainframe user name, which can be the same as your TSO login.",
        type: "string",
        required: true,
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for password/passphrase for z/OS SSH
     */
    public static SSH_OPTION_PASSWORD: ICommandOptionDefinition = {
        name: "password",
        aliases: ["pass", "pw"],
        description: "Mainframe password, which can be the same as your TSO password.",
        type: "string",
        group: SshSession.SSH_CONNECTION_OPTION_GROUP,
        required: true
    };

    /**
     * Options related to connecting to z/OS SSH
     * These options can be filled in if the user creates a profile
     */
    public static SSH_CONNECTION_OPTIONS: ICommandOptionDefinition[] = [
        SshSession.SSH_OPTION_HOST,
        SshSession.SSH_OPTION_PORT,
        SshSession.SSH_OPTION_USER,
        SshSession.SSH_OPTION_PASSWORD
    ];


    /**
     * Given a z/OS SSH profile, create a REST Client Session.
     * @static
     * @param {IProfile} profile - The z/OSMF profile contents
     * @returns {Session} - A session for usage in the z/OSMF REST Client
     */
    public static createBasicSshSession(profile: IProfile): Session {
        this.log.debug("Creating a z/OS SSH session from the profile named %s", profile.name);
        return new Session({
            type: "basic",
            hostname: profile.host,
            port: profile.port,
            user: profile.user,
            password: profile.password
        });
    }

    /**
     * Given command line arguments, create a REST Client Session.
     * @static
     * @param {IProfile} args - The arguments specified by the user
     * @returns {Session} - A session for usage in the z/OSMF REST Client
     */
    public static createBasicSshSessionFromArguments(args: ICommandArguments): Session {
        this.log.debug("Creating a z/OS SSH session from arguments");
        return new Session({
            type: "basic",
            hostname: args.host,
            port: args.port,
            user: args.user,
            password: args.password
        });
    }


    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
