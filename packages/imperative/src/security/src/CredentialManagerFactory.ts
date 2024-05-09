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

import { AbstractCredentialManager } from "./abstract/AbstractCredentialManager";
import { ImperativeError } from "../../error";
import { ICredentialManagerInit } from "./doc/ICredentialManagerInit";
import { DefaultCredentialManager } from "./DefaultCredentialManager";

/**
 * This is a wrapper class that controls access to the credential manager used within
 * the Imperative framework. All calls to the credential manager done by Imperative
 * must go through this class for security reasons.
 */
export class CredentialManagerFactory {
    /**
     * Initialize the credential manager, then lock the door and throw away the
     * key. This method can only be called once and should be called by {@link Imperative.init}
     * immediately after the CLI configuration has been loaded.
     *
     * This is where any Credential Manager your cli provides will be initialized. First
     * Imperative will instantiate your manager (or the {@link DefaultCredentialManager} if none was provided to
     * {@link Imperative.init}) and will then call your class's initialize method.
     *
     * ### Dynamic Import of Module
     *
     * This method will perform a dynamic import of your {@link IImperativeOverrides.CredentialManager} module when the
     * Manager parameter is passed as a string. If anything goes wrong during this import or if the module that was exported
     * doesn't extend the {@link AbstractCredentialManager}, this method will throw an error.
     *
     * @see {@link IImperativeOverrides.CredentialManager}
     *
     * ### Immutable Class Creation
     *
     * After this method is complete, the instantiated credential manager will no longer allow changes
     * to it's direct variable assignments. This means that even your class can only change the values of it's direct
     * properties in the constructor and the initialize method. However, this does not prevent you from changing values
     * of properties of one of your classes objects.
     *
     * For example, after initialization, your class can not do something like this: `this.someProp = 5`. This will result
     * in a JavaScript "Cannot assign to read only property" exception because your class is immutable.
     * You still will be able to do stuff like this if someProp was already an object: `this.someProp.someValue = 5`. This
     * occurs because while Imperative marks your class as immutable (using Object.freeze) the underlying `this.someProp`
     * object is still mutable.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
     *
     * ### Plugin Provided Overrides
     *
     * This class attempts to handle a failed plugin override as well. If this method errors out because of problems
     * with the `Manager` parameter, it will check to see if the override was provided by a plugin loaded in the
     * {@link PluginManagementFacility}. The check is done by looking at the value present in the {@link AppSettings#settings}
     * of the singleton present in {@link AppSettings.instance}
     *
     * If the it was detected that the Manager was not provided by a plugin, the error encountered is thrown to
     * the calling function.
     *
     * If the initialization option "invalidOnFailure" is true, we will default to using the {@link InvalidCredentialManager}
     * which implements the {@link AbstractCredentialManager} methods. All these methods have been designed to throw
     * the error we caught in the **CredentialManagerFactory.initialize** function.
     *
     * @param {ICredentialManagerInit} params - Initialization parameters, see interface for details.
     *
     * @throws {@link ImperativeError} When it has been detected that this method has been called before.
     *         It is important that this method only executes once.
     *
     * @throws {@link ImperativeError} When the module specified by the Manager string references a module that
     *         does not extend {@link AbstractCredentialManager} and the override was not provided by a plugin.
     *         When the override is provided by a plugin, we will fall back to the {@link InvalidCredentialManager}.
     */
    public static async initialize(params: ICredentialManagerInit): Promise<void> {
        // The means to override the CredMgr exists, but we only use our built-in CredMgr.
        if (params.service == null) {
            params.service = DefaultCredentialManager.SVC_NAME;
        }

        // If the display name is not passed, use the cli name
        const displayName = (params.displayName == null) ? params.service : params.displayName;

        // If a manager override was not passed, use the default keytar manager
        const Manager = (params.Manager == null) ? DefaultCredentialManager : params.Manager;

        // Default invalid on failure to false if not specified
        params.invalidOnFailure = (params.invalidOnFailure == null) ? false : params.invalidOnFailure;

        if (this.mManager != null) {
            // Something tried to change the already existing credential manager, we should stop this.
            throw new ImperativeError({
                msg: "A call to CredentialManagerFactory.initialize has already been made! This method can only be called once",
            });
        }

        try {
            let manager: any;

            // Dynamically determine which manager to load.
            if (typeof Manager === "string") {
                // In the case of a string, we make the assumption that it is pointing to the absolute file path of something
                // that exports a manager class. So we'll load that class and initialize it with the same constructor parameters
                // that we would do with an actual constructor parameter.
                const LoadedManager = await import(Manager);
                manager = new LoadedManager(params.service, displayName);
            } else {
                manager = new Manager(params.service, displayName);
            }

            // After constructing the object, we will ensure that the thing loaded is indeed an
            // instance of an abstract credential manager. Since we cannot assume that our internal
            // load of a plugin provided a correct object to the function :/
            if (manager instanceof AbstractCredentialManager) {
                this.mManager = manager;
            } else {
                const message = (typeof Manager === "string") ?
                    `The manager provided at ${Manager} does not extend AbstractCredentialManager properly!` :
                    "A bad object was provided to the CredentialManagerFactory.initialize() method. This could be " +
                    "due to a bad plugin.";

                throw new ImperativeError({
                    msg: message
                });
            }

            if (this.mManager.initialize) {
                await this.mManager.initialize();
                const { Logger } = await import("../../logger");
                Logger.getImperativeLogger().debug(`Initialized the "${displayName}" credential manager for "${params.service}".`);
            }

        } catch (error) {
            // Perform dynamic requires when an error happens
            const { InvalidCredentialManager } = await import("./InvalidCredentialManager");
            const { Logger } = await import("../../logger");

            // Log appropriate error messages
            if (Manager !== DefaultCredentialManager) {
                const logError = `Failed to load the credential manager named "${displayName}"`;

                // Be sure to log the messages both to the console and to a file
                // so that support can also see these messages.
                Logger.getImperativeLogger().error(logError);
                Logger.getConsoleLogger().error(logError);

                Logger.getImperativeLogger().error(error.toString());
                Logger.getConsoleLogger().error(error.toString());
            }

            // If requested, we will instantiate the credential manager with the invalid credential manager,
            // which will cause any usage of the manager to fail with an error.
            if (params.invalidOnFailure) {
                this.mManager = new InvalidCredentialManager(params.service, error);
            } else {
                this.mManager = undefined;

                // The crash was caused by a bad override provided by a base cli
                // so this should be thrown up as a hard crash
                throw error;
            }
        }

        // Freeze both the wrapper class and the credential manager we just created
        // to prevent anyone from making changes to this class after the first
        // initialization. This plugs up a security hole so that a plugin can never
        // trash the security manager created on init.
        Object.freeze(this);
        Object.freeze(this.mManager);
    }

    /**
     * Static singleton instance of an instantiated {@link AbstractCredentialManager}
     *
     * @private
     */
    private static mManager: AbstractCredentialManager;

    /**
     * @returns {AbstractCredentialManager} - The credential manager that Imperative should use to
     *   retrieve user credentials.
     *
     * @throws {ImperativeError} - When the Credential Manager has not been initialized yet.
     */
    public static get manager(): AbstractCredentialManager {
        if (this.mManager == null) {
            throw new ImperativeError({
                msg: "Credential Manager not yet initialized! CredentialManagerFactory.initialize must " +
                    "be called prior to CredentialManagerFactory.mananger"
            });
        }

        return this.mManager;
    }

    /**
     * The credential manager may not be initialized if Keytar (or a plugin override) is not present. In this
     * scenario, the default is to store credentials in plain text.
     * @returns {boolean} - True if the credential manager has been initialized.
     */
    public static get initialized(): boolean {
        return !(this.mManager == null);
    }
}

// This also prevents someone being able to hijack the exported object. Essentially all of these Object.freeze
// calls make this class the programming equivalent of Fort Knox. Hard to get in but if you do get in, then
// there are lots of valuables
Object.freeze(exports);
