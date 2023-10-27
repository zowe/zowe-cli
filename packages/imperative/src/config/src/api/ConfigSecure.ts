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
import * as JSONC from "comment-json";
import * as lodash from "lodash";
import { ConfigApi } from "./ConfigApi";
import { IConfig } from "../doc/IConfig";
import { IConfigVault } from "../doc/IConfigVault";
import { IConfigSecureProperties } from "../doc/IConfigSecure";
import { ConfigConstants } from "../ConfigConstants";
import { IConfigProfile } from "../doc/IConfigProfile";
import { CredentialManagerFactory } from "../../../security";

/**
 * API Class for manipulating config layers.
 */
export class ConfigSecure extends ConfigApi {
    private mLoadFailed: boolean;

    // _______________________________________________________________________
    /**
     * Load the secure application properties from secure storage using the
     * specified vault interface. The vault interface is placed into our
     * Config object. The secure values are placed into our Config layers.
     *
     * @param vault Interface for loading and saving to secure storage.
     */
    public async load(vault?: IConfigVault) {
        if (vault != null) {
            this.mConfig.mVault = vault;
        }
        if (this.mConfig.mVault == null) return;

        // load the secure fields
        try {
            const s: string = await this.mConfig.mVault.load(ConfigConstants.SECURE_ACCT);
            if (s == null) return;
            this.mConfig.mSecure = JSONC.parse(s);
        } catch (error) {
            this.mLoadFailed = true;
            throw error;
        }
        this.mLoadFailed = false;

        // populate each layers properties
        this.mConfig.mLayers.forEach(this.loadCached.bind(this));
    }

    // _______________________________________________________________________
    /**
     * Copy secure config properties from cached secure properties into the
     * specified layer. To load secure config properties directly from the
     * vault, use the asynchronous method `load` instead.
     *
     * @internal
     * @param opts The user and global flags that specify one of the four
     *             config files (aka layers).
     */
    public loadCached(opts?: { user: boolean; global: boolean }) {
        if (this.mConfig.mVault == null) return;
        const layer = opts ? this.mConfig.findLayer(opts.user, opts.global) : this.mConfig.layerActive();

        // Find the matching layer
        for (const [filePath, secureProps] of Object.entries(this.mConfig.mSecure)) {
            if (filePath === layer.path) {

                // Only set those indicated by the config
                for (const p of this.secureFields(layer)) {

                    // Extract and set secure properties
                    for (const [sPath, sValue] of Object.entries(secureProps)) {
                        if (sPath === p) {
                            const segments = sPath.split(".");
                            let obj: any = layer.properties;
                            for (let x = 0; x < segments.length; x++) {
                                const segment = segments[x];
                                if (x === segments.length - 1) {
                                    obj[segment] = sValue;
                                    break;
                                }
                                obj = obj[segment];
                                if (obj == null) break;
                            }
                        }
                    }
                }
            }
        }
    }

    // _______________________________________________________________________
    /**
     * Save the secure application properties into secure storage using
     * the vault interface from our config object.
     *
     * @param allLayers Specify true to save all config layers instead of only the active one
     */
    public async save(allLayers?: boolean) {
        if (this.mConfig.mVault == null) return;
        const beforeLen = Object.keys(this.mConfig.mSecure).length;

        // Build the entries for each layer
        for (const { user, global } of this.mConfig.mLayers) {
            if (allLayers || (user === this.mConfig.mActive.user && global === this.mConfig.mActive.global)) {
                this.cacheAndPrune({ user, global });
            }
        }

        // Save the entries if needed
        if (Object.keys(this.mConfig.mSecure).length > 0 || beforeLen > 0) {
            await this.directSave();
        }
    }

    // _______________________________________________________________________
    /**
     * Save secure properties to the vault without rebuilding the JSON object.
     * @internal
     */
    public async directSave() {
        await this.mConfig.mVault.save(ConfigConstants.SECURE_ACCT, JSONC.stringify(this.mConfig.mSecure));
    }

    // _______________________________________________________________________
    /**
     * Copy secure config properties from the specified layer into cached
     * secure properties. To save secure config properties directly to the
     * vault, use the asynchronous method `save` instead.
     *
     * Warning: Do not pass an `IConfigLayer` object into this method unless
     * you want its properties to be edited.
     *
     * @internal
     * @param opts The user and global flags that specify one of the four
     *             config files (aka layers).
     * @param opts.properties `IConfig` object cloned from the specified layer.
     *                        If specified, secure properties will be removed.
     */
    public cacheAndPrune(opts?: { user: boolean; global: boolean; properties?: IConfig }) {
        const layer = opts ? this.mConfig.findLayer(opts.user, opts.global) : this.mConfig.layerActive();

        // Create all the secure property entries
        const sp: IConfigSecureProperties = {};
        for (const path of this.secureFields(layer)) {
            const segments = path.split(".");
            let obj: any = opts?.properties ?? layer.properties;
            for (let x = 0; x < segments.length; x++) {
                const segment = segments[x];
                const value = obj[segment];
                if (value == null) break;
                if (x === segments.length - 1) {
                    sp[path] = value;
                    if (opts?.properties != null) {
                        delete obj[segment];
                    }
                    break;
                }
                obj = obj[segment];
            }
        }

        if (this.mConfig.mVault != null) {
            // Clear the entry and rebuild it
            delete this.mConfig.mSecure[layer.path];

            // Create the entry to set the secure properties
            if (Object.keys(sp).length > 0) {
                this.mConfig.mSecure[layer.path] = sp;
            }
        }
    }

