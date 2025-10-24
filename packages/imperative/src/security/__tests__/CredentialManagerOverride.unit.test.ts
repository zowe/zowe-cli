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

import * as fsExtra from "fs-extra";
import * as path from "path";

import { CredentialManagerOverride } from "../src/CredentialManagerOverride";
import { ICredentialManagerNameMap } from "../src/doc/ICredentialManagerNameMap";
import { ImperativeConfig } from "../../utilities";
import { ImperativeError } from "../../error";
import { ISettingsFile } from "../../settings/src/doc/ISettingsFile";
import { EventOperator, EventUtils } from "../../events";
import { PersistenceLevel } from "../src/doc/IDefaultCredentialManagerOptions";


describe("CredentialManagerOverride", () => {
    let mockImpConfig: any;
    let expectedSettings: any;

    beforeEach(() => {
        // pretend that ImperativeConfig has been initialized
        mockImpConfig = {
            cliHome: __dirname
        };
        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue(mockImpConfig);
        jest.spyOn(EventUtils, "validateAppName").mockImplementation(jest.fn());
        jest.spyOn(EventOperator, "getZoweProcessor").mockReturnValue({emitZoweEvent: jest.fn()} as any);

        expectedSettings = {
            fileName: path.join(mockImpConfig.cliHome, "settings", "imperative.json"),
            json: {
                "overrides": {
                    "CredentialManager": CredentialManagerOverride.DEFAULT_CRED_MGR_NAME,
                },
                "CredentialManagerOptions": {}
            } as ISettingsFile
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getKnownCredMgrs", () => {
        it("should return our array of cred managers", () => {
            const expectedCredMgrs: ICredentialManagerNameMap[] = [
                {
                    "credMgrDisplayName": CredentialManagerOverride.DEFAULT_CRED_MGR_NAME
                },
                {
                    "credMgrDisplayName": "Secrets for Kubernetes",
                    "credMgrPluginName": "@zowe/secrets-for-kubernetes-for-zowe-cli",
                    "credMgrZEName": "Zowe.secrets-for-kubernetes"
                },
                {
                    "credMgrDisplayName": false
                },
            ];
            const receivedCredMgrs = CredentialManagerOverride.getKnownCredMgrs();
            expect(receivedCredMgrs).toEqual(expectedCredMgrs);
        });
    });

    describe("getCurrentCredMgr", () => {
        it("should return the current credential manager", () => {
            const getSettingsFileJsonSpy = jest.spyOn(CredentialManagerOverride as any, "getSettingsFileJson");
            getSettingsFileJsonSpy.mockReturnValue({json: {overrides: { CredentialManager: "test"}}});
            const current = CredentialManagerOverride.getCurrentCredMgr();
            expect(current).toEqual("test");
        });
        it("should return false if the credential management is disabled", () => {
            const getSettingsFileJsonSpy = jest.spyOn(CredentialManagerOverride as any, "getSettingsFileJson");
            getSettingsFileJsonSpy.mockReturnValue({json: {overrides: { CredentialManager: false}}});
            const current = CredentialManagerOverride.getCurrentCredMgr();
            expect(current).toBe(false);
        });
        it("should return the default credential manager if settings file does not exist", () => {
            const getSettingsFileJsonSpy = jest.spyOn(CredentialManagerOverride as any, "getSettingsFileJson");
            getSettingsFileJsonSpy.mockImplementation(() => {throw "test";});
            const current = CredentialManagerOverride.getCurrentCredMgr();
            expect(current).toEqual(CredentialManagerOverride.DEFAULT_CRED_MGR_NAME);
        });
    });

    describe("getCredMgrInfoByDisplayName", () => {
        it("should return null when name is not found", () => {
            const credMgrInfo = CredentialManagerOverride.getCredMgrInfoByDisplayName("NotACredMgrName");
            expect(credMgrInfo).toBe(null);
        });

        it("should return a plugin and extension for a valid name", () => {
            const credMgrInfo = CredentialManagerOverride.getCredMgrInfoByDisplayName("Secrets for Kubernetes");
            expect(credMgrInfo).not.toBe(null);
            expect(credMgrInfo?.credMgrPluginName).toEqual("@zowe/secrets-for-kubernetes-for-zowe-cli");
            expect(credMgrInfo?.credMgrZEName).toEqual("Zowe.secrets-for-kubernetes");
        });
    });

    describe("getCredMgrInfoByPlugin", () => {
        it("should return null when plugin is not found", () => {
            const credMgrInfo = CredentialManagerOverride.getCredMgrInfoByDisplayName("NotAPlugin");
            expect(credMgrInfo).toBe(null);
        });

        it("should return a displayName and extension for a valid plugin", () => {
            const credMgrInfo = CredentialManagerOverride.
                getCredMgrInfoByPlugin("@zowe/secrets-for-kubernetes-for-zowe-cli");
            expect(credMgrInfo).not.toBe(null);
            expect(credMgrInfo?.credMgrDisplayName).toEqual("Secrets for Kubernetes");
            expect(credMgrInfo?.credMgrZEName).toEqual("Zowe.secrets-for-kubernetes");
        });
    });

    describe("getCredMgrInfoByZEExt", () => {
        it("should return null when extension is not found", () => {
            const credMgrInfo = CredentialManagerOverride.getCredMgrInfoByDisplayName("NotAnExtension");
            expect(credMgrInfo).toBe(null);
        });

        it("should return a displayName and plugin for a valid extension", () => {
            const credMgrInfo = CredentialManagerOverride.
                getCredMgrInfoByZEExt("Zowe.secrets-for-kubernetes");
            expect(credMgrInfo).not.toBe(null);
            expect(credMgrInfo?.credMgrDisplayName).toEqual("Secrets for Kubernetes");
            expect(credMgrInfo?.credMgrPluginName).toEqual("@zowe/secrets-for-kubernetes-for-zowe-cli");
        });
    });

    describe("getSettingsFileJson", () => {
        it("should return valid imperative.json file content", () => {
            const expectedSettings: any = {
                fileName: path.join(mockImpConfig.cliHome, "settings", "imperative.json"),
                json: {
                    "overrides": {
                        "CredentialManager": CredentialManagerOverride.DEFAULT_CRED_MGR_NAME
                    }
                } as ISettingsFile
            };

            // make readJsonSync return what we want
            const readJsonSync = jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });

            /* Use CredentialManagerOverride["getSettingsFileJson"]() instead of
             * CredentialManagerOverride.getSettingsFileJson() so that we can call a private function.
             */
            const receivedSettings: any = CredentialManagerOverride["getSettingsFileJson"]();
            expect(readJsonSync).toHaveBeenCalledWith(expectedSettings.fileName);
            expect(receivedSettings).toEqual(expectedSettings);
        });

        it("should throw an error due to error in readJsonSync", () => {
            // Force an error when reading our settings
            const readJsonErrText = "Pretend that readJsonSync threw an error";
            const readJsonSync = jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                throw new Error(readJsonErrText);
            });

            /* Use CredentialManagerOverride["getSettingsFileJson"]() instead of
             * CredentialManagerOverride.getSettingsFileJson() so that we can call a private function.
             */
            let thrownErr: any;
            let receivedSettings: any;
            try {
                receivedSettings = CredentialManagerOverride["getSettingsFileJson"]();
            } catch (err) {
                thrownErr = err;
            }
            expect(readJsonSync).toHaveBeenCalledWith(expectedSettings.fileName);
            expect(receivedSettings).toBeUndefined();
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(readJsonErrText);
        });

        it("should throw an error when no settings.json.overrides.CredentialManager property exists", () => {
            // replace good CredentialManager property with a bogus property
            delete expectedSettings.json.overrides.CredentialManager;
            expectedSettings.json.overrides.bogusProp = "Bogus value";

            // make readJsonSync return what we want
            const readJsonSync = jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });

            /* Use CredentialManagerOverride["getSettingsFileJson"]() instead of
             * CredentialManagerOverride.getSettingsFileJson() so that we can call a private function.
             */
            let thrownErr: any;
            let receivedSettings: any;
            try {
                receivedSettings = CredentialManagerOverride["getSettingsFileJson"]();
            } catch (err) {
                thrownErr = err;
            }
            expect(readJsonSync).toHaveBeenCalledWith(expectedSettings.fileName);
            expect(receivedSettings).toBeUndefined();
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                "The property key 'overrides.CredentialManager' does not exist in settings file = " +
                expectedSettings.fileName
            );
        });

        it("should throw an error when no settings.json.overrides property exists", () => {
            // replace good CredentialManager property with a bogus property
            delete expectedSettings.json.overrides;

            // make readJsonSync return what we want
            const readJsonSync = jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });

            /* Use CredentialManagerOverride["getSettingsFileJson"]() instead of
             * CredentialManagerOverride.getSettingsFileJson() so that we can call a private function.
             */
            let thrownErr: any;
            let receivedSettings: any;
            try {
                receivedSettings = CredentialManagerOverride["getSettingsFileJson"]();
            } catch (err) {
                thrownErr = err;
            }
            expect(readJsonSync).toHaveBeenCalledWith(expectedSettings.fileName);
            expect(receivedSettings).toBeUndefined();
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                "The property key 'overrides.CredentialManager' does not exist in settings file = " +
                expectedSettings.fileName
            );
        });

        it("should throw an error when no settings.json property exists", () => {
            // replace good CredentialManager property with a bogus property
            delete expectedSettings.json;

            // make readJsonSync return what we want
            const readJsonSync = jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });

            /* Use CredentialManagerOverride["getSettingsFileJson"]() instead of
             * CredentialManagerOverride.getSettingsFileJson() so that we can call a private function.
             */
            let thrownErr: any;
            let receivedSettings: any;
            try {
                receivedSettings = CredentialManagerOverride["getSettingsFileJson"]();
            } catch (err) {
                thrownErr = err;
            }
            expect(readJsonSync).toHaveBeenCalledWith(expectedSettings.fileName);
            expect(receivedSettings).toBeUndefined();
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                "The property key 'overrides.CredentialManager' does not exist in settings file = " +
                expectedSettings.fileName
            );
        });
    });

    describe("recordCredMgrInConfig", () => {
        const knownCredMgr = CredentialManagerOverride.getKnownCredMgrs()[1];
        const knownCredMgrDisplayNm = knownCredMgr.credMgrDisplayName as string;

        it("should throw an error when trying to override with an unknown credMgr", () => {
            const unknownCredMgrName = "A credential manager name that is not known";

            let thrownErr: any;
            try {
                CredentialManagerOverride.recordCredMgrInConfig(unknownCredMgrName);
            } catch (err) {
                thrownErr = err;
            }

            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                `The credential manager name '${unknownCredMgrName}' is an unknown credential manager. ` +
                "The previous credential manager will NOT be overridden. Valid credential managers are:"
            );
        });

        it("should throw an error when getSettingsFileJson fails", () => {
            // Force an error when reading our settings
            const readJsonErrText = "Pretend that readJsonSync threw an error";
            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                throw new Error(readJsonErrText);
            });

            // spy with 'any' to confirm that a private function has been called
            const getSettingsFileJsonSpy = jest.spyOn(CredentialManagerOverride as any, "getSettingsFileJson");

            let thrownErr: any;
            try {
                CredentialManagerOverride.recordCredMgrInConfig(knownCredMgrDisplayNm);
            } catch (err) {
                thrownErr = err;
            }

            expect(getSettingsFileJsonSpy).toHaveBeenCalledTimes(1);
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                `Due to error in settings file, unable to override the credential manager with '${knownCredMgrDisplayNm}'`
            );
            expect(thrownErr.message).toContain(
                "Reason: Unable to read settings file = " + expectedSettings.fileName
            );
            expect(thrownErr.message).toContain(`Reason: ${readJsonErrText}`);
        });

        it("should throw an override error due to error in writeJsonSync", () => {
            // make readJsonSync return what we want
            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });

            // Force an error when writing our settings
            const writeJsonErrText = "Pretend that writeJsonSync threw an error";
            jest.spyOn(fsExtra, "writeJsonSync").mockImplementation(() => {
                throw new Error(writeJsonErrText);
            });

            let thrownErr: ImperativeError = null as any;
            try {
                CredentialManagerOverride.recordCredMgrInConfig(knownCredMgrDisplayNm);
            } catch (err) {
                thrownErr = err;
            }
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                `Unable to write settings file = ${expectedSettings.fileName}`
            );
            expect(thrownErr.message).toContain(`Reason: ${writeJsonErrText}`);
        });

        it("should successfully record a new cred manager", () => {
            let writtenJsonSettings: ISettingsFile = {} as any;
            // make readJsonSync and writeJsonSync return what we want
            const readJsonSync = jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });
            const writeJsonSync = jest.spyOn(fsExtra, "writeJsonSync")
                .mockImplementation((_fileName, jsonSettings, _options) => {
                    writtenJsonSettings = jsonSettings;
                });

            CredentialManagerOverride.recordCredMgrInConfig(knownCredMgrDisplayNm);

            expect(readJsonSync).toHaveBeenCalledWith(expectedSettings.fileName);
            expect(writeJsonSync).toHaveBeenCalledTimes(1);
            expect(writtenJsonSettings.overrides.CredentialManager).toEqual(knownCredMgrDisplayNm);
            expect(writtenJsonSettings.credentialManagerOptions).toEqual({});
        });

        it("should persist credential manager options when provided", () => {
            const customOptions = { persist: PersistenceLevel.Enterprise, customOption: "test" };
            let writtenJsonSettings: ISettingsFile = {} as any;

            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });
            jest.spyOn(fsExtra, "writeJsonSync")
                .mockImplementation((_fileName, jsonSettings, _options) => {
                    writtenJsonSettings = jsonSettings;
                });

            CredentialManagerOverride.recordCredMgrInConfig(knownCredMgrDisplayNm, customOptions);

            expect(writtenJsonSettings.overrides.CredentialManager).toEqual(knownCredMgrDisplayNm);
            expect(writtenJsonSettings.credentialManagerOptions).toEqual(customOptions);
        });
    });

    describe("recordDefaultCredMgrInConfig", () => {
        it("should throw a replacement error due to error in getSettingsFileJson", () => {
            // Force an error when reading our settings
            const readJsonErrText = "Pretend that readJsonSync threw an error";
            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                throw new Error(readJsonErrText);
            });

            // spy with 'any' to confirm that a private function has been called
            const getSettingsFileJsonSpy = jest.spyOn(CredentialManagerOverride as any, "getSettingsFileJson");

            const credMgrToReplace = "CurrentPluginCredMgr";
            let thrownErr: any;
            try {
                CredentialManagerOverride.recordDefaultCredMgrInConfig(credMgrToReplace);
            } catch (err) {
                thrownErr = err;
            }

            expect(getSettingsFileJsonSpy).toHaveBeenCalledTimes(1);
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                `Due to error in settings file, unable to replace the credential manager named '${credMgrToReplace}'`
            );
            expect(thrownErr.message).toContain(
                "Reason: Unable to read settings file = " + expectedSettings.fileName
            );
            expect(thrownErr.message).toContain(`Reason: ${readJsonErrText}`);
        });

        it("should fail when the plugin is not the current cred mgr", () => {
            // make readJsonSync return what we want
            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });

            // spy with 'any' to confirm that a private function has been called
            const getSettingsFileJsonSpy = jest.spyOn(CredentialManagerOverride as any, "getSettingsFileJson");

            const credMgrToReplace = "CurrentPluginCredMgr";
            let thrownErr: any;
            try {
                CredentialManagerOverride.recordDefaultCredMgrInConfig(credMgrToReplace);
            } catch (err) {
                thrownErr = err;
            }

            expect(getSettingsFileJsonSpy).toHaveBeenCalledTimes(1);
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                `An attempt to revert Credential Manager = '${credMgrToReplace}' to the default Credential Manager`
            );
            expect(thrownErr.message).toContain(
                `failed. The value '${credMgrToReplace}' must be the current value in settings file = ` +
                `'${expectedSettings.fileName}'. Instead, the current value is '` +
                `${expectedSettings.json.overrides.CredentialManager}'. ` +
                `The current Credential Manager has not been replaced.`
            );
        });

        it("should throw a replacement error due to error in writeJsonSync", () => {
            // make readJsonSync return what we want
            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });

            // Force an error when writing our settings
            const writeJsonErrText = "Pretend that writeJsonSync threw an error";
            jest.spyOn(fsExtra, "writeJsonSync").mockImplementation(() => {
                throw new Error(writeJsonErrText);
            });

            // spy with 'any' to confirm that a private function has been called
            const getSettingsFileJsonSpy = jest.spyOn(CredentialManagerOverride as any, "getSettingsFileJson");

            // set the current cred mgr to the cred mgr that we want to replace
            const credMgrToReplace = "CurrentPluginCredMgr";
            expectedSettings.json.overrides.CredentialManager = credMgrToReplace;

            let thrownErr: any;
            try {
                CredentialManagerOverride.recordDefaultCredMgrInConfig(credMgrToReplace);
            } catch (err) {
                thrownErr = err;
            }

            expect(getSettingsFileJsonSpy).toHaveBeenCalledTimes(1);
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                "Unable to write settings file = " + expectedSettings.fileName
            );
            expect(thrownErr.message).toContain(`Reason: ${writeJsonErrText}`);
        });

        it("should restore the default credential manager and clear options", () => {
            const customOptions = { persist: PersistenceLevel.LocalMachine };
            const credMgrToReplace = CredentialManagerOverride.getKnownCredMgrs()[1].credMgrDisplayName as string;
            expectedSettings.json.overrides.CredentialManager = credMgrToReplace;
            expectedSettings.json.credentialManagerOptions = { ...customOptions };

            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });
            const writeJsonSync = jest.spyOn(fsExtra, "writeJsonSync").mockImplementation(() => undefined);

            CredentialManagerOverride.recordDefaultCredMgrInConfig(credMgrToReplace);

            expect(writeJsonSync).toHaveBeenCalledWith(
                expectedSettings.fileName,
                expect.objectContaining({
                    overrides: expect.objectContaining({
                        CredentialManager: CredentialManagerOverride.DEFAULT_CRED_MGR_NAME
                    }),
                    credentialManagerOptions: {}
                }),
                {spaces: 2}
            );
        });
    });

    describe("updateCredentialManagerOptions", () => {
        it("should write the provided options to the settings file", () => {
            const newOptions = { persist: PersistenceLevel.LocalMachine, customOption: "value" };
            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });
            const writeJsonSync = jest.spyOn(fsExtra, "writeJsonSync").mockImplementation(() => undefined);

            CredentialManagerOverride.updateCredentialManagerOptions(newOptions);

            expect(writeJsonSync).toHaveBeenCalledWith(
                expectedSettings.fileName,
                expect.objectContaining({
                    credentialManagerOptions: newOptions
                }),
                {spaces: 2}
            );
        });
    });

    describe("getCredentialManagerOptions", () => {
        it("should return credential manager options from the settings file", () => {
            const storedOptions = { persist: PersistenceLevel.LocalMachine };
            expectedSettings.json.credentialManagerOptions = storedOptions;
            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                return expectedSettings.json;
            });

            const retrievedOptions = CredentialManagerOverride.getCredentialManagerOptions();

            expect(retrievedOptions).toEqual(storedOptions);
        });

        it("should return an empty object when settings cannot be loaded", () => {
            jest.spyOn(fsExtra, "readJsonSync").mockImplementation(() => {
                throw new Error("file missing");
            });

            const retrievedOptions = CredentialManagerOverride.getCredentialManagerOptions();

            expect(retrievedOptions).toEqual({});
        });
    });
});
