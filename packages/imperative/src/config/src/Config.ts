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

import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as deepmerge from "deepmerge";
import * as findUp from "find-up";
import * as JSONC from "comment-json";
import * as lodash from "lodash";

import { fileURLToPath } from "url";
import { ConfigConstants } from "./ConfigConstants";
import { IConfig } from "./doc/IConfig";
import { IConfigLayer } from "./doc/IConfigLayer";
import { ImperativeError } from "../../error";
import { IConfigProfile } from "./doc/IConfigProfile";
import { IConfigOpts } from "./doc/IConfigOpts";
import { IConfigSecure } from "./doc/IConfigSecure";
import { IConfigVault } from "./doc/IConfigVault";
import { ConfigLayers, ConfigPlugins, ConfigProfiles, ConfigSecure } from "./api";
import { ConfigUtils } from "./ConfigUtils";
import { IConfigSchemaInfo } from "./doc/IConfigSchema";
import { JsUtils } from "../../utilities/src/JsUtils";
import { IConfigMergeOpts } from "./doc/IConfigMergeOpts";

/**
 * Enum used by Config class to maintain order of config layers
 */
enum Layers {
    ProjectUser = 0,
    ProjectConfig,
    GlobalUser,
    GlobalConfig
}

/**
 * The Config class provides facilities for reading and writing team
 * configuration files. It is used by Imperative to perform low-level
 * operations on a team configuration. The intent is that consumer
 * apps will not typically use the Config class, since end-users are
 * expected to write team configuration files by directly editing them
 * in an editor like VSCode.
 */
export class Config {
    /**
     * The trailing portion of a shared config file name
     */
    private static readonly END_OF_TEAM_CONFIG = ".config.json";

    /**
     * The trailing portion of a user-specific config file name
     */
    private static readonly END_OF_USER_CONFIG = ".config.user.json";

    /**
     * App name used in config filenames (e.g., *my_cli*.config.json)
     * It could be an absolute path, we recommend always using the getter method
     * @internal
     */
    public mApp: string;

    /**
     * List to store each of the config layers enumerated in `layers` enum
     * @internal
     */
    public mLayers: IConfigLayer[];

    /**
     * Directory where global config files are located. Defaults to `~/.appName`.
     * @internal
     */
    public mHomeDir: string;

    /**
     * Directory where project config files are located. Defaults to working directory.
     * @internal
     */
    public mProjectDir: string | false;

    /**
     * Currently active layer whose properties will be manipulated
     * @internal
     */
    public mActive: {
        user: boolean;
        global: boolean;
    };

    /**
     * Vault object with methods for loading and saving secure credentials
     * @internal
     */
    public mVault: IConfigVault;

    /**
     * Secure properties object stored in credential vault
     * @internal
     */
    public mSecure: IConfigSecure;

    /**
     * Cached version of Config APIs
     */
    private mApi: {
        profiles: ConfigProfiles,
        plugins: ConfigPlugins,
        layers: ConfigLayers,
        secure: ConfigSecure
    };

    // _______________________________________________________________________
    /**
     * Constructor for Config class. Don't use this directly. Await `Config.load` instead.
     * @param opts Options to control how Config class behaves
     * @private
     */
    private constructor(public opts?: IConfigOpts) { }

    // _______________________________________________________________________
    /**
     * Return a Config interface with required fields initialized as empty.
     */
    public static empty(): IConfig {
        return {
            profiles: {},
            defaults: {}
        };
    }

    // _______________________________________________________________________
    /**
     * Load config files from disk and secure properties from vault.
     * @param app App name used in config filenames (e.g., *my_cli*.config.json)
     * @param opts Options to control how Config class behaves
     * @throws An ImperativeError if the configuration does not load successfully
     */
    public static async load(app: string, opts?: IConfigOpts): Promise<Config> {
        opts = opts || {};

        // Create the basic empty configuration
        const myNewConfig = new Config(opts);
        myNewConfig.mApp = app;
        myNewConfig.mActive = { user: false, global: false };
        myNewConfig.mVault = opts.vault;
        myNewConfig.mSecure = {};

        // Populate configuration file layers
        await myNewConfig.reload(opts);

        return myNewConfig;
    }

