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

import { ICommandArguments, ICommandOptionDefinition, IProfile, Logger } from "@brightside/imperative";
import { ISshSession } from "./api/doc/ISshSession";
import { isNullOrUndefined } from "util";


/**
 * Utility Methods for Brightside
 * @export
 */
export class SshSession {

    /**
     * Default ssh port 22
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_SSH_PORT = 22;

    /**
     * Obtain session info and defaults
     * @readonly
     * @type {ISession}
     * @memberof AbstractSession
     */
    get ISshSession(): ISshSession {
        return this.mISshSession;
    }

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
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for private key path
     */
    public static SSH_OPTION_PRIVATEKEY: ICommandOptionDefinition = {
        name: "privateKey",
        aliases: ["key", "pk"],
        description: "Path to a private key that matches with a public key stored in the server for authentication",
        type: "string",
        group: SshSession.SSH_CONNECTION_OPTION_GROUP,
    };

    /**
     * Option used in profile creation and commands for password for private key
     */
    public static SSH_OPTION_KEYPASSWORD: ICommandOptionDefinition = {
        name: "keyPassword",
        aliases: ["keypass", "kpass"],
        description: "Private key password, which unlocks the private key.",
        type: "string",
        group: SshSession.SSH_CONNECTION_OPTION_GROUP,
    };

    /**
     * Options related to connecting to z/OS SSH
     * These options can be filled in if the user creates a profile
     */
    public static SSH_CONNECTION_OPTIONS: ICommandOptionDefinition[] = [
        SshSession.SSH_OPTION_HOST,
        SshSession.SSH_OPTION_PORT,
        SshSession.SSH_OPTION_USER,
        SshSession.SSH_OPTION_PASSWORD,
        SshSession.SSH_OPTION_PRIVATEKEY,
        SshSession.SSH_OPTION_KEYPASSWORD
    ];

    /**
     * Given a z/OS SSH profile, create a SSH Client Session.
     * @static
     * @param {IProfile} profile - The SSH profile contents
     * @returns {Session} - A session for usage in the SSH Client
     */
    public static createBasicSshSession(profile: IProfile): SshSession {
        this.log.debug("Creating a z/OS SSH session from the profile named %s", profile.name);
        return new SshSession({
            hostname: profile.host,
            port: profile.port,
            user: profile.user,
            password: profile.password,
            privateKey: profile.privateKey,
            keyPassword: profile.keyPassword
        });
    }

    /**
     * Given command line arguments, create a SSH Client Session.
     * @static
     * @param {IProfile} args - The arguments specified by the user
     * @returns {Session} - A session for usage in the SSH Client
     */
    public static createBasicSshSessionFromArguments(args: ICommandArguments): SshSession {
        this.log.debug("Creating a z/OS SSH session from arguments");
        return new SshSession({
            hostname: args.host,
            port: args.port,
            user: args.user,
            password: args.password,
            privateKey: args.privateKey,
            keyPassword: args.keyPassword
        });
    }

    /**
     * Creates an instance of AbstractSession.
     * @param {ISession} session: Session parameter object
     * @memberof AbstractSession
     */
    constructor(private mISshSession: ISshSession) {
        mISshSession = this.buildSession(mISshSession);
    }

    private static get log(): Logger {
        return Logger.getAppLogger();
    }

    /**
     * Builds an ISession so all required pieces are filled in
     * @private
     * @param {ISession} session - the fully populated session
     * @memberof AbstractSession
     */
    private buildSession(session: ISshSession): ISshSession {
        const populatedSession = session;

        // set port if not set
        if (isNullOrUndefined(populatedSession.port)) {
            populatedSession.port = SshSession.DEFAULT_SSH_PORT;
        }
        return populatedSession;
    }
}
