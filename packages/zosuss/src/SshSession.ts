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
 * Utility Methods for Zowe
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
     * Option used in profile creation to set handshake timeout. If unset, defaults to no timeout.
     */
    public static SSH_OPTION_HANDSHAKETIMEOUT: ICommandOptionDefinition = {
        name: "handshakeTimeout",
        aliases: ["timeout", "to"],
        description: "How long in milliseconds to wait for the SSH handshake to complete.",
        type: "number",
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands to pin the trusted host key of the z/OS SSH server.
     */
    public static SSH_OPTION_HOSTKEY: ICommandOptionDefinition = {
        name: "host-key",
        aliases: ["hk"],
        description: "The trusted host key of the z/OS SSH server, as the base64-encoded key blob presented " +
            "by the server. When set, the server's key is verified against it before any credentials are sent.",
        type: "string",
        group: SshSession.SSH_CONNECTION_OPTION_GROUP
    };

    /**
     * Option used in profile creation and commands to skip host key verification.
     */
    public static SSH_OPTION_INSECURE: ICommandOptionDefinition = {
        name: "insecure",
        description: "Skip verification of the z/OS SSH server's host key, so the server's identity is " +
            "not confirmed before credentials are sent.",
        type: "boolean",
        defaultValue: false,
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
        SshSession.SSH_OPTION_HANDSHAKETIMEOUT,
        SshSession.SSH_OPTION_HOSTKEY,
        SshSession.SSH_OPTION_INSECURE
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
            handshakeTimeout: args.handshakeTimeout,
            hostKey: args.hostKey,
            insecure: args.insecure
        };
    }

    /**
     * Optional runtime hook, invoked during connection when the server presents a host key that is not
     * already trusted (no {@link ISshSession.hostKey} pinned, or the presented key differs from it). It
     * is set by the command handler layer to prompt the user interactively (trust on first use) and is
     * intentionally not part of the serializable {@link ISshSession} configuration. When unset (e.g. pure
     * SDK usage with no interactive layer), an untrusted key is rejected.
     * @param info - the presented key (base64 blob), its human-readable fingerprint, and whether it
     *               differs from a previously pinned key.
     * @returns a promise resolving to true to trust the key and continue, or false to reject the connection.
     */
    public hostKeyVerifier?: (info: { fingerprint: string; key: string; changed: boolean }) => Promise<boolean>;

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
