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
import * as fsExtra from "fs-extra";
import { PluginIssues } from "../../imperative/src/plugins/utilities/PluginIssues";
import { CredentialManagerFactory } from "../..";
import { ConvertV1Profiles } from "../";
import { ConvertMsgFmt } from "../src/doc/IConvertV1Profiles";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { ImperativeError } from "../../error/src/ImperativeError";
import { Logger } from "../../logger/src/Logger";
import { V1ProfileRead } from "../../profiles";
import { ConfigSchema } from "../../config/src/ConfigSchema";
import { AppSettings } from "../../settings/src/AppSettings";
import { CredentialManagerOverride } from "../../security/src/CredentialManagerOverride";

jest.mock("../../imperative/src/OverridesLoader");


describe("ConvertV1Profiles tests", () => {

    beforeAll(() => {
        // do not attempt to actually log any errors
        jest.spyOn(Logger, "getImperativeLogger").mockReturnValue({
            error: jest.fn()
        } as any);
    });

    describe("convert", () => {
        let isConversionNeededSpy: any;
        let moveV1ProfilesToConfigFileSpy: any;
        let removeOldOverridesSpy: any;
        let deleteV1ProfilesSpy: any;

        beforeAll(() => {
            // use "any" so that we can call private functions
            isConversionNeededSpy = jest.spyOn(ConvertV1Profiles as any, "isConversionNeeded");
            moveV1ProfilesToConfigFileSpy = jest.spyOn(ConvertV1Profiles as any, "moveV1ProfilesToConfigFile");
            removeOldOverridesSpy = jest.spyOn(ConvertV1Profiles as any, "removeOldOverrides");
            deleteV1ProfilesSpy = jest.spyOn(ConvertV1Profiles as any, "deleteV1Profiles");

            // cliHome is a getter property, so mock the property.
            Object.defineProperty(ImperativeConfig.instance, "cliHome", {
                configurable: true,
                get: jest.fn(() => {
                    return "/fake/cliHome";
                })
            });
        });

        afterEach(() => {
            jest.clearAllMocks();   // clear our spies usage counts
        });

        it("should complete a conversion when all utility functions work", async () => {
            isConversionNeededSpy.mockReturnValueOnce(true);
            moveV1ProfilesToConfigFileSpy.mockResolvedValue(Promise.resolve());
            removeOldOverridesSpy.mockImplementation(() => { });
            deleteV1ProfilesSpy.mockResolvedValue(Promise.resolve());

            // call the function that we want to test
            const convertResult = await ConvertV1Profiles.convert({
                deleteV1Profs: true
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).toHaveBeenCalled();
            expect(removeOldOverridesSpy).toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).toHaveBeenCalled();
        });

        it("should not delete profiles when asked not to delete", async () => {
            isConversionNeededSpy.mockReturnValueOnce(true);
            moveV1ProfilesToConfigFileSpy.mockResolvedValue(Promise.resolve());
            removeOldOverridesSpy.mockImplementation(() => { });
            deleteV1ProfilesSpy.mockResolvedValue(Promise.resolve());

            // call the function that we want to test
            const convertResult = await ConvertV1Profiles.convert({
                deleteV1Profs: false
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).toHaveBeenCalled();
            expect(removeOldOverridesSpy).toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).not.toHaveBeenCalled();
        });

        it("should skip conversion and not delete profiles", async () => {
            isConversionNeededSpy.mockReturnValueOnce(false);
            moveV1ProfilesToConfigFileSpy.mockResolvedValue(Promise.resolve());
            removeOldOverridesSpy.mockImplementation(() => { });
            deleteV1ProfilesSpy.mockResolvedValue(Promise.resolve());

            // call the function that we want to test
            const convertResult = await ConvertV1Profiles.convert({
                deleteV1Profs: false
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).not.toHaveBeenCalled();
            expect(removeOldOverridesSpy).not.toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).not.toHaveBeenCalled();
        });

        it("should skip conversion but still delete profiles", async () => {
            isConversionNeededSpy.mockReturnValueOnce(false);
            moveV1ProfilesToConfigFileSpy.mockResolvedValue(Promise.resolve());
            removeOldOverridesSpy.mockImplementation(() => { });
            deleteV1ProfilesSpy.mockResolvedValue(Promise.resolve());

            // call the function that we want to test
            const convertResult = await ConvertV1Profiles.convert({
                deleteV1Profs: true
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).not.toHaveBeenCalled();
            expect(removeOldOverridesSpy).not.toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).toHaveBeenCalled();
        });

        it("should catch an unexpected exception", async () => {
            const fakeErrMsg = "A message from a fake exception";
            isConversionNeededSpy.mockImplementation(() => {
                throw new Error(fakeErrMsg);
            });
            moveV1ProfilesToConfigFileSpy.mockResolvedValue(Promise.resolve());
            removeOldOverridesSpy.mockImplementation(() => { });
            deleteV1ProfilesSpy.mockResolvedValue(Promise.resolve());

            // call the function that we want to test
            const convertResult = await ConvertV1Profiles.convert({
                deleteV1Profs: true
            });

            expect(isConversionNeededSpy).toHaveBeenCalled();
            expect(moveV1ProfilesToConfigFileSpy).not.toHaveBeenCalled();
            expect(removeOldOverridesSpy).not.toHaveBeenCalled();
            expect(deleteV1ProfilesSpy).not.toHaveBeenCalled();

            /* The following line is a swell debug tool when a code block,
             * which is trying to match lines of result messages (like the block below),
             * does not get the results that it expects.
             *
            console.log("convertResult:\n " + JSON.stringify(ConvertV1Profiles["convertResult"], null, 2));
            */

            let numErrMsgsFound = 0;
            for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE &&
                    (nextMsg.msgText.includes("Encountered the following error while trying to convert V1 profiles:") ||
                     nextMsg.msgText.includes(fakeErrMsg)))
                {
                    numErrMsgsFound++;
                }
            }
            expect(numErrMsgsFound).toEqual(2);
        });
    }); // end convert

    describe("private functions", () => {
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
            jest.spyOn(Logger, "getImperativeLogger").mockReturnValue({
                error: jest.fn()
            } as any);
        });

        beforeEach(() => {
            // create the result normally created by the public function convert()
            ConvertV1Profiles["convertResult"] = {
                msgs: [],
                v1ScsPluginName: null,
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
            it("should return false if a client config exists", () => {
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
                const convNeeded = ConvertV1Profiles["isConversionNeeded"]();

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

            it("should return false if we find no V1 profiles", () => {
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
                const convNeeded = ConvertV1Profiles["isConversionNeeded"]();

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

            it("should return false if no profiles directory exists", () => {
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
                const profileDir = "/fake/path/to/profiles/";
                ConvertV1Profiles["profilesRootDir"] = profileDir;
                const noDirError = new ImperativeError({
                    additionalDetails: { code: 'ENOENT' }
                } as any);
                const getOldProfileCountSpy = jest.spyOn(ConvertV1Profiles as any, "getOldProfileCount")
                    .mockImplementationOnce(() => { throw noDirError; });

                // call the function that we want to test
                const convNeeded = ConvertV1Profiles["isConversionNeeded"]();

                expect(getOldProfileCountSpy).toHaveBeenCalled();
                expect(convNeeded).toEqual(false);

                let numErrMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE &&
                        nextMsg.msgText.includes(`Did not convert any V1 profiles because ` +
                        `no V1 profiles were found at "${profileDir}"`)
                    ) {
                        numErrMsgsFound++;
                    }
                }
                expect(numErrMsgsFound).toEqual(1);
            });

            it("should return false if an IO error occurs while reading profiles", () => {
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
                const profileDir = "/fake/path/to/profiles/";
                ConvertV1Profiles["profilesRootDir"] = profileDir;
                const ioErrMsg = "Fake I/O error occurred";
                const ioError = new ImperativeError({
                    msg: ioErrMsg
                });
                const getOldProfileCountSpy = jest.spyOn(ConvertV1Profiles as any, "getOldProfileCount")
                    .mockImplementationOnce(() => { throw ioError; });

                // call the function that we want to test
                const convNeeded = ConvertV1Profiles["isConversionNeeded"]();

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

            it("should return true if we find some V1 profiles", () => {
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
                const convNeeded = ConvertV1Profiles["isConversionNeeded"]();

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

                updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema")
                    .mockReturnValue(0 as any);

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
                expect(updateSchemaSpy).toHaveBeenCalled();
                expect(saveSpy).toHaveBeenCalled();
                expect(renameSpy).toHaveBeenCalled();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if ((nextMsg.msgText.includes("Your old V1 profiles have been moved") &&
                             nextMsg.msgText.includes("Delete them by re-running this operation and requesting deletion"))
                            ||
                            (nextMsg.msgText.includes("Your new profiles have been saved") &&
                            nextMsg.msgText.includes("To change your configuration, update that file in your text editor"))
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
                            nextMsg.msgText.includes(renameError)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(3);
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

            it("should delete the old v1 profiles directory", async () => {
                // pretend that we found no secure property names under any old-school service
                jest.spyOn(ConvertV1Profiles as any, "findOldSecureProps")
                    .mockResolvedValue(Promise.resolve([]));

                // pretend that the profiles directory exists
                const existsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);

                // pretend that remove worked
                ConvertV1Profiles["oldProfilesDir"] = "/fake/path/to/profiles-old";
                const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockReturnValue(0 as any);

                // call the function that we want to test
                await ConvertV1Profiles["deleteV1Profiles"]();

                expect(removeSyncSpy).toHaveBeenCalled();
                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if (nextMsg.msgText.includes("Deleted the old profiles directory") &&
                            nextMsg.msgText.includes(ConvertV1Profiles["oldProfilesDir"])
                        ) {
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

                // pretend that remove crashed
                const removeError = "fsExtra.removeSync threw a horrible error";
                const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockImplementation(() => {
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
                        if ((nextMsg.msgText.includes("Failed to delete the profiles directory") &&
                            nextMsg.msgText.includes("profiles-old"))
                            ||
                            nextMsg.msgText.includes(removeError)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
            });

            it("should also delete credentials stored by old SCS plugin", async () => {
                // pretend that we found secure property names under one old-school service
                jest.spyOn(ConvertV1Profiles as any, "findOldSecureProps")
                    .mockResolvedValueOnce(Promise.resolve(["secureUser", "securePassword"]));

                jest.spyOn(ConvertV1Profiles as any, "deleteOldSecureProps")
                    .mockResolvedValue(Promise.resolve(true));

                // pretend that remove worked
                const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockReturnValue(0 as any);

                // call the function that we want to test
                await ConvertV1Profiles["deleteV1Profiles"]();

                expect(removeSyncSpy).toHaveBeenCalled();
                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.REPORT_LINE) {
                        if (nextMsg.msgText.includes("Deleted secure value for ") &&
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
                // pretend that we found secure property names under one old-school service
                jest.spyOn(ConvertV1Profiles as any, "findOldSecureProps")
                    .mockResolvedValueOnce(Promise.resolve(["secureUser", "securePassword"]));

                // pretend that secure credential deletion failed
                jest.spyOn(ConvertV1Profiles as any, "deleteOldSecureProps")
                    .mockResolvedValue(Promise.resolve(false));

                // pretend that remove worked
                const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockReturnValue(0 as any);

                // call the function that we want to test
                await ConvertV1Profiles["deleteV1Profiles"]();

                expect(removeSyncSpy).toHaveBeenCalled();
                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Failed to delete secure value") &&
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

            it("should report an error when the zowe keyring is unavailable", async () => {
                // pretend that the zowe keyring is unavailable
                const checkKeyRingSpy = jest.spyOn(ConvertV1Profiles as any, "checkZoweKeyRingAvailable")
                    .mockResolvedValue(Promise.resolve(false));

                // pretend that remove worked
                const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockReturnValue(0 as any);

                // call the function that we want to test
                await ConvertV1Profiles["deleteV1Profiles"]();

                expect(removeSyncSpy).toHaveBeenCalled();
                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes(
                            "Zowe keyring or the credential vault are unavailable. Unable to delete old secure values"))
                        {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(1);
                checkKeyRingSpy.mockRestore();  // back to original app implementation
            });
        }); // end deleteV1Profiles

        describe("removeOldOverrides", () => {

            it("should do nothing if there are no overrides", () => {
                // pretend that no overrides exist
                jest.spyOn(ConvertV1Profiles as any, "getOldPluginInfo")
                    .mockReturnValueOnce({ plugins: [], overrides: [] });

                const appSettingsGetSpy = jest.spyOn(AppSettings, "instance", "get");

                // call the function that we want to test
                let caughtErr: any;
                try {
                    ConvertV1Profiles["removeOldOverrides"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(appSettingsGetSpy).not.toHaveBeenCalled();
            });

            it("should replace a v1 SCS credential manager and report a v1 SCS plugin", () => {
                // pretend that we found an old credential manager
                const fakeV1ScsPlugin = "FakeScsPlugin";
                jest.spyOn(ConvertV1Profiles as any, "getOldPluginInfo").mockReturnValueOnce(
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

                // Avoid using the real secure credMgr. Pretend it works.
                setCredMgrState("works");

                // call the function that we want to test
                let caughtErr: any;
                try {
                    ConvertV1Profiles["removeOldOverrides"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(caughtErr).not.toBeDefined();
                expect(appSettingsSetSpy).toHaveBeenCalledWith(
                    "overrides", "CredentialManager", CredentialManagerOverride.DEFAULT_CRED_MGR_NAME
                );
                expect(ConvertV1Profiles["convertResult"].v1ScsPluginName).toEqual(fakeV1ScsPlugin);
            });

            it("should catch and report an error thrown by AppSettings.instance.set", () => {
                // pretend that we found an old credential manager
                jest.spyOn(ConvertV1Profiles as any, "getOldPluginInfo").mockReturnValueOnce(
                    { plugins: [], overrides: ["CredentialManager"] }
                );

                // pretend that AppSettings.instance.set throws an exception
                const fakeErrMsg = "A fake exception from AppSettings.instance.set";
                const appSettingsSetSpy = jest.fn().mockImplementation(() => {
                    throw new Error(fakeErrMsg);
                });
                jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                    set: appSettingsSetSpy
                } as any);

                // call the function that we want to test
                let caughtErr: any;
                try {
                    ConvertV1Profiles["removeOldOverrides"]();
                } catch (err) {
                    caughtErr = err;
                }

                expect(appSettingsSetSpy).toHaveBeenCalled();
                expect(caughtErr).not.toBeDefined();

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Failed to replace credential manager override setting") ||
                            nextMsg.msgText.includes(fakeErrMsg)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
            });
        }); // end removeOldOverrides

        describe("getOldPluginInfo", () => {

            it("should retrieve old credMgr override and old plugin", () => {
                // pretend that we find the old SCS CredMgr name
                const oldScsName = "@zowe/secure-credential-store-for-zowe-cli";
                const appSettingsGetSpy = jest.fn().mockReturnValue(oldScsName);
                jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                    get: appSettingsGetSpy
                } as any);

                // pretend that PluginIssues.instance.getInstalledPlugins returns the name of the old SCS
                const getPluginsSpy = jest.fn().mockReturnValue({
                    [oldScsName]: {},
                    "AnIrrelevantPluginName": {}
                } as any);
                jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
                    getInstalledPlugins: getPluginsSpy
                } as any);

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
                expect(getPluginsSpy).toHaveBeenCalled();

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

            it("should catch exception from AppSettings.instance.get and record error", () => {
                // pretend that AppSettings.instance.get crashes
                const fakeErrMsg = "A fake exception from AppSettings.instance.get";
                const appSettingsGetSpy = jest.fn().mockImplementation(() => {
                    throw new Error(fakeErrMsg);
                });
                jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                    get: appSettingsGetSpy
                } as any);

                // pretend that PluginIssues.instance.getInstalledPlugins returns no plugins
                const getPluginsSpy = jest.fn().mockReturnValue({} as any);
                jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
                    getInstalledPlugins: getPluginsSpy
                } as any);

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
                expect(getPluginsSpy).toHaveBeenCalled();
                expect(pluginInfo.overrides.length).toEqual(0);
                expect(pluginInfo.plugins.length).toEqual(0);

                let numMsgsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Failed trying to read 'CredentialManager' overrides.") ||
                            nextMsg.msgText.includes(fakeErrMsg)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
            });

            it("should catch exception from PluginIssues.instance.getInstalledPlugins and record error", () => {
                // pretend that we find the old SCS CredMgr name
                const oldScsName = "@zowe/secure-credential-store-for-zowe-cli";
                const appSettingsGetSpy = jest.fn().mockReturnValue(oldScsName);
                jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                    get: appSettingsGetSpy
                } as any);

                // pretend that PluginIssues.instance.getInstalledPlugins crashes
                const fakeErrMsg = "A fake exception from PluginIssues.instance.getInstalledPlugins";
                const getPluginsSpy = jest.fn().mockImplementation(() => {
                    throw new Error(fakeErrMsg);
                });
                jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
                    getInstalledPlugins: getPluginsSpy
                } as any);

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
                expect(getPluginsSpy).toHaveBeenCalled();
                expect(pluginInfo.plugins.length).toEqual(0);

                let numItemsFound = 0;
                for (const nextOverride of pluginInfo.overrides) {
                    if (nextOverride === "CredentialManager") {
                        numItemsFound++;
                    }
                }
                expect(numItemsFound).toEqual(1);

                numItemsFound = 0;
                for (const nextMsg of ConvertV1Profiles["convertResult"].msgs) {
                    if (nextMsg.msgFormat & ConvertMsgFmt.ERROR_LINE) {
                        if (nextMsg.msgText.includes("Failed trying to get the set of installed plugins") ||
                            nextMsg.msgText.includes(fakeErrMsg)
                        ) {
                            numItemsFound++;
                        }
                    }
                }
                expect(numItemsFound).toEqual(2);
            });
        }); // end getOldPluginInfo

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

        describe("checkZoweKeyRingAvailable", () => {

            it("should return true if it finds credentials in the value", async () => {
                // call the function that we want to test
                const result = await ConvertV1Profiles["checkZoweKeyRingAvailable"]();
                expect(result).toEqual(true);
            });
        }); // end checkZoweKeyRingAvailable

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
                        { account: "account4", password: "password4" },
                    ])
                } as any;

                // call the function that we want to test
                const oldSecurePropNames = await ConvertV1Profiles["findOldSecureProps"]("ServiceNameDoesNotMatter");

                expect(oldSecurePropNames).toContain("account1");
                expect(oldSecurePropNames).toContain("account2");
                expect(oldSecurePropNames).toContain("account3");
                expect(oldSecurePropNames).toContain("account4");

                ConvertV1Profiles["zoweKeyRing"] = origZoweKeyRing;
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
                            `for service '${fakeServiceName}':`)
                            ||
                            nextMsg.msgText.includes(fakeFindCredError)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
                ConvertV1Profiles["zoweKeyRing"] = origZoweKeyRing;
            });
        }); // end findOldSecureProps

        describe("deleteOldSecureProps", () => {

            beforeEach(() => {
                jest.restoreAllMocks(); // put spies back to original app implementation
            });

            it("should delete the specified secure property", async () => {
                // pretend that we successfully deleted the secure property
                const origZoweKeyRing = ConvertV1Profiles["zoweKeyRing"];
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
                            `service '${fakeAcct}/${fakeProp}':`)
                            ||
                            nextMsg.msgText.includes(fakeDelPassError)
                        ) {
                            numMsgsFound++;
                        }
                    }
                }
                expect(numMsgsFound).toEqual(2);
                ConvertV1Profiles["zoweKeyRing"] = origZoweKeyRing;
            });
        }); // end deleteOldSecureProps
    }); // end private functions
});
