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
    // AbstractSession,
    ICommandArguments,
    ICommandHandler,
    IOverridePromptConnProps,
    IHandlerParameters,
    IHandlerResponseConsoleApi,
    IHandlerFormatOutputApi,
    IHandlerResponseDataApi,
    IHandlerProgressApi,
    IImperativeError,
    ImperativeError,
    ConfigUtils,
    ConnectionPropsForSessCfg,
    ImperativeConfig,
    SessConstants,
    IProfile
} from "@zowe/imperative";
import { SshSession } from "./SshSession";
import { ISshSession } from "./doc/ISshSession";
import { ZosUssMessages } from "./constants/ZosUss.messages";
import { utils } from "ssh2";
import * as fs from "fs";

/**
 * This class is used by the various handlers in the project as the base class for their implementation.
 */
export abstract class SshBaseHandler implements ICommandHandler {
    /**
     * The session creating from the command line arguments / profile
     */
    protected mSession: SshSession;

    /**
     * Loaded z/OS SSH profile if needed
     * @deprecated
     */
    protected mSshProfile: IProfile;

    /**
     * Command line arguments passed
     */
    protected mArguments: ICommandArguments;

    /**
     * Full set of command handler parameters from imperative
     */
    protected mHandlerParams: IHandlerParameters;

    /**
     * This will grab the arguments and create a session before calling the subclass
     * {@link SshBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(commandParameters: IHandlerParameters) {
        this.mHandlerParams = commandParameters;
        // Why is this here? NOTHING uses it, but I suppose an extender MIGHT be... -awharn
        // eslint-disable-next-line deprecation/deprecation
        this.mSshProfile = commandParameters.profiles.get("ssh", false);

        const sshSessCfgOverride: IOverridePromptConnProps[] = [
            {
                propertyName: "privateKey",
                propertiesOverridden: [
                    "password",
                    "tokenType",
                    "tokenValue",
                    "cert",
                    "certKey",
                ],
            },
        ];
        const sshSessCfg: ISshSession = SshSession.createSshSessCfgFromArgs(
            commandParameters.arguments
        );
        let sshSessCfgWithCreds =
            await ConnectionPropsForSessCfg.addPropsOrPrompt<ISshSession>(
                sshSessCfg,
                commandParameters.arguments,
                {
                    parms: commandParameters,
                    propertyOverrides: sshSessCfgOverride,
                    supportedAuthTypes: [SessConstants.AUTH_TYPE_BASIC],
                }
            );
        this.mSession = new SshSession(sshSessCfgWithCreds);
        this.attachHostKeyVerifier(this.mSession, commandParameters);

        this.mArguments = commandParameters.arguments;

        try {
            await this.processCmd(commandParameters);
        } catch (e) {
            if (
                e.message.includes("but no passphrase given") ||
                e.message.includes("bad passphrase?")
            ) {
                this.console.log("Initial key passphrase authentication failed!" + "\n");
                const maxAttempts = 3;
                let attempt = 0;
                let success = false;
                while (attempt < maxAttempts && !success) {
                    try {
                        sshSessCfgWithCreds =
                            await ConnectionPropsForSessCfg.addPropsOrPrompt<ISshSession>(
                                sshSessCfgWithCreds,
                                commandParameters.arguments,
                                {
                                    parms: commandParameters,
                                    propertyOverrides: sshSessCfgOverride,
                                    supportedAuthTypes: [
                                        SessConstants.AUTH_TYPE_BASIC,
                                    ],
                                    propsToPromptFor: [
                                        {
                                            name: "keyPassphrase",
                                            isGivenValueValid: (givenValue: string) => {
                                                let saveKP: boolean = true;
                                                const result = utils.parseKey(
                                                    fs.readFileSync(
                                                        sshSessCfgWithCreds.privateKey
                                                    ),
                                                    givenValue
                                                );
                                                if (result instanceof Error)
                                                    saveKP =
                                                        !result.message.includes(
                                                            "no passphrase given"
                                                        ) &&
                                                        !result.message.includes(
                                                            "bad passphrase"
                                                        );
                                                return saveKP;
                                            },
                                        },
                                    ],
                                }
                            );
                        this.mSession = new SshSession(sshSessCfgWithCreds);
                        this.attachHostKeyVerifier(this.mSession, commandParameters);
                        await this.processCmd(commandParameters);
                        success = true;
                    } catch (retryError) {
                        this.console.log(
                            "\n" +
                                `Key passphrase authentication failed! (${
                                    ++attempt
                                }/${maxAttempts})` +
                                "\n"
                        );
                        if (attempt >= maxAttempts) {
                            throw new Error(
                                "Maximum retry attempts reached. Authentication failed."
                            );
                        }
                    }
                }
            }
            else
            {
                throw e;
            }
        }
    }

    /**
     * Attaches an interactive host key verifier to the session so that, when the SSH server presents a
     * host key that is not already trusted, the user is asked to confirm it before any credentials are sent
     * (trust on first use). The accepted key is then persisted to the ssh profile so the user is not
     * prompted again. In non-interactive / CI environments the key is never prompted for: verification
     * stays on and the connection fails with an explanatory error instead of hanging.
     *
     * @param {SshSession} session - the session to attach the verifier to
     * @param {IHandlerParameters} commandParameters - command parameters, used for prompting and persistence
     */
    private attachHostKeyVerifier(session: SshSession, commandParameters: IHandlerParameters): void {
        // Host key verification explicitly disabled - warn the user and leave the hook unset so any key is accepted.
        if (session.ISshSession.insecure === true) {
            this.console.error("Warning: SSH host key verification is disabled (--insecure). The server's " +
                "identity is not being verified, so the connection is vulnerable to man-in-the-middle attacks.\n");
            return;
        }

        session.hostKeyVerifier = async (info: { fingerprint: string; key: string; changed: boolean }): Promise<boolean> => {
            const baseMessage = info.changed ?
                ZosUssMessages.hostKeyChanged.message :
                ZosUssMessages.hostKeyVerificationFailed.message;

            // Non-interactive / CI environments: never prompt. Keep verification on and fail with a clear error.
            if (process.env.CI != null) {
                this.console.error(`${baseMessage}\n` +
                    `Server host key fingerprint: ${info.fingerprint}\n` +
                    "Running in a CI environment, so the host key cannot be confirmed interactively. " +
                    "Pin the trusted key with --host-key (or the 'hostKey' ssh profile property) to proceed, " +
                    "or specify --insecure to connect without verifying the server.\n");
                return false;
            }

            // Interactive: present the fingerprint and prompt (trust on first use).
            if (info.changed) {
                this.console.error("WARNING: THE SSH HOST KEY HAS CHANGED FOR THIS SERVER!\n" +
                    "This could indicate a man-in-the-middle attack, or the server's host key may have " +
                    "legitimately changed.\n");
            } else {
                this.console.log(`The authenticity of host '${session.ISshSession.hostname}' can't be established.\n`);
            }
            const answer = await commandParameters.response.console.prompt(
                `Host key fingerprint is ${info.fingerprint}.\n` +
                "Are you sure you want to continue connecting (yes/no)? ");
            const trusted = answer != null && ["yes", "y"].includes(answer.trim().toLowerCase());
            if (!trusted) {
                return false;
            }

            // Persist the accepted key to the ssh profile so the user is not prompted again.
            session.ISshSession.hostKey = info.key;
            try {
                await this.persistHostKey(commandParameters, info.key);
            } catch (err) {
                this.console.error("Could not save the accepted host key to your configuration; " +
                    "you may be prompted again next time.\nDetails: " + err.message + "\n");
            }
            return true;
        };
    }

