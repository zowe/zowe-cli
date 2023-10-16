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

import { ISettingsFile } from "../doc/ISettingsFile";
import * as AppSettingsModule from "../AppSettings";

/*
 * This file mocks the AppSettings class and tries to keep some of the logic in tact.
 * Almost all methods of app settings are now a mock object so you can spy on the class.
 */

// Define the constructor of the mock app settings class
function MockAppSettings() {
    this.settings = {
        overrides: {
            CredentialManager: false
        }
    } as ISettingsFile;

    // Enforces that the type matches that of the calling class
    const setFn: typeof AppSettingsModule.AppSettings.prototype.set = (
        namespace: keyof ISettingsFile,
        override: keyof ISettingsFile["overrides"],
        value: string | false
    ) => {
        this.settings.overrides[override] = value;
        return new Promise((resolve) => {
            resolve(undefined);
        });
    };
    this.set = jest.fn(setFn);

    const getFn: typeof AppSettingsModule.AppSettings.prototype.get = (
        namespace: keyof ISettingsFile,
        override: keyof ISettingsFile["overrides"]
    ) => {
        return this.settings.overrides[override];
    };
    this.get = jest.fn(getFn);

    const getNamespaceFn: typeof AppSettingsModule.AppSettings.prototype.getNamespace = (
        namespace: keyof ISettingsFile,
    ) => {
        return this.settings[namespace];
    };
    this.getNamespace = jest.fn(getNamespaceFn);

    const getSettingsFn: typeof AppSettingsModule.AppSettings.prototype.getSettings = (
    ) => {
        return this.settings;
    };
    this.getSettings = jest.fn(getSettingsFn);
}

// Mock the constructor and have Settings be the instance
const AppSettings: any = jest.fn(MockAppSettings);

// Define the static mInstance private variable
AppSettings.mInstance = null;

// Define the initialize method mock and implementation
AppSettings.initialize = jest.fn(() => {
    if (AppSettings.mInstance != null) {
        throw new Error("AppSettings was already initialized. If this has changed please alter the mock logic");
    }

    AppSettings.mInstance = new AppSettings();

    return AppSettings.mInstance;
});

// Define the instance getter property and implementation
Object.defineProperty(AppSettings, "instance", {
    configurable: true,
    get: () => {
        if (AppSettings.mInstance == null) {
            throw new Error("AppSettings should be initialized first. If this has changed please alter the mock logic");
        }

        return AppSettings.mInstance;
    }
});

// Export the mocked settings object :)
exports.AppSettings = AppSettings;
