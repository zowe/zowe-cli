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
import * as JSONC from "comment-json";
import * as lodash from "lodash";
import { ImperativeError } from "../../../error";
import { ConfigConstants } from "../ConfigConstants";
import { IConfigLayer } from "../doc/IConfigLayer";
import { ConfigApi } from "./ConfigApi";
import { IConfig } from "../doc/IConfig";

/**
 * API Class for manipulating config layers.
 */
export class ConfigLayers extends ConfigApi {

    // _______________________________________________________________________
    /**
     * Read a config layer from disk into memory for application use.
     *
     * @param opts The user and global flags that indicate which of the four
     *             config files (aka layers) is to be read.
     */
    public read(opts?: { user: boolean; global: boolean }) {
        // Attempt to populate the layer
        const layer = opts ? this.mConfig.findLayer(opts.user, opts.global) : this.mConfig.layerActive();
        if (fs.existsSync(layer.path)) {
            let fileContents: any;
            try {
                fileContents = fs.readFileSync(layer.path);
            } catch (e) {
                throw new ImperativeError({
                    msg: `An error was encountered while trying to read the file '${layer.path}'.\nError details: ${e.message}`,
                    suppressDump: true
                });
            }
            try {
                layer.properties = JSONC.parse(fileContents.toString());
                layer.exists = true;
            } catch (e) {
                throw new ImperativeError({
                    msg: `Error parsing JSON in the file '${layer.path}'.\n` +
                        `Please check this configuration file for errors.\nError details: ${e.message}\nLine ${e.line}, Column ${e.column}`,
                    suppressDump: true
                });
            }
            this.mConfig.api.secure.loadCached(opts);
        } else if (layer.exists) {
            layer.properties = {} as any;
            layer.exists = false;
        }

        // Populate any undefined defaults
        layer.properties.profiles = layer.properties.profiles || {};
        layer.properties.defaults = layer.properties.defaults || {};
    }

    // _______________________________________________________________________
    /**
     * Write a config layer to disk.
     *
     * @param opts The user and global flags that indicate which of the four
     *             config files (aka layers) is to be written.
     */
    public write(opts?: { user: boolean; global: boolean }) {
        // TODO: should we prevent a write if there is no vault
        // TODO: specified and there are secure fields??

        // If fields are marked as secure
        const layer = opts ? this.mConfig.findLayer(opts.user, opts.global) : this.mConfig.layerActive();
        const layerCloned = JSONC.parse(JSONC.stringify(layer, null, ConfigConstants.INDENT));
        this.mConfig.api.secure.cacheAndPrune(layerCloned);

        // Write the layer
        try {
            fs.writeFileSync(layer.path, JSONC.stringify(layerCloned.properties, null, ConfigConstants.INDENT));
        } catch (e) {
            throw new ImperativeError({ msg: `error writing "${layer.path}": ${e.message}` });
        }
        layer.exists = true;
    }

    // _______________________________________________________________________
    /**
     * Select which layer is the currently active layer.
     *
     * @param user True if you want the user layer.
     * @param global True if you want the global layer.
     * @param inDir The directory to which you want to set the file path
     *              for this layer.
     */
    public activate(user: boolean, global: boolean, inDir?: string) {
        this.mConfig.mActive.user = user;
        this.mConfig.mActive.global = global;

        if (inDir != null) {
            const layer = this.mConfig.layerActive();

            // Load config layer if file path has changed
            if (inDir !== path.dirname(layer.path)) {
                layer.path = path.join(inDir, path.basename(layer.path));
                this.read();
            }
        }
    }

    // _______________________________________________________________________
    /**
     * Gets a json object that represents the currently active layer.
     *
     * @returns The json object
     */
    public get(): IConfigLayer {
        // Note: Add indentation to allow comments to be accessed via config.api.layers.get(), otherwise use layerActive()
        // return JSONC.parse(JSONC.stringify(this.mConfig.layerActive(), null, ConfigConstants.INDENT));
        return JSONC.parse(JSONC.stringify(this.mConfig.layerActive(), null, ConfigConstants.INDENT));
    }

    // _______________________________________________________________________
    /**
     * Set the the currently active layer to the supplied json object.
     *
     * @param user True if you want the user layer.
     */
    public set(cnfg: IConfig) {
        for (const i in this.mConfig.mLayers) {
            if (this.mConfig.mLayers[i].user === this.mConfig.mActive.user &&
                this.mConfig.mLayers[i].global === this.mConfig.mActive.global) {
                this.mConfig.mLayers[i].properties = cnfg;
                this.mConfig.mLayers[i].properties.defaults = this.mConfig.mLayers[i].properties.defaults || {};
                this.mConfig.mLayers[i].properties.profiles = this.mConfig.mLayers[i].properties.profiles || {};
            }
        }
    }

    // _______________________________________________________________________
    /**
     * Merge properties from the supplied Config object into the active layer.
     * If dryRun is specified, merge is applied to a copy of the layer and returned.
     * If dryRun is not specified, merge is applied directly to the layer and nothing is returned.
     *
     * @param cnfg The Config object to merge.
     * @returns The merged config layer or void
     */
    public merge(cnfg: IConfig, dryRun: boolean = false): void | IConfigLayer {
        let layer: IConfigLayer;
        if (dryRun) {
            layer = JSONC.parse(JSONC.stringify(this.mConfig.layerActive(), null, ConfigConstants.INDENT));
        } else {
            layer = this.mConfig.layerActive();
        }

        layer.properties.profiles = lodash.mergeWith(cnfg.profiles, layer.properties.profiles, (obj, src) => {
            if (lodash.isArray(obj) && lodash.isArray(src)) {
                const temp = JSONC.parse(JSONC.stringify(obj, null, ConfigConstants.INDENT));
                src.forEach((val, idx) => {
                    if (!temp.includes(val)) {
                        temp.splice(idx, 0, val);
                    }
                });
                return temp;
            }
        });

        layer.properties.defaults = lodash.merge(cnfg.defaults, layer.properties.defaults);

        for (const pluginName of (cnfg.plugins || [])) {
            if (layer.properties.plugins == null) {
                layer.properties.plugins = [pluginName];
            } else if (!layer.properties.plugins?.includes(pluginName)) {
                layer.properties.plugins.push(pluginName);
            }
        }

        if (cnfg.autoStore != null) {
            layer.properties.autoStore = cnfg.autoStore;
        }

        if (dryRun) { return layer; }
    }

    // _______________________________________________________________________
    /**
     * Finds the highest priority layer where a profile is stored.
     * @param profileName Profile name to search for
     * @returns User and global properties, or undefined if profile does not exist
     */
    public find(profileName: string): { user: boolean, global: boolean } {
        const profilePath = this.mConfig.api.profiles.getProfilePathFromName(profileName);
        for (const layer of this.mConfig.layers) {
            if (lodash.get(layer.properties, profilePath) != null) {
                return layer;
            }
        }
    }
}