    /**
     * Reload config files from disk in the current project directory.
     * @param opts Options to control how Config class behaves
     * @throws An ImperativeError if the configuration does not load successfully
     */
    public async reload(opts?: IConfigOpts) {
        this.mLayers = [];
        this.mHomeDir = opts?.homeDir ?? this.mHomeDir ?? path.join(os.homedir(), `.${this.mApp}`);
        this.mProjectDir = opts?.projectDir ?? process.cwd();

        // Populate configuration file layers
        for (const layer of [
            Layers.ProjectUser, Layers.ProjectConfig,
            Layers.GlobalUser, Layers.GlobalConfig
        ]) {
            this.mLayers.push({
                path: this.layerPath(layer),
                exists: false,
                properties: Config.empty(),
                global: layer === Layers.GlobalUser || layer === Layers.GlobalConfig,
                user: layer === Layers.ProjectUser || layer === Layers.GlobalUser
            });
        }

        // Read and populate each configuration layer
        try {
            let setActive = true;
            for (const currLayer of this.mLayers) {
                if (!opts?.noLoad) { this.api.layers.read(currLayer); }

                // Find the active layer
                if (setActive && currLayer.exists) {
                    this.mActive.user = currLayer.user;
                    this.mActive.global = currLayer.global;
                    setActive = false;
                }

                // Populate any undefined defaults
                currLayer.properties.defaults = currLayer.properties.defaults || {};
                currLayer.properties.profiles = currLayer.properties.profiles || {};
            }
        } catch (e) {
            if (e instanceof ImperativeError) {
                throw e;
            } else {
                throw new ImperativeError({ msg: `An unexpected error occurred during config load: ${e.message}` });
            }
        }

        // Load secure fields unless we have already failed to load them from the vault
        if (!opts?.noLoad && (opts?.vault != null || !this.api.secure.loadFailed)) {
            await this.api.secure.load(opts?.vault);
        }
    }

    // _______________________________________________________________________
    /**
     * Save config files to disk and store secure properties in vault.
     * @param allLayers Specify true to save all config layers instead of only the active one
     */
    public async save(allLayers?: boolean) {
        // Save secure fields
        await this.api.secure.save(allLayers);

        try {
            for (const currLayer of this.mLayers) {
                if (allLayers || (currLayer.user === this.mActive.user && currLayer.global === this.mActive.global)) {
                    this.api.layers.write(currLayer);
                }
            }
        } catch (e) {
            if (e instanceof ImperativeError) {
                throw e;
            } else {
                throw new ImperativeError({ msg: `An unexpected error occurred during config save: ${e.message}` });
            }
        }
    }

    // _______________________________________________________________________
    /**
     * Get absolute file path for a config layer.
     * For project config files, We search up from our current directory and
     * ignore the Zowe hone directory (in case our current directory is under
     * Zowe home.). For golbal config files we only retrieve config files
     * from the Zowe home directory.
     *
     * @internal
     * @param layer Enum value for config layer
     */
    private layerPath(layer: Layers): string {
        switch (layer) {
            case Layers.ProjectUser: {
                if (this.mProjectDir === false) return "";
                const userConfigPath = Config.search(this.userConfigName, { ignoreDirs: [this.mHomeDir], startDir: this.mProjectDir });
                return userConfigPath || path.join(this.mProjectDir, this.userConfigName);
            }
            case Layers.ProjectConfig: {
                if (this.mProjectDir === false) return "";
                const configPath = Config.search(this.configName, { ignoreDirs: [this.mHomeDir], startDir: this.mProjectDir });
                return configPath || path.join(this.mProjectDir, this.configName);
            }
            case Layers.GlobalUser:
                return path.join(this.mHomeDir, this.userConfigName);
            case Layers.GlobalConfig:
                return path.join(this.mHomeDir, this.configName);
        }
    }

    // _______________________________________________________________________
    /**
     * Access the config API for manipulating profiles, plugins, layers, and secure values.
     */
    get api() {
        if (this.mApi == null) {
            this.mApi = {
                profiles: new ConfigProfiles(this),
                plugins: new ConfigPlugins(this),
                layers: new ConfigLayers(this),
                secure: new ConfigSecure(this)
            };
        }
        return this.mApi;
    }

    // _______________________________________________________________________
    /**
     * True if any config layers exist on disk, otherwise false.
     */
    public get exists(): boolean {
        for (const layer of this.mLayers)
            if (layer.exists) return true;
        return false;
    }

