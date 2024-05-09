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

import * as JSONC from "comment-json";
import { ConfigConstants } from "../ConfigConstants";
import { IConfigProfile } from "../doc/IConfigProfile";
import { ConfigApi } from "./ConfigApi";

/**
 * API Class for manipulating config profiles.
 */
export class ConfigProfiles extends ConfigApi {

    // _______________________________________________________________________
    /**
     * Set a profile object at the location identified by the path
     * within the currently active layer.
     *
     * @param path The dotted path of the location in which to set the profile.
     * @param profile The JSON profile object to set into the specified location,
     */
    public set(path: string, profile: IConfigProfile): void {
        profile.properties = profile.properties || {};
        const layer = this.mConfig.layerActive();
        const segments: string[] = path.split(".");
        let p: any = layer.properties;
        for (let x = 0; x < segments.length; x++) {
            const segment = segments[x];
            if (p.profiles == null)
                p.profiles = {};
            if (p.profiles[segment] == null)
                p.profiles[segment] = { properties: {} };
            if (x === segments.length - 1)
                p.profiles[segment] = profile;
            p = p.profiles[segment];
        }
    }

    // _______________________________________________________________________
    /**
     * Get the profile object located at the specified location.
     *
     * @param path The dotted path of the location at which to set the profile.
     * @param mustExist If false, outer layer profile values will still be
     *        returned when the dotted path does not exist. Default is true.
     */
    public get(path: string, mustExist?: boolean): { [key: string]: string } {
        if (mustExist !== false && !this.exists(path))
            return null;
        return JSONC.parse(JSONC.stringify(this.buildProfile(path, this.mConfig.mProperties.profiles), null, ConfigConstants.INDENT));
    }

    // _______________________________________________________________________
    /**
     * Reports whether or not a profile exists at the specified location.
     *
     * @param path The dotted path of desired location.
     *
     * @returns True if a profile exists. False otherwise.
     */
    public exists(path: string): boolean {
        return (this.findProfile(path, this.mConfig.mProperties.profiles) != null);
    }

    // _______________________________________________________________________
    /**
     * Set the default value for the specified type of profile within
     * the currently active layer.
     *
     * @param profileType The name of the desired type of profile (like zosmf).
     * @param value The dotted node path to the profile (like ca32.zosmf).
     */
    public defaultSet(profileType: string, value: string) {
        this.mConfig.layerActive().properties.defaults[profileType] = value;
    }

    // _______________________________________________________________________
    /**
     * Get the profile contents for the default profile of the specified type
     * of profile within the currently active layer.
     *
     * @param profileType The name of the desired type of profile (like zosmf).
     *
     * @returns An object containing the desired profile,
     *          for example {"host": "lpar.your.domain.net", port: 1234}
     */
    public defaultGet(profileType: string): { [key: string]: string } {
        const dflt = this.mConfig.mProperties.defaults[profileType];
        return dflt != null ? this.get(dflt) : null;
    }

    // _______________________________________________________________________
    /**
     * Expands a short path into an expanded path.
     *
     * @param shortPath The short path.
     *
     * @returns The expanded path.
     *
     * @deprecated Please use getProfilePathFromName
     */
    public expandPath(shortPath: string): string {
        return this.getProfilePathFromName(shortPath);
    }

    // _______________________________________________________________________
    /**
     * Expands a short path into an expanded path.
     *
     * @param shortPath The short path.
     *
     * @returns The expanded path.
     */
    public getProfilePathFromName(shortPath: string): string {
        return shortPath.replace(/(^|\.)/g, "$1profiles.");
    }

    // _______________________________________________________________________
    /**
     * Obtain the profile name (either nested or not) based on a property path.
     *
     * @param path The property path.
     *
     * @returns The corresponding profile name.
     *
     * @note This may be useful for supporting token authentication in a nested configuration
     *
     */
    public getProfileNameFromPath(path: string): string {
        let profileName = "";
        const segments = path.split(".");
        for (let i = 0; i < segments.length; i++) {
            const p = segments[i];
            if (p === "properties") break;
            if (i%2) {
                profileName += profileName.length > 0 ? "." + p : p;
            }
        }
        return profileName;
    }

    // _______________________________________________________________________
    /**
     * Build the set of properties contained within a set of nested profiles.
     *
     * @param path The dotted path of desired location.
     * @param profiles A set of nested profile objects.
     *
     * @returns The desired profile object. An empty object if profiles is empty.
     */
    public buildProfile(path: string, profiles: { [key: string]: IConfigProfile }): { [key: string]: string } {
        const segments: string[] = path.split(".");
        let properties = {};
        for (const [n, p] of Object.entries(profiles)) {
            if (segments[0] === n) {
                properties = { ...properties, ...p.properties };
                if (segments.length > 1) {
                    segments.splice(0, 1);
                    properties = { ...properties, ...this.buildProfile(segments.join("."), p.profiles) };
                }
                break;
            }
        }
        return properties;
    }

    // _______________________________________________________________________
    /**
     * Find a profile at a specified location from within a set of
     * nested profiles.
     *
     * @param path The dotted path of desired location.
     * @param profiles A set of nested profile objects.
     *
     * @returns The profile object that was found. null if not found.
     */
    private findProfile(path: string, profiles: { [key: string]: IConfigProfile }): IConfigProfile {
        const segments: string[] = path.split(".");
        for (const [n, p] of Object.entries(profiles)) {
            if (segments.length === 1 && segments[0] === n) {
                return p;
            } else if (segments[0] === n && p.profiles != null) {
                segments.splice(0, 1);
                return this.findProfile(segments.join("."), p.profiles);
            }
        }
        return null;
    }
}
