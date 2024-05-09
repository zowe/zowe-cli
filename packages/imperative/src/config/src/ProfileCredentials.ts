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

import * as fs from "fs";
import * as path from "path";

import { ImperativeError } from "../../error";
import { CredentialManagerFactory, DefaultCredentialManager, ICredentialManagerInit } from "../../security";
import { ImperativeConfig } from "../../utilities";
import { IProfOpts } from "./doc/IProfOpts";
import { ProfileInfo } from "./ProfileInfo";

export class ProfileCredentials {
    private mSecured: boolean;
    private mCredMgrOverride?: ICredentialManagerInit;

    constructor(private mProfileInfo: ProfileInfo, opts?: IProfOpts | (() => NodeModule)) {
        this.mCredMgrOverride = (typeof opts === "function") ? ProfileCredentials.defaultCredMgrWithKeytar(opts) : opts?.credMgrOverride;
    }

    /**
     * Given a custom method to require Keytar, return an object that defines
     * credential manager settings to replace the default credential manager.
     * If the credential manager is not overridden, the default implementation
     * is to `require("keytar")` from the caller app's node_modules folder.
     * @param requireKeytar Callback to require Keytar module for managing secure credentials
     * @returns Credential manager settings with Keytar module overridden
     */
    public static defaultCredMgrWithKeytar(requireKeytar: () => NodeModule): ICredentialManagerInit {
        return {
            service: null,
            Manager: class extends DefaultCredentialManager {
                public async initialize(): Promise<void> {
                    try {
                        (this as any).keytar = requireKeytar();
                    } catch (error) {
                        throw new ImperativeError({
                            msg: `Failed to load Keytar module: ${error.message}`,
                            causeErrors: error
                        });
                    }
                }
            }
        };
    }

    /**
     * Check if secure credentials will be encrypted or stored in plain text.
     * If using team config, this will always return true. If using classic
     * profiles, this will check whether a custom CredentialManager is defined
     * in the Imperative settings.json file.
     */
    public get isSecured(): boolean {
        this.mSecured = this.isTeamConfigSecure() || this.isCredentialManagerInAppSettings();
        return this.mSecured;
    }

    /**
     * Initialize credential manager to be used for secure credential storage.
     * This method throws if ProfileCredentials.isSecured is false. If the
     * CredentialManagerFactory is already initialized, it is reused since it
     * is not possible to reinitialize.
     */
    public async loadManager(): Promise<void> {
        if (!(this.mSecured ?? this.isSecured)) {
            throw new ImperativeError({ msg: "Secure credential storage is not enabled" });
        }

        if (!CredentialManagerFactory.initialized) {
            try {
                // TODO? Make CredentialManagerFactory.initialize params optional
                // see https://github.com/zowe/imperative/issues/545
                await CredentialManagerFactory.initialize({ service: null, ...(this.mCredMgrOverride || {}) });
            } catch (error) {
                throw (error instanceof ImperativeError) ? error : new ImperativeError({
                    msg: `Failed to load CredentialManager class: ${error.message}`,
                    causeErrors: error
                });
            }
        }

        if (this.mProfileInfo.usingTeamConfig) {
            await this.mProfileInfo.getTeamConfig().api.secure.load({
                load: ((key: string): Promise<string> => {
                    return CredentialManagerFactory.manager.load(key, true);
                }),
                save: ((key: string, value: any): Promise<void> => {
                    return CredentialManagerFactory.manager.save(key, value);
                })
            });
        }
    }

    /**
     * Check whether a teamConfig is secure or not
     * @returns False if not using teamConfig or there are no secure fields
     */
    private isTeamConfigSecure(): boolean {
        if (!this.mProfileInfo.usingTeamConfig) return false;
        if (this.mProfileInfo.getTeamConfig().api.secure.secureFields().length === 0) return false;
        return true;
    }

    /**
     * Check whether a custom CredentialManager is defined in the Imperative
     * settings.json file.
     */
    private isCredentialManagerInAppSettings(): boolean {
        try {
            const fileName = path.join(ImperativeConfig.instance.cliHome, "settings", "imperative.json");
            let settings: any;
            if (fs.existsSync(fileName)) {
                settings = JSON.parse(fs.readFileSync(fileName, "utf-8"));
            }
            const value1 = settings?.overrides.CredentialManager;
            const value2 = settings?.overrides["credential-manager"];
            return (typeof value1 === "string" && value1.length > 0) || (typeof value2 === "string" && value2.length > 0);
        } catch (error) {
            throw new ImperativeError({
                msg: "Unable to read Imperative settings file",
                causeErrors: error
            });
        }
    }
}
