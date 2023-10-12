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

import { AbstractCredentialManager, SecureCredential } from "./abstract/AbstractCredentialManager";
import { ImperativeError } from "../../error";

import { keyring as keytar } from "@zowe/secrets-for-zowe-sdk"; // Used for typing purposes only

/**
 * Default Credential Manager is our implementation of the Imperative Credential Manager. This manager invokes methods
 * created by the keytar utility (https://www.npmjs.com/package/keytar) to access the secure credential vault on the
 * user's machine.
 *
 * ### Keychains Used by Keytar
 *
 * | OS | Vault |
 * |----|----------|
 * | Windows | Credential Vault |
 * | macOS | Keychain |
 * | Linux | Secret Sevice API/libsecret |
 *
 * ### Optional Install of Keytar
 *
 * It should be noted that keytar is an optional dependency of Imperative. This is because on Linux, it will not work
 * out of the box without some additional configuration to install libsecret. Keytar provides the following
 * documentation for Linux users to install libsecret:
 *
 * ---
 *
 * Depending on your distribution, you will need to run the following command:
 *
 * - Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
 * - Red Hat-based: `sudo yum install libsecret-devel`
 * - Arch Linux: `sudo pacman -S libsecret`
 */
export class DefaultCredentialManager extends AbstractCredentialManager {
    /**
     * Reference to the lazily loaded keytar module.
     *
     * @private
     */
    private keytar: typeof keytar;

    /**
     * Errors that occurred while loading keytar will be stored in here.
     *
     * Every method of this class should call the {@link checkForKeytar} method before proceeding. It
     * is this method that will check for keytar and throw this error if it was detected that keytar
     * wasn't loaded.
     *
     * @private
     */
    private loadError: ImperativeError;

    /**
     * Pass-through to the superclass constructor.
     *
     * @param {string} service The service string to send to the superclass constructor.
     * @param {string} displayName The manager display name.
     */
    constructor(service: string) {
        // Always ensure that a manager instantiates the super class, even if the
        // constructor doesn't do anything. Who knows what things might happen in
        // the abstract class initialization in the future.
        super(service, "default credential manager");
    }

    /**
     * Called by {@link CredentialManagerFactory.initialize} before the freeze of the object. This
     * gives us a chance to load keytar into the class before we are locked down. If a load failure
     * occurs, we will store the error and throw it once a method of this class tries to execute. This
     * prevents a missing keytar module from stopping all operation of the cli.
     *
     * In the future, we could go even further to have keytar load into a sub-object of this class so
     * that the load doesn't hold up the main class execution.
     *
     * @returns {Promise<void>} A promise that the function has completed.
     */
    public async initialize(): Promise<void> {
        try {
            this.keytar = (await import("@zowe/secrets-for-zowe-sdk")).keyring;
        } catch (error) {
            this.loadError = new ImperativeError({
                msg: "Secrets SDK not installed",
                causeErrors: error
            });
        }
    }

    /**
     * Calls the keytar deletePassword service with {@link DefaultCredentialManager#service} and the
     * account passed to the function by Imperative.
     *
     * @param {string} account The account for which to delete the password
     *
     * @returns {Promise<void>} A promise that the function has completed.
     *
     * @throws {@link ImperativeError} if keytar is not defined.
     * @throws {@link ImperativeError} when keytar.deletePassword returns false.
     */
    protected async deleteCredentials(account: string): Promise<void> {
        this.checkForKeytar();
        if (!await this.keytar.deletePassword(this.service, account)) {
            throw new ImperativeError({
                msg: "Unable to delete credentials.",
                additionalDetails: this.getMissingEntryMessage(account)
            });
        }
    }

    /**
     * Calls the keytar getPassword service with {@link DefaultCredentialManager#service} and the
     * account passed to the function by Imperative.
     *
     * @param {string} account The account for which to get credentials
     * @param {boolean} optional Set to true if failure to find credentials should be ignored
     * @returns {Promise<SecureCredential>} A promise containing the credentials stored in keytar.
     *
     * @throws {@link ImperativeError} if keytar is not defined.
     * @throws {@link ImperativeError} when keytar.getPassword returns null or undefined.
     */
    protected async loadCredentials(account: string, optional?: boolean): Promise<SecureCredential> {
        this.checkForKeytar();
        const password: string = await this.keytar.getPassword(this.service, account);

        if (password == null && !optional) {
            throw new ImperativeError({
                msg: "Unable to load credentials.",
                additionalDetails: this.getMissingEntryMessage(account)
            });
        }

        return password;
    }

    /**
     * Calls the keytar setPassword service with {@link DefaultCredentialManager#service} and the
     * account and credentials passed to the function by Imperative.
     *
     * @param {string} account The account to set credentials
     * @param {SecureCredential} credentials The credentials to store
     *
     * @returns {Promise<void>} A promise that the function has completed.
     *
     * @throws {@link ImperativeError} if keytar is not defined.
     */
    protected async saveCredentials(account: string, credentials: SecureCredential): Promise<void> {
        this.checkForKeytar();
        await this.keytar.setPassword(this.service, account, credentials);
    }

    /**
     * This function is called before the {@link deletePassword}, {@link getPassword}, and
     * {@link setPassword} functions. It will check if keytar is not null and will throw an error
     * if it is.
     *
     * The error thrown will be the contents of {@link loadError} or a new {@link ImperativeError}.
     * The former error will be the most common one as we expect failures during the load since keytar
     * is optional. The latter error will indicate that some unknown condition has happened so we will
     * create a new ImperativeError with the report suppressed. The report is suppressed because it
     * may be possible that a detailed report could capture a username and password, which would
     * probably be a bad thing.
     *
     * @private
     *
     * @throws {@link ImperativeError} when keytar is null or undefined.
     */
    private checkForKeytar(): void {
        if (this.keytar == null) {
            if (this.loadError == null) {
                throw new ImperativeError({
                    msg: "Keytar was not properly loaded due to an unknown cause."
                });
            } else {
                throw this.loadError;
            }
        }
    }

    private getMissingEntryMessage(account: string) {
        return "Could not find an entry in the credential vault for the following:\n" +
            `  Service = ${this.service}\n  Account = ${account}\n\n` +
            "Possible Causes:\n" +
            "  This could have been caused by any manual removal of credentials from your vault.\n\n" +
            "Resolutions: \n" +
            "  Recreate the credentials in the vault for the particular service in the vault.\n";
    }
}