    // _______________________________________________________________________
    /**
     * List of absolute file paths for all config layers.
     */
    public get paths(): string[] {
        return this.mLayers.map((layer: IConfigLayer) => layer.path);
    }

    // _______________________________________________________________________
    /**
     * List of all config layers.
     * Returns a clone to prevent accidental edits of the original object.
     */
    public get layers(): IConfigLayer[] {
        return JSONC.parse(JSONC.stringify(this.mLayers, null, ConfigConstants.INDENT));
    }

    // _______________________________________________________________________
    /**
     * List of properties across all config layers.
     * Returns a clone to prevent accidental edits of the original object.
     */
    public get properties(): IConfig {
        return this.layerMerge();
    }

    /**
     * List of properties across all config layers.
     * Returns the original object, not a clone, so use with caution.
     * This is used in internal code because cloning a JSONC object is slow.
     * @internal
     */
    public get mProperties(): IConfig {
        return this.layerMerge({ cloneLayers: false });
    }

    // _______________________________________________________________________
    /**
     * App name used in config filenames (e.g., *my_cli*.config.json)
     */
    public get appName(): string {
        return this.mApp;
    }

    // _______________________________________________________________________
    /**
     * Filename used for config JSONC files
     */
    public get configName(): string {
        return `${this.appName}${Config.END_OF_TEAM_CONFIG}`;
    }

    // _______________________________________________________________________
    /**
     * Filename used for user config JSONC files
     */
    public get userConfigName(): string {
        return `${this.appName}${Config.END_OF_USER_CONFIG}`;
    }

    // _______________________________________________________________________
    /**
     * Filename used for config schema JSON files
     */
    public get schemaName(): string {
        return `${this.appName}.schema.json`;
    }

    // _______________________________________________________________________
    /**
     * Schema file path used by the active layer
     */
    public getSchemaInfo(): IConfigSchemaInfo {
        const layer = this.layerActive();
        const originalSchema = layer.properties.$schema;
        if (originalSchema == null) {
            return {
                original: null,
                resolved: null,
                local: false,
            };
        }

        const tempSchema = originalSchema.startsWith("file://") ? fileURLToPath(originalSchema) : originalSchema;
        const schemaFilePath = path.resolve(tempSchema.startsWith("./") ? path.join(path.dirname(layer.path), tempSchema) : tempSchema);
        return {
            original: originalSchema,
            resolved: !JsUtils.isUrl(tempSchema) ? schemaFilePath : originalSchema,
            local: !JsUtils.isUrl(tempSchema),
        };
    }

    // _______________________________________________________________________
    /**
     * Search up the directory tree for the directory containing the
     * specified config file.
     *
     * @param file Contains the name of the desired config file
     * @param opts.ignoreDirs Contains an array of directory names to be
     *        ignored (skipped) during the search.
     * @param opts.startDir Contains the name of the directory where the
     *        search should be started. Defaults to working directory.
     *
     * @returns The full path name to config file or null if not found.
     */
    public static search(file: string, opts?: { ignoreDirs?: string[]; startDir?: string }): string {
        opts = opts || {};
        const p = findUp.sync((directory: string) => {
            if (opts.ignoreDirs?.includes(directory)) return;
            return fs.existsSync(path.join(directory, file)) && directory;
        }, { cwd: opts.startDir, type: "directory" });
        return p ? path.join(p, file) : null;
    }

    // _______________________________________________________________________
    /**
     * The properties object with secure values masked.
     * @type {IConfig}
     * @memberof Config
     */
    public get maskedProperties(): IConfig {
        return this.layerMerge({ maskSecure: true });
    }

