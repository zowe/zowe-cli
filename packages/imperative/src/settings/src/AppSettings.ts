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

import * as DeepMerge from "deepmerge";
import { existsSync } from "fs";
import { ISettingsFile } from "./doc/ISettingsFile";
import { Logger } from "../../logger";
import { ISettingsFilePersistence } from "./persistance/ISettingsFilePersistence";
import { JSONSettingsFilePersistence } from "./persistance/JSONSettingsFilePersistence";
import { IO } from "../../io";
import { ImperativeError } from "../../error";

type SettingValue = false | string;

/**
 * This class represents settings for an Imperative CLI application that can be configured
 * by an end user by modifying a settings file. Settings are stored in {@link AppSettings#settings}
 * in a format specified by {@link ISettingsFile}.
 */
export class AppSettings {

    /**
     * Initialize
     * @param settingsFile The settings file to load from
     * @param defaults {@link ISettingsFile} Settings with default values
     */
    public static initialize(settingsFile: string, defaults: ISettingsFile): AppSettings {
        if (AppSettings.mInstance) {
            const {SettingsAlreadyInitialized} = require("./errors/index");

            throw new SettingsAlreadyInitialized();
        }

        const persistence = new JSONSettingsFilePersistence(settingsFile);

        let settings = {};
        try {
            Logger.getImperativeLogger().trace(`Attempting to load settings file: ${settingsFile}`);

            settings = persistence.read();
        } catch (up) {
            if (!existsSync(settingsFile)) {
                Logger.getImperativeLogger().trace("Executing missing file recovery.");
                IO.createDirsSyncFromFilePath(settingsFile);
                persistence.write(defaults);
            } else {
                Logger.getImperativeLogger().error("Unable to recover from load failure");
                Logger.getImperativeLogger().error(up.toString());

                throw up;
            }
        }

        const initialSettings = DeepMerge(defaults, settings);

        AppSettings.mInstance = new AppSettings(
            persistence,
            initialSettings,
        );

        Logger.getImperativeLogger().trace("Settings were loaded");

        Logger.getImperativeLogger().trace("Loaded Settings:");
        Logger.getImperativeLogger().trace(initialSettings as any);

        return AppSettings.mInstance;
    }

    /**
     * This is an internal reference to the static settings instance.
     */
    private static mInstance: AppSettings;
    /**
     * The settings loaded from the file specified in the constructor.
     */
    private readonly settings: ISettingsFile;
    private readonly persistence: ISettingsFilePersistence;

    /**
     *  Constructs a new settings object
     *
     * @param persistence
     * @param initial Initial settings object
     */
    constructor(persistence: ISettingsFilePersistence, initial: ISettingsFile) {
        this.persistence = persistence;

        this.settings = initial;
    }

    /**
     * Get the singleton instance of the app settings object that was initialized
     * within the {@link AppSettings.initialize} function.
     *
     * @returns A singleton AppSettings object
     *
     * @throws {@link SettingsNotInitialized} When the settings singleton has not been initialized.
     */
    public static get instance(): AppSettings {
        if (AppSettings.mInstance == null) {
            // Throw an error imported at runtime so that we minimize file that get included
            // on startup.
            const {SettingsNotInitialized} = require("./errors/index");
            throw new SettingsNotInitialized();
        }

        return AppSettings.mInstance;
    }

    /**
     * @returns true if the app settings have been initialized
     */
    public static get initialized(): boolean {
        return !(this.mInstance == null);
    }

    /**
     * Set a settings option and save it to the settings file.
     * @param namespace {@link ISettingsFile}
     * @param key Name of a setting option to set
     * @param value
     */
    public set(namespace: keyof ISettingsFile, key: string, value: SettingValue): void {
        this.settings[namespace][key] = value;

        this.flush();
    }

    /**
     * Get a value of settings option
     * @param namespace {@link ISettingsFile}
     * @param key Name of a setting option to set
     */
    public get(namespace: keyof ISettingsFile, key: string): SettingValue {
        if (this.settings[namespace]) {
            return this.settings[namespace][key];
        }
        throw new ImperativeError({msg: `Namespace ${namespace} does not exist`});
    }

    /**
     * Get a member of ISettingsFile of specified namespace
     * @param namespace
     */
    public getNamespace(namespace: keyof ISettingsFile) {
        return this.settings[namespace];
    }

    /**
     * Get settings
     */
    public getSettings(): ISettingsFile {
        return this.settings;
    }

    /**
     * Writes settings to the file
     */
    private flush() {
        try {
            this.persistence.write(this.settings);
        } catch (err) {
            Logger.getImperativeLogger().error("Unable to save settings");
            Logger.getImperativeLogger().error(err.toString());

            throw err;
        }
    }
}
