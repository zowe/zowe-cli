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

import { IImperativeOverrides } from "./doc/IImperativeOverrides";
import { CredentialManagerFactory, DefaultCredentialManager } from "../../security";
import { IImperativeConfig } from "./doc/IImperativeConfig";
import { isAbsolute, resolve } from "path";
import { AppSettings } from "../../settings";
import { ImperativeConfig } from "../../utilities";
import { IConfigVault } from "../../config";
import { Logger } from "../../logger";

/**
 * Imperative-internal class to load overrides
 * You should not need to call this from your CLI.
 */
export class OverridesLoader {
    private static readonly ZOWE_CLI_PACKAGE_NAME = "@zowe/cli";

    /**
     * Apply overrides to all applicable facilities and use our defaults where
     * an override is not provided.
     *
     * @param {IImperativeConfig} config - the current {@link Imperative#loadedConfig}
     * @param {any} packageJson - the current package.json
     */
    public static async load(
        config: IImperativeConfig,
        packageJson: any
    ): Promise<void> {
        // Initialize the Credential Manager
        await this.loadCredentialManager(config, packageJson, ImperativeConfig.instance.config?.exists);
    }

    /**
     * Ensure the Credential Manager is initialized for team config.
     */
    public static async ensureCredentialManagerLoaded(): Promise<void> {
        if (CredentialManagerFactory.initialized) return;

        await this.loadCredentialManager(ImperativeConfig.instance.loadedConfig,
            ImperativeConfig.instance.callerPackageJson, true);
    }

    /**
     * Initialize the Credential Manager using the supplied override when provided.
     *
     * @param {IImperativeConfig} config - the current {@link Imperative#loadedConfig}
     * @param {any} packageJson - the current package.json
     * @param {boolean} useTeamConfig - specify True if team config is active
     */
    private static async loadCredentialManager(
        config: IImperativeConfig,
        packageJson: any,
        useTeamConfig?: boolean
    ): Promise<void> {
        const overrides: IImperativeOverrides = config.overrides;

        // The manager display name used to populate the "managed by" fields in profiles
        const displayName: string = (
            overrides.CredentialManager != null
            && AppSettings.initialized
            && AppSettings.instance.getNamespace("overrides") != null
            && AppSettings.instance.get("overrides", "CredentialManager") != null
            && AppSettings.instance.get("overrides", "CredentialManager") !== false
        ) ?
            // App settings is configured - use the plugin name for the manager name
            AppSettings.instance.get("overrides", "CredentialManager") as string
            :
            // App settings is not configured - use the CLI display name OR the package name as the manager name
            config.productDisplayName || config.name;

        // Initialize the credential manager if an override was supplied and/or keytar was supplied in package.json
        if (overrides.CredentialManager != null || this.shouldUseKeytar(packageJson, useTeamConfig)) {
            let Manager = overrides.CredentialManager;
            if (typeof overrides.CredentialManager === "string" && !isAbsolute(overrides.CredentialManager)) {
                Manager = resolve(process.mainModule.filename, "../", overrides.CredentialManager);
            }

            await CredentialManagerFactory.initialize({
                // Init the manager with the override specified OR (if null) default to keytar
                Manager,
                // The display name will be the plugin name that introduced the override OR it will default to the CLI name
                displayName,
                // The service is always the CLI name (Keytar and other plugins can use this to uniquely identify the service)
                service: config.name === this.ZOWE_CLI_PACKAGE_NAME ? DefaultCredentialManager.SVC_NAME : config.name,
                // If the default is to be used, we won't implant the invalid credential manager
                invalidOnFailure: !(Manager == null)
            });
        }

        await OverridesLoader.loadSecureConfig();
    }

    /**
     * Check if the DefaultCredentialManager which uses keytar should be enabled.
     * We require that keytar is listed as a dependency in package.json, and one of the following is true:
     *  1. AppSettings are not initialized (SDK usage)
     *  2. Team config is active (CLI with v2 profiles)
     *  3. CredentialManager override is host package name (CLI with v1 profiles)
     * @param packageJson The current package.json of the CLI package
     * @param useTeamConfig Specify True if team config is active
     * @returns True if DefaultCredentialManager should be used
     */
    private static shouldUseKeytar(packageJson: any, useTeamConfig: boolean): boolean {
        const deps = packageJson.dependencies ?? {};
        const optionalDeps = packageJson.optionalDependencies ?? {};
        return ("@zowe/secrets-for-zowe-sdk" in deps || "@zowe/secrets-for-zowe-sdk" in optionalDeps) &&
            (!AppSettings.initialized || useTeamConfig || AppSettings.instance.getNamespace("overrides")?.CredentialManager === packageJson.name);
    }

    /**
     * After the plugins and secure credentials are loaded, rebuild the configuration with the
     * secure values
     */
    private static async loadSecureConfig() {
        if (!CredentialManagerFactory.initialized) return;

        const vault: IConfigVault = {
            load: ((key: string): Promise<string> => {
                return CredentialManagerFactory.manager.load(key, true);
            }),
            save: ((key: string, value: any): Promise<void> => {
                return CredentialManagerFactory.manager.save(key, value);
            })
        };

        try {
            await ImperativeConfig.instance.config.api.secure.load(vault);
        } catch (err) {
            // Secure vault is optional since we can prompt for values instead
            Logger.getImperativeLogger().warn(`Secure vault not enabled. Reason: ${err.message}`);
        }
    }
}