    // _______________________________________________________________________
    /**
     * Set value of a property in the active config layer.
     * TODO: more validation
     *
     * @param propertyPath Property path
     * @param value Property value
     * @param opts Optional parameters to change behavior
     * * `parseString` - If true, strings will be converted to a more specific
     *                   type like boolean or number when possible
     * * `secure` - If true, the property will be stored securely.
     *              If false, the property will be stored in plain text.
     */
    public set(propertyPath: string, value: any, opts?: { parseString?: boolean; secure?: boolean }) {
        opts = opts || {};

        const layer = this.layerActive();
        let obj: any = layer.properties;
        const segments = propertyPath.split(".");
        propertyPath.split(".").forEach((segment: string) => {
            if (obj[segment] == null && segments.indexOf(segment) < segments.length - 1) {
                obj[segment] = {};
                obj = obj[segment];
            } else if (segments.indexOf(segment) === segments.length - 1) {
                if (opts?.parseString) {
                    value = ConfigUtils.coercePropValue(value);
                }

                if (opts?.parseString && Array.isArray(obj[segment])) {
                    obj[segment].push(value);
                } else {
                    obj[segment] = value;
                }
            } else {
                obj = obj[segment];
            }
        });

        if (opts.secure != null) {
            const secureInfo = this.api.secure.secureInfoForProp(propertyPath);
            if (secureInfo != null) {
                const secureProps: string[] = lodash.get(layer.properties, secureInfo.path, []);
                if (opts.secure && !secureProps.includes(secureInfo.prop)) {
                    lodash.set(layer.properties, secureInfo.path, [...secureProps, secureInfo.prop]);
                } else if (!opts.secure && secureProps.includes(secureInfo.prop)) {
                    lodash.set(layer.properties, secureInfo.path, secureProps.filter((p) => p !== secureInfo.prop));
                }
            } else if (opts.secure === true) {
                throw new ImperativeError({ msg: "The secure option is only valid when setting a single property" });
            }
        }
    }

    // _______________________________________________________________________
    /**
     * Unset value of a property in the active config layer.
     * @param propertyPath Property path
     * @param opts Include `secure: false` to preserve property in secure array
     */
    public delete(propertyPath: string, opts?: { secure?: boolean }) {
        opts = opts || {};

        const layer = this.layerActive();
        lodash.unset(layer.properties, propertyPath);

        if (opts.secure !== false) {
            const secureInfo = this.api.secure.secureInfoForProp(propertyPath);
            if (secureInfo != null) {
                const secureProps: string[] = lodash.get(layer.properties, secureInfo.path);
                if (secureProps != null && secureProps.includes(secureInfo.prop)) {
                    lodash.set(layer.properties, secureInfo.path, secureProps.filter((p) => p !== secureInfo.prop));
                }
            }
        }
    }

    // _______________________________________________________________________
    /**
     * Set the $schema value at the top of the config JSONC.
     * Also save the schema to disk if an object is provided.
     * @param schema The URI of JSON schema, or a schema object to use
     */
    public setSchema(schema: string | object) {
        const layer = this.layerActive();
        const schemaUri = (typeof schema === "string") ? schema : `./${this.schemaName}`;
        const schemaObj = (typeof schema !== "string") ? schema : null;

        if (layer.properties.$schema == null) {
            layer.properties = JSONC.parse(JSONC.stringify({ $schema: schemaUri, ...layer.properties }, null, ConfigConstants.INDENT));
        }

        const schemaInfo = this.getSchemaInfo();
        if (schemaObj != null && (schemaInfo.local || schemaInfo.original.startsWith("./"))) {
            fs.writeFileSync(schemaInfo.resolved, JSONC.stringify(schemaObj, null, ConfigConstants.INDENT));
        }
    }

    // _______________________________________________________________________
    /**
     * Merge the properties from multiple layers into a single Config object.
     *
     * @internal
     * @param opts Options to control how config layers are merged
     *
     * @returns The resulting Config object
     */
    public layerMerge(opts: IConfigMergeOpts = {}): IConfig {
        // config starting point
        // NOTE: "properties" and "secure" only apply to the individual layers
        // NOTE: they will be blank for the merged config
        const c = Config.empty();

        // merge each layer
        this.mLayers.forEach((layer: IConfigLayer) => {

            // Merge "plugins" - create a unique set from all entries
            const allPlugins = Array.from(new Set((layer.properties.plugins || []).concat(c.plugins || [])));
            if (allPlugins.length > 0) {
                c.plugins = allPlugins;
            }

            // Merge "defaults" - only add new properties from this layer
            for (const [name, value] of Object.entries(layer.properties.defaults)) {
                c.defaults[name] = c.defaults[name] || value;
            }

            if (c.autoStore == null && layer.properties.autoStore != null) {
                c.autoStore = layer.properties.autoStore;
            }
        });

        // Merge the project layer profiles
        const usrProject = this.layerProfiles(this.mLayers[Layers.ProjectUser], opts);
        const project = this.layerProfiles(this.mLayers[Layers.ProjectConfig], opts);
        const proj: { [key: string]: IConfigProfile } = deepmerge(project, usrProject);

        // Merge the global layer profiles
        const usrGlobal = this.layerProfiles(this.mLayers[Layers.GlobalUser], opts);
        const global = this.layerProfiles(this.mLayers[Layers.GlobalConfig], opts);
        const glbl: { [key: string]: IConfigProfile } = deepmerge(global, usrGlobal);

        // Traverse all the global profiles merging any missing from project profiles
        c.profiles = proj;
        if (!opts.excludeGlobalLayer) {
            for (const [n, p] of Object.entries(glbl)) {
                if (c.profiles[n] == null)
                    c.profiles[n] = p;
            }
        }

        return c;
    }