    /**
     * Persists an accepted host key into the active ssh team-config profile, so the user is not prompted
     * again on subsequent connections. Best effort: if no team config exists, autoStore is disabled, or the
     * ssh profile cannot be resolved, the key is simply not saved (the user will be prompted again).
     *
     * @param {IHandlerParameters} commandParameters - command parameters, used to resolve the active ssh profile
     * @param {string} hostKey - the base64-encoded host key to store
     */
    private async persistHostKey(commandParameters: IHandlerParameters, hostKey: string): Promise<void> {
        const config = ImperativeConfig.instance.config;
        if (config == null || !config.exists || !config.properties.autoStore) {
            return;
        }
        const profileName = ConfigUtils.getActiveProfileName("ssh", commandParameters.arguments);
        if (profileName == null || !config.api.profiles.exists(profileName)) {
            return;
        }
        const profilePath = config.api.profiles.getProfilePathFromName(profileName);

        // Write to the layer that actually contains the profile, then restore the previously active layer.
        const beforeLayer = config.api.layers.get();
        const foundLayer = config.api.layers.find(profileName);
        if (foundLayer != null) {
            config.api.layers.activate(foundLayer.user, foundLayer.global);
        }
        config.set(`${profilePath}.properties.hostKey`, hostKey, { secure: false });
        await config.save();
        config.api.layers.activate(beforeLayer.user, beforeLayer.global);

        this.console.log(`Saved the trusted host key to ssh profile '${profileName}'.\n`);
    }

    /**
     * Fail the command with an imperative error
     * @param {IImperativeError} err - the imperative error parameters
     */
    public fail(err: IImperativeError) {
        throw new ImperativeError(err);
    }

    /**
     * Returns the console interface for the command handler
     * @returns {IHandlerResponseConsoleApi}
     */
    public get console(): IHandlerResponseConsoleApi {
        return this.mHandlerParams.response.console;
    }

    /**
     * Returns the format interface for the command handler
     * @returns {IHandlerFormatOutputApi}
     */
    public get format(): IHandlerFormatOutputApi {
        return this.mHandlerParams.response.format;
    }

    /**
     * Returns the format interface for the command handler
     * @returns {IHandlerResponseDataApi}
     */
    public get data(): IHandlerResponseDataApi {
        return this.mHandlerParams.response.data;
    }

    /**
     * Returns the format interface for the command handler
     * @returns {IHandlerProgressApi}
     */
    public get progress(): IHandlerProgressApi {
        return this.mHandlerParams.response.progress;
    }

    /**
     * This is called by the {@link SshBaseHandler#process} after it creates a session.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler.
     *
     */
    public abstract processCmd(
        commandParameters: IHandlerParameters
    ): Promise<void>;
}
