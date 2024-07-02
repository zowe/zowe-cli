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

jest.mock("jsonfile");

import * as fs from "fs";
import * as fsExtra from "fs-extra";
import * as jsonfile from "jsonfile";
import { CredentialManagerFactory } from "../..";
import { ConvertV1Profiles } from "../";
import { ConvertMsgFmt } from "../src/doc/IConvertV1Profiles";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { ImperativeError } from "../../error/src/ImperativeError";
import { keyring } from "@zowe/secrets-for-zowe-sdk";
import { Logger } from "../../logger/src/Logger";
import { LoggingConfigurer } from "../../imperative/src/LoggingConfigurer";
import { V1ProfileRead } from "../../profiles";
import { ConfigSchema } from "../../config/src/ConfigSchema";
import { AppSettings } from "../../settings/src/AppSettings";
import { CredentialManagerOverride } from "../../security/src/CredentialManagerOverride";
import { ProfileInfo } from "../src/ProfileInfo";
import { OverridesLoader } from "../../imperative/src/OverridesLoader";

jest.mock("../../imperative/src/OverridesLoader");

describe("ConvertV1Profiles tests", () => {
    const oldScsPluginNm = "@zowe/secure-credential-store-for-zowe-cli";
    const profileDir = "/fake/path/to/profiles/";
    const appName = "zowe";

    beforeAll(() => {
        // do not attempt to actually log any errors
        jest.spyOn(Logger, "getImperativeLogger").mockReturnValue({
            error: jest.fn()
        } as any);
    });

    describe("convert", () => {
        let isConversionNeededSpy: any;
        let replaceOldCredMgrOverrideSpy: any;
        let initCredMgrSpy: any;
        let moveV1ProfilesToConfigFileSpy: any;
        let deleteV1ProfilesSpy: any;

        beforeAll(() => {
            // use "any" so that we can call private functions
            isConversionNeededSpy = jest.spyOn(ConvertV1Profiles as any, "isConversionNeeded");
            replaceOldCredMgrOverrideSpy = jest.spyOn(ConvertV1Profiles as any, "replaceOldCredMgrOverride");
            initCredMgrSpy = jest.spyOn(ConvertV1Profiles as any, "initCredMgr");
            moveV1ProfilesToConfigFileSpy = jest.spyOn(ConvertV1Profiles as any, "moveV1ProfilesToConfigFile");
            deleteV1ProfilesSpy = jest.spyOn(ConvertV1Profiles as any, "deleteV1Profiles");

            // cliHome is a getter property, so mock the property.
            Object.defineProperty(ImperativeConfig.instance, "cliHome", {
                configurable: true,
                get: jest.fn(() => {
                    return "/fake/cliHome";
                })
            });
        });

        beforeEach(() => {
            // functions called by convert which we just want to confirm have been called.
            replaceOldCredMgrOverrideSpy.mockReturnValue(void 0);
            initCredMgrSpy.mockResolvedValue(Promise.resolve());
            moveV1ProfilesToConfigFileSpy.mockResolvedValue(Promise.resolve());
            deleteV1ProfilesSpy.mockResolvedValue(Promise.resolve());
        });

        afterEach(() => {
            jest.clearAllMocks();   // clear our spies usage counts
        });

        it("should complete a conversion when all utility functions work", async () => {
            isConversionNeededSpy.mockReturnValueOnce(true);

            // call the function that we want to test
            await ConvertV1Profiles.convert({
                deleteV1Profs: true
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(replaceOldCredMgrOverrideSpy).toHaveBeenCalled();
            expect(initCredMgrSpy).toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).toHaveBeenCalled();
        });

        it("should report that CLI must uninstall plugin when called with ProfileInfo", async () => {
            isConversionNeededSpy.mockReturnValueOnce(true);

            // Ensure that the old SCS plugin name is populated in the convert result
            replaceOldCredMgrOverrideSpy.mockImplementation(() => {
                ConvertV1Profiles["convertResult"].v1ScsPluginName = oldScsPluginNm;
            });

            // call the function that we want to test
            const profInfo = new ProfileInfo(appName);
            await ConvertV1Profiles.convert({
                deleteV1Profs: true,
                profileInfo : profInfo
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(replaceOldCredMgrOverrideSpy).toHaveBeenCalled();
            expect(initCredMgrSpy).toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).toHaveBeenCalled();

            /* The following line is a swell debug tool when a code block,
             * which is trying to match lines of result messages (like the block below),
             * does not get the results that it expects.
             *
            console.log("convertResult:\n " + JSON.stringify(ConvertV1Profiles["convertResult"], null, 2));
            */

            let numMsgsFound = 0;
            for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE &&
                    nextMsg.msgText.includes(
                        `The obsolete plug-in ${oldScsPluginNm} should be uninstalled because the SCS is now ` +
                        `embedded within the Zowe clients. Zowe CLI plugins can only be uninstalled by the CLI. ` +
                        `Use the command 'zowe plugins uninstall ${oldScsPluginNm}'.`
                    )
                ) {
                    numMsgsFound++;
                }
            }
            expect(numMsgsFound).toEqual(1);
        });

        it("should not delete profiles when asked not to delete", async () => {
            isConversionNeededSpy.mockReturnValueOnce(true);

            // call the function that we want to test
            await ConvertV1Profiles.convert({
                deleteV1Profs: false
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(replaceOldCredMgrOverrideSpy).toHaveBeenCalled();
            expect(initCredMgrSpy).toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).not.toHaveBeenCalled();
        });

        it("should skip conversion and not delete profiles", async () => {
            isConversionNeededSpy.mockReturnValueOnce(false);

            // call the function that we want to test
            await ConvertV1Profiles.convert({
                deleteV1Profs: false
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(replaceOldCredMgrOverrideSpy).not.toHaveBeenCalled();
            expect(initCredMgrSpy).not.toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).not.toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).not.toHaveBeenCalled();
        });

        it("should skip conversion but still delete profiles", async () => {
            isConversionNeededSpy.mockReturnValueOnce(false);

            // call the function that we want to test
            await ConvertV1Profiles.convert({
                deleteV1Profs: true
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(replaceOldCredMgrOverrideSpy).not.toHaveBeenCalled();
            expect(initCredMgrSpy).not.toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).not.toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).toHaveBeenCalled();
        });

        it("should catch an unexpected exception", async () => {
            const fakeErrMsg = "A message from a fake exception";
            isConversionNeededSpy.mockImplementation(() => {
                throw new Error(fakeErrMsg);
            });

            // call the function that we want to test
            await ConvertV1Profiles.convert({
                deleteV1Profs: true
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(replaceOldCredMgrOverrideSpy).not.toHaveBeenCalled();
            expect(initCredMgrSpy).not.toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).not.toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).not.toHaveBeenCalled();

            let numErrMsgsFound = 0;
            for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE &&
                    (nextMsg.msgText.includes("Encountered the following error while trying to convert V1 profiles:") ||
                     nextMsg.msgText.includes(fakeErrMsg)))
                {
                    numErrMsgsFound++;
                }
            }
            expect(numErrMsgsFound).toEqual(3);
        });
    }); // end convert

    describe("private functions", () => {
        let loggerSpy: any;
        let mockSecureLoad: any;
        function setCredMgrState(desiredState: string): void {
            if (desiredState == "works") {
                mockSecureLoad = jest.fn().mockReturnValue("\"area51\"");
            } else {
                mockSecureLoad = jest.fn().mockReturnValue(null);
            }

            jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue({
                load: mockSecureLoad
            } as any);
        }

        beforeAll(() => {
            jest.restoreAllMocks(); // put spies back to original app implementation

            // do not attempt to actually log any errors
            loggerSpy = jest.spyOn(Logger, "getImperativeLogger").mockReturnValue({
                error: jest.fn()
            } as any);
        });

        beforeEach(() => {
            // create the result normally created by the public function convert()
            ConvertV1Profiles["convertResult"] = {
                msgs: [],
                v1ScsPluginName: null,
                credsWereMigrated: true,
                cfgFilePathNm: ConvertV1Profiles["noCfgFilePathNm"],
                numProfilesFound: 0,
                profilesConverted: {},
                profilesFailed: []
            };
        });

        afterEach(() => {
            jest.clearAllMocks();   // clear our spies usage counts
        });

        describe("isConversionNeeded", () => {
            it("should return false if a client config exists", async () => {
                // Pretend that we have a zowe config.
                Object.defineProperty(ImperativeConfig.instance, "config", {
                    configurable: true,
                    get: jest.fn(() => {
                        return {
                            exists: true
                        };
                    })
                });

                // call the function that we want to test
                // using class["name"] notation because it is a private static function
                const convNeeded = await ConvertV1Profiles["isConversionNeeded"]();

                expect(convNeeded).toEqual(false);
                let numErrMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE &&
                        nextMsg.msgText.includes(
                            "Did not convert any V1 profiles because a current Zowe client configuration was found"
                        ))
                    {
                        numErrMsgsFound++;
                    }
                }
                expect(numErrMsgsFound).toEqual(1);
            });

            it("should return false if we find no V1 profiles", async () => {
                // Pretend that we have no zowe config.
                Object.defineProperty(ImperativeConfig.instance, "config", {
                    configurable: true,
                    get: jest.fn(() => {
                        return {
                            exists: false
                        };
                    })
                });

                // pretend that we have no old V1 profiles
                const getOldProfileCountSpy = jest.spyOn(
                    ConvertV1Profiles as any, "getOldProfileCount")
                    .mockReturnValueOnce(0);

                // call the function that we want to test
                const convNeeded = await ConvertV1Profiles["isConversionNeeded"]();

                expect(getOldProfileCountSpy).toHaveBeenCalled();
                expect(convNeeded).toEqual(false);

                let numErrMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE &&
                        nextMsg.msgText.includes("Did not convert any V1 profiles because no V1 profiles were found")
                    ){
                        numErrMsgsFound++;
                    }
                }
                expect(numErrMsgsFound).toEqual(1);
            });

            it("should return false if no profiles directory exists", async () => {
                // Pretend that we have no zowe config.
                Object.defineProperty(ImperativeConfig.instance, "config", {
                    configurable: true,
                    get: jest.fn(() => {
                        return {
                            exists: false
                        };
                    })
                });

                // pretend that an error occurred because the profiles directory did not exist
                ConvertV1Profiles["profilesRootDir"] = profileDir;
                const noDirError = new ImperativeError({
                    additionalDetails: { code: 'ENOENT' }
                } as any);
                const getOldProfileCountSpy = jest.spyOn(ConvertV1Profiles as any, "getOldProfileCount")
                    .mockImplementationOnce(() => { throw noDirError; });

                // call the function that we want to test
                const convNeeded = await ConvertV1Profiles["isConversionNeeded"]();

                expect(getOldProfileCountSpy).toHaveBeenCalled();
                expect(convNeeded).toEqual(false);

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE &&
                        nextMsg.msgText.includes(`Did not convert any V1 profiles because ` +
                        `no V1 profiles were found at ${profileDir}`)
                    ) {
                        numMsgsFound++;
                    }
                }
                expect(numMsgsFound).toEqual(1);
            });

            it("should return false if an IO error occurs while reading profiles", async () => {
                // Pretend that we have no zowe config.
                Object.defineProperty(ImperativeConfig.instance, "config", {
                    configurable: true,
                    get: jest.fn(() => {
                        return {
                            exists: false
                        };
                    })
                });

                // pretend that got an I/O error
                ConvertV1Profiles["profilesRootDir"] = profileDir;
                const ioErrMsg = "Fake I/O error occurred";
                const ioError = new ImperativeError({
                    msg: ioErrMsg
                });
                const getOldProfileCountSpy = jest.spyOn(ConvertV1Profiles as any, "getOldProfileCount")
                    .mockImplementationOnce(() => { throw ioError; });

                // call the function that we want to test
                const convNeeded = await ConvertV1Profiles["isConversionNeeded"]();

                expect(getOldProfileCountSpy).toHaveBeenCalled();
                expect(convNeeded).toEqual(false);

                let numErrMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE &&
                        (
                            nextMsg.msgText.includes(`Failed to get V1 profiles in "${profileDir}"`) ||
                            nextMsg.msgText.includes(ioErrMsg)
                        )
                    ) {
                        numErrMsgsFound++;
                    }
                }
                expect(numErrMsgsFound).toEqual(2);
            });

            it("should return true if we find some V1 profiles", async () => {
                // Pretend that we have no zowe config.
                Object.defineProperty(ImperativeConfig.instance, "config", {
                    configurable: true,
                    get: jest.fn(() => {
                        return {
                            exists: false
                        };
                    })
                });

                // pretend that we have 6 old V1 profiles
                const getOldProfileCountSpy = jest.spyOn(
                    ConvertV1Profiles as any, "getOldProfileCount")
                    .mockReturnValueOnce(6);

                // call the function that we want to test
                const convNeeded = await ConvertV1Profiles["isConversionNeeded"]();

                expect(getOldProfileCountSpy).toHaveBeenCalled();
                expect(convNeeded).toEqual(true);
            });
        }); // end isConversionNeeded

        describe("moveV1ProfilesToConfigFile", () => {

            it("should successfully move multiple v1 profiles to a config file", async () => {
                jest.spyOn(V1ProfileRead, "getAllProfileDirectories").mockReturnValueOnce(["fruit", "nut"]);
                jest.spyOn(V1ProfileRead, "getAllProfileNames")
                    .mockReturnValueOnce(["apple", "banana", "coconut"])
                    .mockReturnValueOnce(["almond", "brazil", "cashew"]);
                jest.spyOn(V1ProfileRead, "readMetaFile")
                    .mockReturnValueOnce({ defaultProfile: "apple" } as any)
                    .mockReturnValueOnce({ defaultProfile: "brazil" } as any);
                jest.spyOn(V1ProfileRead, "readProfileFile")
                    .mockReturnValueOnce({ color: "green", secret: "managed by A" })
                    .mockReturnValueOnce({ color: "yellow", secret: "managed by B" })
                    .mockReturnValueOnce({ color: "brown", secret: "managed by C" })
                    .mockReturnValueOnce({ unitPrice: 1 })
                    .mockReturnValueOnce({ unitPrice: 5 })
                    .mockReturnValueOnce({ unitPrice: 2 });
                jest.spyOn(ConvertV1Profiles as any, "convertPropNames")
                    .mockImplementation(jest.fn());
                jest.spyOn(ConvertV1Profiles as any, "createNewConfigFile")
                    .mockImplementation(jest.fn());

                // Avoid using the real secure credMgr. Pretend it works.
                setCredMgrState("works");

                // call the function that we want to test
                await ConvertV1Profiles["moveV1ProfilesToConfigFile"]();

                const convertResult = ConvertV1Profiles["convertResult"];
                expect(Object.keys(convertResult.profilesConverted).length).toBe(2);
                expect(convertResult.profilesFailed.length).toBe(0);

                let numMsgsFound = 0;
                for (const nextMsg of convertResult.msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if (nextMsg.msgText.includes("Converted fruit profiles: apple, banana, coconut") ||
                            nextMsg.msgText.includes("Converted nut profiles: almond, brazil, cashew")
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
            });

            it("should fail to convert invalid v1 profiles to config object", async () => {
                const metaError = new Error("invalid meta file");
                const profileError = new Error("invalid profile file");
                jest.spyOn(V1ProfileRead, "getAllProfileDirectories").mockReturnValueOnce(["fruit", "nut"]);
                jest.spyOn(V1ProfileRead, "getAllProfileNames")
                    .mockReturnValueOnce(["apple", "banana", "coconut"])
                    .mockReturnValueOnce([]);
                jest.spyOn(V1ProfileRead, "readMetaFile").mockImplementationOnce(() => { throw metaError; });
                jest.spyOn(V1ProfileRead, "readProfileFile")
                    .mockImplementationOnce(() => ({ color: "green", secret: "managed by A" }))
                    .mockImplementationOnce(() => { throw profileError; })
                    .mockImplementationOnce(() => ({ color: "brown", secret: "managed by C" }));
                jest.spyOn(ConvertV1Profiles as any, "convertPropNames")
                    .mockImplementation(jest.fn());
                jest.spyOn(ConvertV1Profiles as any, "createNewConfigFile")
                    .mockImplementation(jest.fn());

                // Avoid using the real secure credMgr. Pretend it fails.
                setCredMgrState("fails");

                // call the function that we want to test
                await ConvertV1Profiles["moveV1ProfilesToConfigFile"]();

                const convertResult = ConvertV1Profiles["convertResult"];
                expect(Object.keys(convertResult.profilesConverted).length).toBe(1);
                expect(convertResult.profilesFailed.length).toBe(2);

                let numMsgsFound = 0;
                for (const nextMsg of convertResult.msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if (nextMsg.msgText.includes("Converted fruit profiles: apple, coconut")) {
                            numMsgsFound++;
                        }
                    } else {
                        if (nextMsg.msgText.includes('Failed to read "fruit" profile named "banana"') ||
                            nextMsg.msgText.includes("invalid profile file")  ||
                            nextMsg.msgText.includes('Failed to find default "fruit" profile')  ||
                            nextMsg.msgText.includes("invalid meta file") ||
                            nextMsg.msgText.includes("Unable to convert 2 profile(s).")
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(6);
            });
        }); // end moveV1ProfilesToConfigFile

        describe("convertPropNames", () => {
            it("should convert old v1 property names to new names", () => {
                const testConfig= {
                    profiles: {
                        zosmf_LPAR1: {
                            type: "zosmf",
                            properties: {
                                hostname: "should change to host",
                                username: "should change to user",
                                pass: "should change to password"
                            },
                            secure: ["username", "pass"]
                        }
                    },
                    defaults: {
                        zosmf: "zosmf_LPAR1"
                    },
                    autoStore: true
                };
                jest.restoreAllMocks(); // put spies back to original app implementation

                // call the function that we want to test
                ConvertV1Profiles["convertPropNames"](testConfig);

                const convertedProps = testConfig.profiles.zosmf_LPAR1.properties;
                expect(Object.prototype.hasOwnProperty.call(convertedProps, "hostname")).toBe(false);
                expect(Object.prototype.hasOwnProperty.call(convertedProps, "host")).toBe(true);
                expect(Object.prototype.hasOwnProperty.call(convertedProps, "username")).toBe(false);
                expect(Object.prototype.hasOwnProperty.call(convertedProps, "user")).toBe(true);
                expect(Object.prototype.hasOwnProperty.call(convertedProps, "pass")).toBe(false);
                expect(Object.prototype.hasOwnProperty.call(convertedProps, "password")).toBe(true);
            });
        }); // end convertPropNames

        describe("createNewConfigFile", () => {
            const testConfig = {
                profiles: {
                    zosmf_LPAR1: {
                        type: "zosmf",
                        properties: {
                            host: "should change to host",
                            user: "should change to user",
                        },
                        secure: ["password"]
                    }
                },
                defaults: {
                    zosmf: "zosmf_LPAR1"
                },
                autoStore: true
            };

            let loadV1SchemasSpy:any;
            let activateSpy: any;
            let mergeSpy: any;
            let saveSpy: any;
            let updateSchemaSpy: any;
            let layerActiveSpy: any;

            beforeAll(() => {
                jest.restoreAllMocks(); // put spies back to original app implementation

                // Pretend that our utility functions work.
                activateSpy = jest.fn();
                mergeSpy = jest.fn();
                saveSpy = jest.fn();
                layerActiveSpy = jest.fn().mockReturnValue({
                    exists: false,
                    global: true,
                    user: false,
                    path: "/fake/path/to/config",
                    properties: null as any,
                });

                loadV1SchemasSpy = jest.spyOn(ConvertV1Profiles as any, "loadV1Schemas").mockReturnValue(void 0);
                updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValue(0 as any);

                jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue({
                    api: {
                        layers: {
                            activate: activateSpy,
                            merge: mergeSpy
                        } as any,
                    },
                    layerActive: layerActiveSpy,
                    save: saveSpy
                } as any);
            });

            beforeEach(() => {
                // reset usage counts
                loadV1SchemasSpy.mockClear();
                updateSchemaSpy.mockClear();
            });

            afterAll(() => {
                // restore original app implementations
                loadV1SchemasSpy.mockRestore();
                updateSchemaSpy.mockRestore();
            });

            it("should create a config file and report movement of old profiles", async () => {
                // we report movement when we do not delete
                ConvertV1Profiles["convertOpts"] = {
                    deleteV1Profs: false
                };

                // pretend that rename worked
                const renameSpy = jest.spyOn(fs, "renameSync")
                    .mockReturnValue(0 as any);

                // call the function that we want to test
                await ConvertV1Profiles["createNewConfigFile"](testConfig);

                expect(activateSpy).toHaveBeenCalled();
                expect(mergeSpy).toHaveBeenCalled();
                expect(loadV1SchemasSpy).toHaveBeenCalled();
                expect(updateSchemaSpy).toHaveBeenCalled();
                expect(saveSpy).toHaveBeenCalled();
                expect(renameSpy).toHaveBeenCalled();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if (nextMsg.msgText.includes("Your old V1 profiles have been moved") &&
                            nextMsg.msgText.includes("Delete them by re-running this operation and requesting deletion")
                            ||
                            nextMsg.msgText.includes("Your new profiles have been saved") &&
                            nextMsg.msgText.includes("To change your configuration, update that file in your text editor")
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
            });

            it("should create a config file and NOT report movement of old profiles", async () => {
                // we were asked to delete
                ConvertV1Profiles["convertOpts"] = {
                    deleteV1Profs: true
                };

                // pretend that rename worked
                const renameSpy = jest.spyOn(fs, "renameSync")
                    .mockReturnValue(0 as any);

                // call the function that we want to test
                await ConvertV1Profiles["createNewConfigFile"](testConfig);

                expect(activateSpy).toHaveBeenCalled();
                expect(mergeSpy).toHaveBeenCalled();
                expect(loadV1SchemasSpy).toHaveBeenCalled();
                expect(updateSchemaSpy).toHaveBeenCalled();
                expect(saveSpy).toHaveBeenCalled();
                expect(renameSpy).toHaveBeenCalled();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        expect(nextMsg.msgText.includes("Your old V1 profiles have been moved")).toBe(false);

                        if (nextMsg.msgText.includes("Your new profiles have been saved") &&
                            nextMsg.msgText.includes("To change your configuration, update that file in your text editor")
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(1);
            });

            it("should create a config vault if needed", async () => {
                // make the vault non-existent
                const configObj = ImperativeConfig.instance.config;
                configObj["mVault"] = null as any;

                // request that we do not delete profiles
                ConvertV1Profiles["convertOpts"] = {
                    deleteV1Profs: false
                };

                // pretend that rename worked
                const renameSpy = jest.spyOn(fs, "renameSync")
                    .mockReturnValue(0 as any);

                // call the function that we want to test
                await ConvertV1Profiles["createNewConfigFile"](testConfig);

                expect(ImperativeConfig.instance.config["mVault"]).not.toEqual(null);
                expect(activateSpy).toHaveBeenCalled();
                expect(mergeSpy).toHaveBeenCalled();
                expect(loadV1SchemasSpy).toHaveBeenCalled();
                expect(updateSchemaSpy).toHaveBeenCalled();
                expect(saveSpy).toHaveBeenCalled();
                expect(renameSpy).toHaveBeenCalled();

                // prevent calling the real underlying credentialManager factory load and save functions
                Object.defineProperty(CredentialManagerFactory, "manager", {
                    configurable: true,
                    get: jest.fn(() => {
                        return {
                            configurable: true,
                            load: jest.fn(() => { }),
                            save: jest.fn(() => { })
                        };
                    })
                });

                // get coverage of the load and save functions of the vault
                await ImperativeConfig.instance.config.mVault.load(appName);
                await ImperativeConfig.instance.config.mVault.save("name", "value");
            });

            it("should catch and report a problem when rename throws an error", async () => {
                // we were asked to delete
                ConvertV1Profiles["convertOpts"] = {
                    deleteV1Profs: true
                };

                // pretend that rename crashed
                const renameError = "fs.renameSync threw a horrible error";
                const renameSpy = jest.spyOn(fs, "renameSync").mockImplementation(() => {
                    throw new Error(renameError);
                });

                // call the function that we want to test
                let caughtErr: any;
                try {
                    await ConvertV1Profiles["createNewConfigFile"](testConfig);
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(activateSpy).toHaveBeenCalled();
                expect(mergeSpy).toHaveBeenCalled();
                expect(loadV1SchemasSpy).toHaveBeenCalled();
                expect(updateSchemaSpy).toHaveBeenCalled();
                expect(saveSpy).toHaveBeenCalled();
                expect(renameSpy).toHaveBeenCalled();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if (nextMsg.msgText.includes("Your new profiles have been saved") &&
                            nextMsg.msgText.includes("To change your configuration, update that file in your text editor")
                        ) {
                            numMsgsFound++;
                        }
                    } else {
                        if (nextMsg.msgText.includes("Failed to rename profiles directory") ||
                            nextMsg.msgText.includes(`Reason: ${renameError}`) ||
                            nextMsg.msgText.includes(`Error: ${renameError}`)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(4);
            });
        }); // end createNewConfigFile

        describe("putCfgFileNmInResult", () => {

            it("should use a placeholder cfgFilePathName when layerActive fails", async () => {
                // Pretend layerActive crashed
                jest.spyOn(ImperativeConfig.instance, "config", "get").mockReturnValue({
                    api: {
                        layers: {
                            activate: jest.fn(),
                            merge: jest.fn(),
                        } as any,
                    },
                    layerActive: jest.fn().mockImplementation(() => {
                        throw new Error("layerActiveCrashed");
                    }),
                    save: jest.fn()
                } as any);

                ConvertV1Profiles["convertResult"].cfgFilePathNm = null as any;

                // call the function that we want to test
                ConvertV1Profiles["putCfgFileNmInResult"](null as any);

                expect(ConvertV1Profiles["convertResult"].cfgFilePathNm).toEqual(ConvertV1Profiles["noCfgFilePathNm"]);
            });
        }); // end putCfgFileNmInResult

        describe("deleteV1Profiles", () => {
            const oldProfileDir = "/fake/path/to/profiles-old";
            let existsSyncSpy: any;
            let removeSyncSpy: any;

            beforeAll(() => {
                ConvertV1Profiles["oldProfilesDir"] = oldProfileDir;
                existsSyncSpy = jest.spyOn(fs, "existsSync");
                removeSyncSpy = jest.spyOn(fsExtra, "removeSync");
            });

            beforeEach(() => {
                // pretend that remove works
                removeSyncSpy.mockReturnValue(0 as any);

                // reset usage counts
                existsSyncSpy.mockClear();
                removeSyncSpy.mockClear();
            });

            afterAll(() => {
                // restore original app implementations
                existsSyncSpy.mockRestore();
                removeSyncSpy.mockRestore();
            });

            it("should delete the old v1 profiles directory", async () => {
                // pretend that we found no secure property names under any old-school service
                jest.spyOn(ConvertV1Profiles as any, "findOldSecureProps")
                    .mockResolvedValue(Promise.resolve([]));

                // pretend that the profiles directory exists
                existsSyncSpy.mockReturnValue(true);

                // call the function that we want to test
                await ConvertV1Profiles["deleteV1Profiles"]();

                expect(removeSyncSpy).toHaveBeenCalled();
                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if (nextMsg.msgText.includes(`Deleted the old profiles directory ${oldProfileDir}`)) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(1);
            });

            it("should report that the old v1 profiles directory does not exist", async () => {
                // pretend that we found no secure property names under any old-school service
                jest.spyOn(ConvertV1Profiles as any, "findOldSecureProps")
                    .mockResolvedValue(Promise.resolve([]));

                // pretend that the profiles directory not exist
                existsSyncSpy.mockReturnValue(false);

                // call the function that we want to test
                await ConvertV1Profiles["deleteV1Profiles"]();

                expect(removeSyncSpy).not.toHaveBeenCalled();
                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if (nextMsg.msgText.includes(`The old profiles directory ${oldProfileDir} did not exist.`)) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(1);
            });

            it("should catch and report a problem when remove throws an error", async () => {
                // pretend that we found no secure property names under any old-school service
                jest.spyOn(ConvertV1Profiles as any, "findOldSecureProps")
                    .mockResolvedValue(Promise.resolve([]));

                // pretend that the profiles directory exists
                existsSyncSpy.mockReturnValue(true);

                // pretend that remove crashed
                const removeError = "fsExtra.removeSync threw a horrible error";
                removeSyncSpy.mockImplementation(() => {
                    throw new Error(removeError);
                });

                // call the function that we want to test
                let caughtErr: any;
                try {
                    await ConvertV1Profiles["deleteV1Profiles"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(removeSyncSpy).toHaveBeenCalled();
                expect(caughtErr).not.toBeDefined();
                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes(`Failed to delete the profiles directory '${oldProfileDir}'`) ||
                            nextMsg.msgText.includes(removeError)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
            });

            it("should also delete credentials stored by old SCS plugin", async () => {
                // pretend that the zowe keyring is available
                jest.spyOn(ConvertV1Profiles as any, "isZoweKeyRingAvailable")
                    .mockResolvedValue(Promise.resolve(true));

                // pretend that we found secure property names under one old-school service
                jest.spyOn(ConvertV1Profiles as any, "findOldSecureProps")
                    .mockResolvedValueOnce(Promise.resolve(["secureUser", "securePassword"]))
                    .mockResolvedValue(Promise.resolve([]));

                jest.spyOn(ConvertV1Profiles as any, "deleteOldSecureProps")
                    .mockResolvedValue(Promise.resolve(true));

                // pretend that the profiles directory exists
                existsSyncSpy.mockReturnValue(true);

                // call the function that we want to test
                await ConvertV1Profiles["deleteV1Profiles"]();

                expect(removeSyncSpy).toHaveBeenCalled();
                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if (nextMsg.msgText.includes("Deleted obsolete secure value ") &&
                            (
                                nextMsg.msgText.includes("secureUser") ||
                                nextMsg.msgText.includes("securePassword")
                            )
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
            });

            it("should report an error when we fail to delete secure credentials", async () => {
                // pretend that the zowe keyring is available
                jest.spyOn(ConvertV1Profiles as any, "isZoweKeyRingAvailable")
                    .mockResolvedValue(Promise.resolve(true));

                // pretend that we found secure property names under one old-school service
                jest.spyOn(ConvertV1Profiles as any, "findOldSecureProps")
                    .mockResolvedValueOnce(Promise.resolve(["secureUser", "securePassword"]))
                    .mockResolvedValue(Promise.resolve([]));

                // pretend that secure credential deletion failed
                jest.spyOn(ConvertV1Profiles as any, "deleteOldSecureProps")
                    .mockResolvedValue(Promise.resolve(false));

                // pretend that the profiles directory exists
                existsSyncSpy.mockReturnValue(true);

                // call the function that we want to test
                await ConvertV1Profiles["deleteV1Profiles"]();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Failed to delete obsolete secure value") &&
                            (
                                nextMsg.msgText.includes("secureUser") ||
                                nextMsg.msgText.includes("securePassword")
                            )
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
            });

            it("should only report directory deletion when zowe keyring is unavailable", async () => {
                // pretend that the zowe keyring is unavailable
                const checkKeyRingSpy = jest.spyOn(ConvertV1Profiles as any, "isZoweKeyRingAvailable")
                    .mockResolvedValue(Promise.resolve(false));

                // pretend that the profiles directory exists
                existsSyncSpy.mockReturnValue(true);

                // call the function that we want to test
                await ConvertV1Profiles["deleteV1Profiles"]();

                expect(removeSyncSpy).toHaveBeenCalled();
                let numDirDelMsgs = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgText.includes(`Deleted the old profiles directory ${oldProfileDir}`)) {
                        numDirDelMsgs++;
                    }
                }
                expect(ConvertV1Profiles["convertResult"].msgs.length).toEqual(1);
                expect(numDirDelMsgs).toEqual(1);
                checkKeyRingSpy.mockRestore();  // restore original app implementation
            });
        }); // end deleteV1Profiles

        describe("replaceOldCredMgrOverride", () => {
            let getOldPluginInfoSpy: any;

            beforeAll(() => {
                getOldPluginInfoSpy = jest.spyOn(ConvertV1Profiles as any, "getOldPluginInfo");
            });

            afterAll(() => {
                // restore original app implementations
                getOldPluginInfoSpy.mockRestore();
            });

            it("should do nothing if there are no overrides", () => {
                // pretend that no overrides exist
                getOldPluginInfoSpy.mockReturnValueOnce({ plugins: [], overrides: [] });

                const appSettingsGetSpy = jest.spyOn(AppSettings, "instance", "get");

                // call the function that we want to test
                let caughtErr: any;
                try {
                    ConvertV1Profiles["replaceOldCredMgrOverride"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(appSettingsGetSpy).not.toHaveBeenCalled();
            });

            it("should replace a v1 SCS credential manager and report a v1 SCS plugin", async () => {
                // pretend that we found an old credential manager
                const fakeV1ScsPlugin = "FakeScsPlugin";
                getOldPluginInfoSpy.mockReturnValueOnce(
                    { plugins: [fakeV1ScsPlugin], overrides: ["CredentialManager"] }
                );

                // pretend that we set the credMgr
                const appSettingsSetSpy = jest.fn();
                jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                    set: appSettingsSetSpy
                } as any);

                // pretend that our loadedConfig has a credMgr override
                jest.spyOn(ImperativeConfig.instance, "loadedConfig", "get").mockReturnValue({
                    overrides: {
                        CredentialManager: "CfgMgrOverride"
                    }
                } as any);

                // call the function that we want to test
                let caughtErr: any;
                try {
                    await ConvertV1Profiles["replaceOldCredMgrOverride"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(appSettingsSetSpy).toHaveBeenCalledWith(
                    "overrides", "CredentialManager", CredentialManagerOverride.DEFAULT_CRED_MGR_NAME
                );
                expect(ConvertV1Profiles["convertResult"].v1ScsPluginName).toEqual(fakeV1ScsPlugin);
                expect(ConvertV1Profiles["convertResult"].credsWereMigrated).toEqual(true);
            });

            it("should catch and report an error thrown by AppSettings.instance.set", () => {
                // pretend that we found an old credential manager
                const fakeV1ScsPlugin = "FakeScsPlugin";
                getOldPluginInfoSpy.mockReturnValueOnce(
                    { plugins: [fakeV1ScsPlugin], overrides: ["CredentialManager"] }
                );

                // pretend that AppSettings.set() throws an exception
                const appSettingsCrashErrMsg = "A fake exception from AppSettings.instance.set";
                const appSettingsSetSpy = jest.fn().mockImplementation(() => {
                    throw new Error(appSettingsCrashErrMsg);
                });
                jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                    set: appSettingsSetSpy
                } as any);

                // call the function that we want to test
                let caughtErr: any;
                try {
                    ConvertV1Profiles["replaceOldCredMgrOverride"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(appSettingsSetSpy).toHaveBeenCalledWith(
                    "overrides", "CredentialManager", CredentialManagerOverride.DEFAULT_CRED_MGR_NAME
                );
                expect(ConvertV1Profiles["convertResult"].v1ScsPluginName).toEqual(fakeV1ScsPlugin);
                expect(ConvertV1Profiles["convertResult"].credsWereMigrated).toEqual(false);
                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Failed to replace credential manager override setting") ||
                            nextMsg.msgText.includes(`Reason: ${appSettingsCrashErrMsg}`) ||
                            nextMsg.msgText.includes(`Error: ${appSettingsCrashErrMsg}`)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(3);
            });
        }); // end replaceOldCredMgrOverride

        describe("getOldPluginInfo", () => {
            let isPluginInstalledSpy: any;

            beforeEach(() => {
                isPluginInstalledSpy = jest.spyOn(ConvertV1Profiles as any, "isPluginInstalled");
            });

            afterAll(() => {
                isPluginInstalledSpy.mockRestore();  // restore original app implementation
            });

            it("should retrieve old credMgr override and old plugin", () => {
                // pretend that we find the old SCS CredMgr name
                const oldScsName = "@zowe/secure-credential-store-for-zowe-cli";
                const appSettingsGetSpy = jest.fn().mockReturnValue(oldScsName);
                jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                    get: appSettingsGetSpy
                } as any);

                // pretend that the old zowe SCS plugin is installed
                isPluginInstalledSpy.mockReturnValue(true);

                // call the function that we want to test
                let pluginInfo: any;
                let caughtErr: any;
                try {
                    pluginInfo = ConvertV1Profiles["getOldPluginInfo"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(appSettingsGetSpy).toHaveBeenCalled();

                let numItemsFound = 0;
                for (const nextOverride of pluginInfo.overrides) {
                    if (nextOverride === "CredentialManager") {
                        numItemsFound++;
                    }
                }
                expect(numItemsFound).toEqual(1);

                numItemsFound = 0;
                for (const nextPlugin of pluginInfo.plugins) {
                    if (nextPlugin === oldScsName) {
                        numItemsFound++;
                    }
                }
                expect(numItemsFound).toEqual(1);
            });

            it("should initialize appSettings when AppSettings.instance fails", () => {
                // pretend that AppSettings.instance.get crashes
                const appSettingsGetSpy = jest.spyOn(AppSettings, "instance", "get").mockImplementation(() => {
                    throw new Error("Error does not matter");
                });

                // pretend that the old zowe SCS plugin is installed
                isPluginInstalledSpy.mockReturnValue(true);

                // call the function that we want to test
                let pluginInfo: any;
                let caughtErr: any;
                try {
                    pluginInfo = ConvertV1Profiles["getOldPluginInfo"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(isPluginInstalledSpy).toHaveBeenCalled();
                expect(appSettingsGetSpy).toHaveBeenCalled();
                expect(pluginInfo.overrides.length).toEqual(0);
                expect(pluginInfo.plugins.length).toEqual(1);
            });

            it("should catch exception from AppSettings.instance.get and record error", () => {
                // pretend that AppSettings.instance.get crashes
                const fakeErrMsg = "A fake exception from AppSettings.instance.get";
                const appSettingsGetSpy = jest.fn().mockImplementation(() => {
                    throw new Error(fakeErrMsg);
                });
                jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                    get: appSettingsGetSpy
                } as any);

                // pretend that the old zowe SCS plugin is installed
                isPluginInstalledSpy.mockReturnValue(true);

                // call the function that we want to test
                let pluginInfo: any;
                let caughtErr: any;
                try {
                    pluginInfo = ConvertV1Profiles["getOldPluginInfo"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(appSettingsGetSpy).toHaveBeenCalled();
                expect(pluginInfo.overrides.length).toEqual(0);
                expect(pluginInfo.plugins.length).toEqual(1);

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Failed trying to read 'CredentialManager' overrides.") ||
                            nextMsg.msgText.includes(`Reason: ${fakeErrMsg}`) ||
                            nextMsg.msgText.includes(`Error: ${fakeErrMsg}`)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(3);
            });

            it("should catch exception from isPluginInstalled and record error", () => {
                // pretend that we find the old SCS CredMgr name
                const oldScsName = "@zowe/secure-credential-store-for-zowe-cli";
                const appSettingsGetSpy = jest.fn().mockReturnValue(oldScsName);
                jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                    get: appSettingsGetSpy
                } as any);

                // pretend that isPluginInstalled throws an error
                const caughtErrMsg = "isPluginInstalled threw a horrible exception";
                isPluginInstalledSpy.mockImplementation(jest.fn(() => {
                    throw new Error(caughtErrMsg);
                }));

                // call the function that we want to test
                let pluginInfo: any;
                let caughtErr: any;
                try {
                    pluginInfo = ConvertV1Profiles["getOldPluginInfo"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Failed trying to get the set of installed plugins") ||
                            nextMsg.msgText.includes(`Reason: ${caughtErrMsg}`) ||
                            nextMsg.msgText.includes(`Error: ${caughtErrMsg}`)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(3);
            });
        }); // end getOldPluginInfo

        describe("isPluginInstalled", () => {
            let readFileSyncSpy: any;

            beforeAll(() => {
                readFileSyncSpy = jest.spyOn(jsonfile, "readFileSync");

                // cliHome is a getter property, so mock the property.
                Object.defineProperty(ImperativeConfig.instance, "cliHome", {
                    configurable: true,
                    get: jest.fn(() => {
                        return "/fake/cliHome";
                    })
                });
            });

            afterAll(() => {
                readFileSyncSpy.mockRestore();  // restore original app implementation
            });

            it("should return true if plugin name is in the plugins file", () => {
                // make readFileSync return some fake data
                const pluginName = "FakePluginName";
                const fakePluginsJson = JSON.parse(`{
                    "@zowe/secure-credential-store-for-zowe-cli": {
                        "package": "@zowe/secure-credential-store-for-zowe-cli@zowe-v1-lts",
                        "registry": "https://registry.npmjs.org/",
                        "version": "4.1.12"
                    },
                    "@zowe/cics-for-zowe-cli": {
                        "package": "@zowe/cics-for-zowe-cli@zowe-v1-lts",
                        "registry": "https://registry.npmjs.org/",
                        "version": "4.0.11"
                    },
                    "${pluginName}": {
                        "package": "@zowe/${pluginName}-for-zowe-cli@zowe-v1-lts",
                        "registry": "https://registry.npmjs.org/",
                        "version": "1.2.3"
                    }
                }`);
                readFileSyncSpy.mockImplementation(() => {
                    return fakePluginsJson;
                });

                // call the function that we want to test
                const pluginInstResult: boolean = ConvertV1Profiles["isPluginInstalled"](pluginName);
                expect(pluginInstResult).toEqual(true);
            });

            it("should return false if plugin name is NOT in the plugins file", () => {
                // make readFileSync return some fake data
                const fakePluginsJson = JSON.parse(`{
                    "@zowe/secure-credential-store-for-zowe-cli": {
                        "package": "@zowe/secure-credential-store-for-zowe-cli@zowe-v1-lts",
                        "registry": "https://registry.npmjs.org/",
                        "version": "4.1.12"
                    },
                    "@zowe/cics-for-zowe-cli": {
                        "package": "@zowe/cics-for-zowe-cli@zowe-v1-lts",
                        "registry": "https://registry.npmjs.org/",
                        "version": "4.0.11"
                    },
                    "@zowe/not-your-plugin": {
                        "package": "@zowe/these-are-not-the-droids-you-are-looking-for@zowe-v2-lts",
                        "registry": "https://registry.npmjs.org/",
                        "version": "4.0.11"
                    }
                }`);
                readFileSyncSpy.mockImplementation(() => {
                    return fakePluginsJson;
                });

                // call the function that we want to test
                const pluginInstResult: boolean = ConvertV1Profiles["isPluginInstalled"]("PluginNameNotInstalled");
                expect(pluginInstResult).toEqual(false);
            });

            it("should catch exception from readFileSync and record error for CLI", () => {
                // pretend that readFileSync throws an error
                const readFileErrMsg = "readFileSync threw some horrible exception";
                readFileSyncSpy.mockImplementation(jest.fn(() => {
                    throw new Error(readFileErrMsg);
                }));

                // call the function that we want to test
                const pluginName = "FakePluginName";
                let pluginInstResult: boolean = false;
                let caughtErr: any;
                try {
                    pluginInstResult = ConvertV1Profiles["isPluginInstalled"](pluginName);
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(pluginInstResult).toEqual(false);

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Cannot read plugins file") && nextMsg.msgText.includes("plugins.json") ) {
                            numMsgsFound++;
                        }
                        if ((nextMsg.msgText.includes("Reason: ") || nextMsg.msgText.includes("Error: ")) &&
                            nextMsg.msgText.includes(readFileErrMsg)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(3);
            });

            it("should catch exception from readFileSync but not record error for VSCode app", () => {
                // pretend that readFileSync throws an error
                const readFileErrMsg = "readFileSync threw some horrible exception";
                readFileSyncSpy.mockImplementation(jest.fn(() => {
                    throw new Error(readFileErrMsg);
                }));

                // pretend that we were called by a VSCode app
                ConvertV1Profiles["profileInfo"] = new ProfileInfo(appName);

                // call the function that we want to test
                const pluginName = "FakePluginName";
                let pluginInstResult: boolean = false;
                let caughtErr: any;
                try {
                    pluginInstResult = ConvertV1Profiles["isPluginInstalled"](pluginName);
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(pluginInstResult).toEqual(false);

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Cannot read plugins file") && nextMsg.msgText.includes("plugins.json")) {
                            numMsgsFound++;
                        }
                        if ((nextMsg.msgText.includes("Reason: ") || nextMsg.msgText.includes("Error: ")) &&
                            nextMsg.msgText.includes(readFileErrMsg)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(0);
            });
        }); // end isPluginInstalled

        describe("getOldProfileCount", () => {

            it("should count the profiles for each profile directory", () => {
                // pretend we found 3 profile directories
                jest.spyOn(V1ProfileRead as any, "getAllProfileDirectories")
                    .mockReturnValue(["base", "zosmf", "ssh"]);

                // pretend we found 3 profile names for each directory
                jest.spyOn(V1ProfileRead as any, "getAllProfileNames")
                    .mockReturnValueOnce(["baseName1", "baseName2", "baseName3"])
                    .mockReturnValueOnce(["zosmfName1", "zosmfName2", "zosmfName3"])
                    .mockReturnValueOnce(["sshName1", "sshName2", "sshName3"]);

                // call the function that we want to test
                const profileCount = ConvertV1Profiles["getOldProfileCount"]("/fake/profile/root/dir");
                expect(profileCount).toEqual(9);
            });
        }); // end getOldProfileCount

        describe("initCredMgr", () => {
            let logMsg: string;

            beforeAll(() => {
                // change logger spy to record the message
                loggerSpy = jest.spyOn(Logger, "getImperativeLogger").mockImplementation(() => {
                    return {
                        error: jest.fn((errMsg) => {
                            logMsg = errMsg;
                        })
                    } as any;
                });

                // do not attempt to do any logging configuration
                Logger.initLogger = jest.fn();
                LoggingConfigurer.configureLogger = jest.fn();
            });

            beforeEach(() => {
                // Reset the messages that have been logged or reported
                logMsg = "Nothing logged";
                ConvertV1Profiles["convertResult"].msgs = [];
            });

            afterEach(() => {
                jest.clearAllMocks(); // clear the mock counters
            });

            afterAll(() => {
                // restore the logger spy back to doing nothing
                loggerSpy = jest.spyOn(Logger, "getImperativeLogger").mockReturnValue({
                    error: jest.fn()
                } as any);
            });

            it("should detect when credMgr has already been initialized", async () => {
                // pretend that credMgr has been initialized.
                let initializedWasCalled = false;
                Object.defineProperty(CredentialManagerFactory, "initialized", {
                    configurable: true,
                    get: jest.fn(() => {
                        initializedWasCalled = true;
                        return true;
                    })
                });

                // pretend that the SCS plugin was configured as the credMgr
                ConvertV1Profiles["oldScsPluginWasConfigured"] = true;

                // call the function that we want to test
                await ConvertV1Profiles["initCredMgr"]();

                expect(initializedWasCalled).toEqual(true);
                expect(logMsg).toContain(
                    `Credential manager has already been initialized with the old SCS plugin ${oldScsPluginNm}. ` +
                    `Old credentials cannot be migrated`
                );
            });

            it("should read profiles from disk when ProfileInfo is supplied", async () => {
                // pretend that credMgr has NOT been initialized.
                Object.defineProperty(CredentialManagerFactory, "initialized", {
                    configurable: true,
                    get: jest.fn(() => {
                        return false;
                    })
                });

                // do not actually read any ProfileInfo from disk
                ConvertV1Profiles["profileInfo"] = new ProfileInfo(appName);
                const readFromDiskSpy = jest.spyOn(ConvertV1Profiles["profileInfo"], "readProfilesFromDisk")
                    .mockResolvedValue(Promise.resolve());

                // call the function that we want to test
                await ConvertV1Profiles["initCredMgr"]();
                expect(readFromDiskSpy).toHaveBeenCalled();
            });

            it("should call overridesLoader when ProfileInfo is NOT supplied", async () => {
                // pretend that credMgr has NOT been initialized.
                Object.defineProperty(CredentialManagerFactory, "initialized", {
                    configurable: true,
                    get: jest.fn(() => {
                        return false;
                    })
                });

                // do not actually load the overrides
                ConvertV1Profiles["profileInfo"] = null as any;
                const overridesLoaderSpy = jest.spyOn(OverridesLoader, "load");

                // call the function that we want to test
                await ConvertV1Profiles["initCredMgr"]();
                expect(overridesLoaderSpy).toHaveBeenCalled();
            });

            it("should catch an exception and report the error", async () => {
                // pretend that credMgr has NOT been initialized.
                Object.defineProperty(CredentialManagerFactory, "initialized", {
                    configurable: true,
                    get: jest.fn(() => {
                        return false;
                    })
                });

                // do not actually read any ProfileInfo from disk
                ConvertV1Profiles["profileInfo"] = new ProfileInfo(appName);
                const fakeErrMsg = "A fake exception from findCredentials";
                const readFromDiskSpy = jest.spyOn(ConvertV1Profiles["profileInfo"], "readProfilesFromDisk")
                    .mockImplementation(() => {
                        throw new Error(fakeErrMsg);
                    });

                // call the function that we want to test
                let caughtErr: any;
                try {
                    await ConvertV1Profiles["initCredMgr"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(readFromDiskSpy).toHaveBeenCalled();
                expect(caughtErr).not.toBeDefined();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes(`Failed to initialize CredentialManager`) ||
                            nextMsg.msgText.includes(`Reason: ${fakeErrMsg}`) ||
                            nextMsg.msgText.includes(`Error: ${fakeErrMsg}`)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(3);
            });
        }); // end initCredMgr

        describe("loadV1Schemas", () => {
            let existsSyncSpy: any;

            beforeAll(() => {
                existsSyncSpy = jest.spyOn(fs, "existsSync");
            });

            beforeEach(() => {
                existsSyncSpy.mockClear();  // reset usage counts

                // pretend that our loadedConfig has no schemas in it
                jest.spyOn(ImperativeConfig.instance, "loadedConfig", "get").mockReturnValue({} as any);
            });

            afterAll(() => {
                // restore original app implementations
                existsSyncSpy.mockRestore();
            });

            it("should load schemas when none exist in ImperativeConfig loadedConfig", () => {
                // pretend that the profiles root directory and schema file (xxx_meta.yaml) exist
                existsSyncSpy.mockReturnValue(true);

                // pretend that we have profiles and they have schemas
                const getAllProfileDirectoriesSpy = jest.spyOn(V1ProfileRead, "getAllProfileDirectories")
                    .mockReturnValue(["base", "cics", "zosmf"]);

                const readMetaFileSpy = jest.spyOn(V1ProfileRead, "readMetaFile")
                    .mockReturnValueOnce({ defaultProfile: "base", configuration: "baseSchema" as any })
                    .mockReturnValueOnce({ defaultProfile: "cics", configuration: "cicsSchema" as any })
                    .mockReturnValueOnce({ defaultProfile: "zosmf", configuration: "zosmfSchema" as any});

                // call the function that we want to test
                ConvertV1Profiles["loadV1Schemas"]();

                expect(existsSyncSpy).toHaveBeenCalled();
                expect(getAllProfileDirectoriesSpy).toHaveBeenCalledTimes(1);
                expect(readMetaFileSpy).toHaveBeenCalledTimes(3);
                expect(ImperativeConfig.instance.loadedConfig.profiles).toEqual(["baseSchema", "cicsSchema", "zosmfSchema"]);
            });

            it("should catch and report error thrown by readMetaFile", () => {
                // pretend that the profiles root directory and schema file (xxx_meta.yaml) exist
                existsSyncSpy.mockReturnValue(true);

                // pretend that we have profiles and they have schemas
                const getAllProfileDirectoriesSpy = jest.spyOn(V1ProfileRead, "getAllProfileDirectories")
                    .mockReturnValue(["base", "cics", "zosmf"]);

                const fakeErrMsg = "A fake exception from readMetaFile";
                const readMetaFileSpy = jest.spyOn(V1ProfileRead, "readMetaFile").mockImplementation(() => {
                    throw new Error(fakeErrMsg);
                });

                // call the function that we want to test
                let caughtErr: any;
                try {
                    ConvertV1Profiles["loadV1Schemas"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(existsSyncSpy).toHaveBeenCalled();
                expect(getAllProfileDirectoriesSpy).toHaveBeenCalled();
                expect(readMetaFileSpy).toHaveBeenCalledTimes(3);

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Failed to load schema for profile type base") ||
                            nextMsg.msgText.includes("Failed to load schema for profile type cics") ||
                            nextMsg.msgText.includes("Failed to load schema for profile type zosmf")
                        ) {
                            numMsgsFound++;
                        }
                        if (nextMsg.msgText.includes(`Reason: ${fakeErrMsg}`) ||
                            nextMsg.msgText.includes(`Error: ${fakeErrMsg}`)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(9);

            });
        }); // end loadV1Schemas

        describe("isZoweKeyRingAvailable", () => {

            it("should return true if it finds credentials in the vault", async () => {
                // pretend that findCredentials found a bunch of accounts and passwords
                const findCredentialsSpy = jest.spyOn(keyring as any, "findCredentials").mockResolvedValue([
                    { account: "account1", password: "password1" },
                    { account: "account2", password: "password2" },
                    { account: "account3", password: "password3" },
                    { account: "account4", password: "password4" },
                ]);
                const origZoweKeyRing = ConvertV1Profiles["zoweKeyRing"];
                ConvertV1Profiles["zoweKeyRing"] = {
                    findCredentials: findCredentialsSpy
                } as any;

                // call the function that we want to test
                const result = await ConvertV1Profiles["isZoweKeyRingAvailable"]();

                ConvertV1Profiles["zoweKeyRing"] = origZoweKeyRing;
                expect(findCredentialsSpy).toHaveBeenCalledWith("@zowe/cli");
                expect(result).toEqual(true);
            });

            it("should return false if findCredentials throws an error", async () => {
                // pretend that AppSettings.instance.set throws an exception
                const fakeErrMsg = "A fake exception from findCredentials";
                const findCredentialsSpy = jest.spyOn(keyring as any, "findCredentials").mockImplementation(() => {
                    throw new Error(fakeErrMsg);
                });
                const origZoweKeyRing = ConvertV1Profiles["zoweKeyRing"];
                ConvertV1Profiles["zoweKeyRing"] = {
                    findCredentials: findCredentialsSpy
                } as any;

                // call the function that we want to test
                let caughtErr: any;
                let checkKeyRingResult: boolean = true;
                try {
                    checkKeyRingResult = await ConvertV1Profiles["isZoweKeyRingAvailable"]();
                } catch (err) {
                    caughtErr = err;
                }

                ConvertV1Profiles["zoweKeyRing"] = origZoweKeyRing;
                expect(findCredentialsSpy).toHaveBeenCalledWith("@zowe/cli");
                expect(caughtErr).not.toBeDefined();
                expect(checkKeyRingResult).toEqual(false);
            });
        }); // end isZoweKeyRingAvailable

        describe("findOldSecureProps", () => {

            beforeEach(() => {
                jest.restoreAllMocks(); // put spies back to original app implementation
            });

            it("should find old secure properties", async () => {
                // pretend that findCredentials found a bunch of accounts and passwords
                const origZoweKeyRing = ConvertV1Profiles["zoweKeyRing"];
                ConvertV1Profiles["zoweKeyRing"] = {
                    findCredentials: jest.fn().mockResolvedValue([
                        { account: "account1", password: "password1" },
                        { account: "account2", password: "password2" },
                        { account: "account3", password: "password3" },
                        { account: "account4", password: "password4" }
                    ])
                } as any;

                // call the function that we want to test
                const oldSecurePropNames = await ConvertV1Profiles["findOldSecureProps"]("ServiceNameDoesNotMatter");

                ConvertV1Profiles["zoweKeyRing"] = origZoweKeyRing;
                expect(oldSecurePropNames).toContain("account1");
                expect(oldSecurePropNames).toContain("account2");
                expect(oldSecurePropNames).toContain("account3");
                expect(oldSecurePropNames).toContain("account4");
            });

            it("should catch an exception thrown by findCredentials and report the error", async () => {
                // pretend that findCredentials throws an error
                const origZoweKeyRing = ConvertV1Profiles["zoweKeyRing"];
                const fakeFindCredError = "findCredentials threw a horrible error";
                ConvertV1Profiles["zoweKeyRing"] = {
                    findCredentials: jest.fn().mockRejectedValue(new Error(fakeFindCredError))
                } as any;

                // call the function that we want to test
                const fakeServiceName = "ServiceNameDoesNotMatter";
                let caughtErr: any;
                try {
                    await ConvertV1Profiles["findOldSecureProps"](fakeServiceName);
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes(`Encountered an error while gathering secure properties ` +
                            `for service '${fakeServiceName}':`) ||
                            nextMsg.msgText.includes(`Reason: ${fakeFindCredError}`) ||
                            nextMsg.msgText.includes(`Error: ${fakeFindCredError}`)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(3);
                ConvertV1Profiles["zoweKeyRing"] = origZoweKeyRing;
            });
        }); // end findOldSecureProps

        describe("deleteOldSecureProps", () => {

            beforeEach(() => {
                jest.restoreAllMocks(); // put spies back to original app implementation
            });

            it("should delete the specified secure property", async () => {
                // pretend that we successfully deleted the secure property
                ConvertV1Profiles["zoweKeyRing"] = {
                    deletePassword: jest.fn().mockResolvedValue(true)
                } as any;

                // call the function that we want to test
                const didWeDelete = await ConvertV1Profiles["deleteOldSecureProps"]("FakeAcct", "FakeProp");
                expect(didWeDelete).toBe(true);
            });

            it("should catch exception thrown by deletePassword and report the error", async () => {
                // pretend that deletePassword threw an error
                const origZoweKeyRing = ConvertV1Profiles["zoweKeyRing"];
                const fakeDelPassError = "deletePassword threw a horrible error";
                ConvertV1Profiles["zoweKeyRing"] = {
                    deletePassword: jest.fn().mockRejectedValue(new Error(fakeDelPassError))
                } as any;

                // call the function that we want to test
                const fakeAcct = "FakeAccount";
                const fakeProp = "FakePropName";
                let caughtErr: any;
                try {
                    await ConvertV1Profiles["deleteOldSecureProps"](fakeAcct, fakeProp);
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes(
                            `Encountered an error while deleting secure data for ` +
                            `service '${fakeAcct}/${fakeProp}':`) ||
                            nextMsg.msgText.includes(`Reason: ${fakeDelPassError}`) ||
                            nextMsg.msgText.includes(`Error: ${fakeDelPassError}`)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(3);
                ConvertV1Profiles["zoweKeyRing"] = origZoweKeyRing;
            });
        }); // end deleteOldSecureProps
    }); // end private functions
});