    // _______________________________________________________________________
    /**
     * List full paths of all secure properties found in a team config file.
     *
     * @param opts The user and global flags that specify one of the four
     *             config files (aka layers).
     * @returns Array of secure property paths
     *          (e.g., "profiles.lpar1.properties.password")
     */
    public secureFields(opts?: { user: boolean; global: boolean }): string[] {
        const layer = opts ? this.mConfig.findLayer(opts.user, opts.global) : this.mConfig.layerActive();
        return this.findSecure(layer.properties.profiles, "profiles");
    }

    // _______________________________________________________________________
    /**
     * List names of secure properties for a profile. They may be defined at
     * the profile's level, or at a higher level if the config is nested.
     * @param profileName Profile name to search for
     * @returns Array of secure property names
     */
    public securePropsForProfile(profileName: string) {
        const profilePath = this.mConfig.api.profiles.getProfilePathFromName(profileName);
        const secureProps = [];
        for (const propPath of this.secureFields()) {
            const pathSegments = propPath.split(".");  // profiles.XXX.properties.YYY
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (profilePath.startsWith(pathSegments.slice(0, -2).join("."))) {
                secureProps.push(pathSegments.pop());
            }
        }
        return secureProps;
    }

    /**
     * Recursively find secure property paths inside a team config
     * "profiles" object.
     * @internal
     * @param profiles The "profiles" object that is present at the top level
     *                 of team config files, and may also be present at lower
     *                 levels.
     * @param path The JSON path to the "profiles" object
     * @returns Array of secure property paths
     */
    public findSecure(profiles: { [key: string]: IConfigProfile }, path: string): string[] {
        const secureProps = [];
        for (const profName of Object.keys(profiles)) {
            for (const propName of (profiles[profName].secure || [])) {
                secureProps.push(`${path}.${profName}.properties.${propName}`);
            }
            if (profiles[profName].profiles != null) {
                secureProps.push(...this.findSecure(profiles[profName].profiles, `${path}.${profName}.profiles`));
            }
        }
        return secureProps;
    }

    /**
     * Retrieve info that can be used to store a profile property securely.
     *
     * For example, to securely store "profiles.lpar1.properties.password", the
     * name "password" would be stored in "profiles.lpar1.secure".
     *
     * @internal
     * @param propertyPath The full path of the profile property
     * @param findUp Specify true to search up in the config file for higher level secure arrays
     * @returns Object with the following attributes:
     *  - `path` The JSON path of the secure array
     *  - `prop` The name of the property
     */
    public secureInfoForProp(propertyPath: string, findUp?: boolean): { path: string, prop: string } {
        if (!propertyPath.includes(".properties.")) {
            return;
        }

        const pathSegments = propertyPath.split(".");  // profiles.XXX.properties.YYY
        const secureProp = pathSegments.pop();
        let securePath = propertyPath.replace(/\.properties.+/, ".secure");

        if (findUp) {
            const layer = this.mConfig.layerActive();
            while (layer.exists && pathSegments.length > 2) {
                pathSegments.pop();
                const testSecurePath = pathSegments.join(".") + ".secure";
                if (lodash.get(layer.properties, testSecurePath)?.includes(secureProp)) {
                    securePath = testSecurePath;
                    break;
                }
            }
        }

        return { path: securePath, prop: secureProp };
    }

    /**
     * Delete secure properties stored for team config files that do not exist.
     * @returns Array of file paths for which properties were deleted
     */
    public rmUnusedProps(): string[] {
        const prunedFiles: string[] = [];
        for (const filename of Object.keys(this.mConfig.mSecure)) {
            if (!fs.existsSync(filename)) {
                delete this.mConfig.mSecure[filename];
                prunedFiles.push(filename);
            }
        }
        return prunedFiles;
    }

    /**
     * Return true if the secure load method was called and threw an error, or
     * it was never called because the CredentialManager failed to initialize.
     */
    public get loadFailed(): boolean {
        return (this.mLoadFailed != null) ? this.mLoadFailed : !CredentialManagerFactory.initialized;
    }
}