    // _______________________________________________________________________
    /**
     * Obtain the profiles object for a specified layer object.
     *
     * @internal
     * @param opts Options to control how config layers are merged
     *
     * @returns The resulting profile object
     */
    public layerProfiles(layer: IConfigLayer, opts: IConfigMergeOpts = {}): { [key: string]: IConfigProfile } {
        let properties = layer.properties;
        if (opts.cloneLayers !== false || opts.maskSecure) {
            properties = JSONC.parse(JSONC.stringify(properties, null, ConfigConstants.INDENT));
        }
        if (opts.maskSecure) {
            for (const secureProp of this.api.secure.secureFields(layer)) {
                if (lodash.has(properties, secureProp)) {
                    lodash.set(properties, secureProp, ConfigConstants.SECURE_VALUE);
                }
            }
        }
        return properties.profiles;
    }

    // _______________________________________________________________________
    /**
     * Find the layer with the specified user and global properties.
     *
     * @internal
     * @param user True specifies that you want the user layer.
     * @param global True specifies that you want the layer at the global level.
     *
     * @returns The desired layer object. Null if no layer matches.
     */
    public findLayer(user: boolean, global: boolean): IConfigLayer {
        for (const layer of (this.mLayers || [])) {
            if (layer.user === user && layer.global === global)
                return layer;
        }
    }

    // _______________________________________________________________________
    /**
     * Obtain the layer object that is currently active.
     *
     * @internal
     *
     * @returns The active layer object
     */
    public layerActive(): IConfigLayer {
        const layer = this.findLayer(this.mActive.user, this.mActive.global);
        if (layer != null) return layer;
        throw new ImperativeError({ msg: `internal error: no active layer found` });
    }

    // _______________________________________________________________________
    /**
     * Check if a layer exists in the given path
     *
     * @param inDir The directory to which you want to look for the layer.
     */
    public layerExists(inDir: string, user?: boolean): boolean {
        let found = false;

        // Search in all layers
        this.mLayers.forEach(layer => {
            found = !found && layer.exists && (typeof user !== "undefined" ? layer.user === user : true) && path.dirname(layer.path) === inDir;
        });

        // Search for user and non-user config in the given directory
        if (!found) {
            if (typeof user === "undefined") {
                found = fs.existsSync(path.join(inDir, this.configName)) || fs.existsSync(path.join(inDir, this.userConfigName));
            } else {
                found = fs.existsSync(path.join(inDir, user ? this.userConfigName : this.configName));
            }
        }

        return found;
    }

    // _______________________________________________________________________
    /**
     * Form the path name of the team config file to display in messages.
     * Always return the team name (not the user name).
     * If the a team configuration is active, return the full path to the
     * config file.
     *
     * @param options - a map containing option properties. Currently, the only
     *                  property supported is a boolean named addPath.
     *                  {addPath: true | false}
     *
     * @returns The path (if requested) and file name of the team config file.
     */
    public formMainConfigPathNm(options: any): string {
        // if a team configuration is not active, just return the file name.
        let configPathNm: string = this.appName + Config.END_OF_TEAM_CONFIG;
        if (options.addPath === false) {
            // if our caller does not want the path, just return the file name.
            return configPathNm;
        }

        if (this.exists) {
            // form the full path to the team config file
            configPathNm = this.api.layers.get().path;

            // this.api.layers.get() returns zowe.config.user.json
            // when both shared and user config files exit.
            // Ensure that we use zowe.config.json, not zowe.config.user.json.
            configPathNm = configPathNm.replace(Config.END_OF_USER_CONFIG, Config.END_OF_TEAM_CONFIG);
        }
        return configPathNm;
    }

}
