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
    Logger
} from "@zowe/imperative";
import { ISshSession } from "./doc/ISshSession";


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

    public static SSH_CONNECTION_OPTION_GROUP = "z/OS Ssh Connection Options";

    /**
     * Option used in profile creation and commands for hostname for z/OS SSH
     */
    public static SSH_OPTION_HOST: ICommandOptionDefinition = {
        name: "host",
        aliases: ["H"],
        description: "The z/OS SSH server host name.",
        type: "string",
        required: false,
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * @deprecated Use SSH_OPTION_HOST
     */
    public static SSH_OPTION_HOST_PROFILE: ICommandOptionDefinition = SshSession.SSH_OPTION_HOST;

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
        required: false,
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * @deprecated Use SSH_OPTION_USER
     */
    public static SSH_OPTION_USER_PROFILE: ICommandOptionDefinition = SshSession.SSH_OPTION_USER;

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
        description: "Path to a file containing your private key, that must match a public key stored in the server for authentication",
        type: "string",
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for passphrase for private key
     */
    public static SSH_OPTION_KEYPASSPHRASE: ICommandOptionDefinition = {
        name: "keyPassphrase",
        aliases: ["passphrase", "kp"],
        description: "Private key passphrase, which unlocks the private key.",
        type: "string",
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands for passphrase for private key
     */
    public static SSH_OPTION_HANDSHAKETIMEOUT: ICommandOptionDefinition = {
        name: "handshakeTimeout",
        aliases: ["timeout", "to"],
        description: "How long in milliseconds to wait for the SSH handshake to complete.",
        type: "number",
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
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
        SshSession.SSH_OPTION_KEYPASSPHRASE,
        SshSession.SSH_OPTION_HANDSHAKETIMEOUT
    ];

    /**
     * Given command line arguments, create an SSH session configuration object.
     * @param {ICommandArguments} args - The arguments specified by the user
     * @returns {ISshSession} - A session configuration to be used for an SSH session.
     */
    public static createSshSessCfgFromArgs(args: ICommandArguments): ISshSession {
        return {
            privateKey: args.privateKey,
            keyPassphrase: args.keyPassphrase,
            handshakeTimeout: args.handshakeTimeout
        };
    }

    /**
     * Creates an instance of AbstractSession.
     * @param {ISshSession} session: SshSession parameter object
     */
    constructor(private mISshSession: ISshSession) {
        mISshSession = this.buildSession(mISshSession);
    }

    private static get log(): Logger {
        return Logger.getAppLogger();
    }

    /**
     * Builds an ISshSession so all required pieces are filled in
     * @private
     * @param {ISession} session - the fully populated session
     * @memberof AbstractSession
     */
    private buildSession(session: ISshSession): ISshSession {
        const populatedSession = session;

        // set port if not set
        if (populatedSession.port === undefined || populatedSession.port === null) {
            populatedSession.port = SshSession.DEFAULT_SSH_PORT;
        }
        return populatedSession;
    }
}
