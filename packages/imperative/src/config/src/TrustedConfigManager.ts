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
import * as os from "os";
import * as path from "path";

/**
 * Callback that asks the user whether a directory containing a project config
 * file should be trusted. Must return true to trust the directory.
 */
export type TrustPromptFn = (dirPath: string) => boolean;

/**
 * Manages the list of directories from which project config files may be loaded.
 * The list is stored under the `trustedConfigDirs` key in `<cliHome>/settings/imperative.json`.
 */
export class TrustedConfigManager {
    /** Set to "1" or "true" to trust all directories */
    public static readonly ENV_ALLOW_UNTRUSTED = "ZOWE_CONFIG_ALLOW_UNTRUSTED_DIRS";

    /** Set to any value to allow loading project config from world-writable directories */
    public static readonly ENV_ALLOW_WORLD_WRITABLE = "ZOWE_CONFIG_ALLOW_WORLD_WRITABLE";

    private static readonly SETTINGS_KEY = "trustedConfigDirs";

    /**
     * Check whether a directory is writable by any user. Always false on Windows
     * or if the ZOWE_CONFIG_ALLOW_WORLD_WRITABLE environment variable is set.
     */
    public static isWorldWritable(dirPath: string): boolean {
        if (process.platform === "win32" || process.env[this.ENV_ALLOW_WORLD_WRITABLE]) return false;
        try {
            return (fs.statSync(dirPath).mode & fs.constants.S_IWOTH) !== 0;
        } catch {
            return false;
        }
    }

    /**
     * Check whether a directory may be used to load project config files.
     * A directory is trusted if any of the following holds:
     *  1. CI environment variable is set, or ZOWE_CONFIG_ALLOW_UNTRUSTED_DIRS is "1" or "true"
     *  2. It is the current working directory or the project directory chosen by the caller
     *  3. It is inside the user's home directory
     *  4. It is in the trusted directory list
     *  5. The prompt function (if provided) returns true
     * @param dirPath Directory to check
     * @param cliHome Zowe CLI home directory containing the settings folder
     * @param promptFn Optional callback to ask the user for trust
     * @param startDir Project directory explicitly requested by the caller
     */
    public static isDirTrusted(dirPath: string, cliHome: string, promptFn?: TrustPromptFn, startDir?: string): boolean {
        const allowEnv = process.env[this.ENV_ALLOW_UNTRUSTED]?.toLowerCase();
        if (process.env.CI != null || allowEnv === "1" || allowEnv === "true") return true;

        const target = this.normalize(dirPath);
        if (target === this.normalize(process.cwd())) return true;
        if (startDir != null && target === this.normalize(startDir)) return true;

        const rel = path.relative(this.normalize(os.homedir()), target);
        if (rel === "" || !rel.startsWith("..") && !path.isAbsolute(rel)) return true;

        if (this.list(cliHome).some((d) => this.normalize(d) === target)) return true;

        return promptFn != null ? promptFn(dirPath) === true : false;
    }

    /** List trusted directories. */
    public static list(cliHome: string): string[] {
        const dirs = this.readSettings(cliHome)[this.SETTINGS_KEY];
        return Array.isArray(dirs) ? dirs.filter((d) => typeof d === "string") : [];
    }

    /** Add a directory to the trusted list. */
    public static add(cliHome: string, dirPath: string): void {
        const dirs = this.list(cliHome);
        const target = this.normalize(dirPath);
        if (dirs.some((d) => this.normalize(d) === target)) return;
        this.writeSettings(cliHome, { ...this.readSettings(cliHome), [this.SETTINGS_KEY]: [...dirs, target] });
    }

    /** Remove a directory from the trusted list. */
    public static remove(cliHome: string, dirPath: string): void {
        const target = this.normalize(dirPath);
        const dirs = this.list(cliHome).filter((d) => this.normalize(d) !== target);
        this.writeSettings(cliHome, { ...this.readSettings(cliHome), [this.SETTINGS_KEY]: dirs });
    }

    private static normalize(dirPath: string): string {
        const resolved = path.resolve(dirPath);
        try {
            return fs.realpathSync.native(resolved);
        } catch {
            return resolved;
        }
    }

    private static settingsFile(cliHome: string): string {
        return path.join(cliHome, "settings", "imperative.json");
    }

    private static readSettings(cliHome: string): Record<string, unknown> {
        try {
            return JSON.parse(fs.readFileSync(this.settingsFile(cliHome), "utf-8"));
        } catch {
            return {};
        }
    }

    private static writeSettings(cliHome: string, settings: Record<string, unknown>): void {
        const file = this.settingsFile(cliHome);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify(settings, null, 2));
    }
}
