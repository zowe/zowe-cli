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

import { CommandResponse } from "../../../../../cmd/src/response/CommandResponse";
import { IO } from "../../../../../io";
import { ImperativeConfig } from "../../../../../utilities";
import { PluginIssues } from "../../../../src/plugins/utilities/PluginIssues";

import { EnvQuery, IGetItemOpts, IGetItemVal } from "../../../../src/config/cmd/report-env/EnvQuery";
import { ItemId } from "../../../../src/config/cmd/report-env/EnvItems";

describe("Tests for EnvQuery module", () => {
    const fakeCliHomeDir = "this_is_a_fake_cli_home_dir";
    let impCfg: ImperativeConfig;
    let pluginIssInst: PluginIssues;
    let getPluginsSpy;

    beforeAll(() => {
        // set list of installed plugins
        pluginIssInst = PluginIssues.instance;
        getPluginsSpy = jest.spyOn(pluginIssInst as any, "getInstalledPlugins")
            .mockReturnValue({
                "@zowe/cics-for-zowe-cli": {
                    package: "@zowe/cics-for-zowe-cli",
                    registry: "https://registry.npmjs.org/",
                    version: "5.0.0"
                },
                "@broadcom/endevor-for-zowe-cli": {
                    package: "@broadcom/endevor-for-zowe-cli@zowe-v2-lts",
                    registry: "https://registry.npmjs.org/",
                    version: "7.1.0"
                },
                "@zowe/ims-for-zowe-cli": {
                    package: "@zowe/ims-for-zowe-cli",
                    registry: "https://registry.npmjs.org/",
                    version: "3.0.0"
                },
                "@zowe/zos-ftp-for-zowe-cli": {
                    package: "@zowe/zos-ftp-for-zowe-cli",
                    registry: "https://registry.npmjs.org/",
                    version: "2.1.0"
                }
            });

        // set ImperativeConfig properties for a v2 config
        impCfg = ImperativeConfig.instance;
        impCfg.rootCommandName = "zowe";
        (impCfg.loadedConfig as any) = { daemonMode: false };

        Object.defineProperty(impCfg, "config", {
            configurable: true,
            get: jest.fn(() => {
                return {
                    exists: true,
                    properties: {
                        profiles: {
                            fakeBaseProfNm: {},
                            fakeZosmfProfNm: {},
                            fakeJclCheckProfNm: {},
                            fakeTsoProfNm: {},
                            fakeCicsProfNm: {}
                        }
                    },
                    mProperties: {
                        defaults: {
                            base: "fakeBaseProfNm",
                            zosmf: "fakeZosmfProfNm",
                            jclcheck: "fakeJclCheckProfNm",
                            tso: "fakeTsoProfNm",
                            cics: "fakeCicsProfNm"
                        }
                    },
                    layers: [{
                        exists: true,
                        global: true,
                        user: false,
                        path: "fakeDir/zowe.config.json",
                        properties: {
                            profiles: {
                                fakeProf: {
                                    secure: ["fakeSecureName"],
                                    properties: {fakePropNm: "fakePropVal"}
                                }
                            }
                        }
                    }],
                    api: {
                        secure: {
                            secureFields: jest.fn(() => { return []; })
                        }
                    }
                };
            })
        });
        Object.defineProperty(impCfg, "cliHome", {
            configurable: true,
            get: jest.fn(() => {
                return fakeCliHomeDir;
            })
        });
    });

    describe("test getEnvItemVal function", () => {
        it("should report the zowe version", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_VER);
            expect(itemObj.itemVal).toMatch(/[0-9]+.[0-9]+.[0-9]+/);
            expect(itemObj.itemValMsg).toContain("Zowe CLI version =");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report the NodeJs version", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.NODEJS_VER);
            expect(itemObj.itemVal).toMatch(/[0-9]+.[0-9]+.[0-9]+/);
            expect(itemObj.itemValMsg).toContain("Node.js version =");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report the NVM version", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.NVM_VER);
            if (!itemObj.itemVal.includes("nvm failed to display any output")) {
                expect(itemObj.itemVal).toMatch(/[0-9]+.[0-9]+.[0-9]+/);
                expect(itemObj.itemValMsg).toContain("Node Version Manager version =");
            }
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report the platform", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.PLATFORM);
            expect(itemObj.itemVal === "win32" || itemObj.itemVal === "linux" || itemObj.itemVal === "darwin").toBeTruthy();
            expect(itemObj.itemValMsg).toContain("O.S. platform =");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report the architecture", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ARCHITECTURE);
            expect(
                itemObj.itemVal === "arm"   || itemObj.itemVal === "arm64"  || itemObj.itemVal === "ia32" ||
                itemObj.itemVal === "mips"  || itemObj.itemVal === "mipsel" || itemObj.itemVal === "ppc" ||
                itemObj.itemVal === "ppc64" || itemObj.itemVal === "s390"   || itemObj.itemVal === "s390x" ||
                itemObj.itemVal === "x64"
            ).toBeTruthy();
            expect(itemObj.itemValMsg).toContain("O.S. architecture =");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report the OS command path", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.OS_PATH);
            expect(itemObj.itemValMsg).toContain("O.S. PATH =");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report the ZOWE_CLI_HOME", async () => {
            // cliHome is a getter property, so mock the property
            Object.defineProperty(impCfg, "cliHome", {
                configurable: true,
                get: jest.fn(() => {
                    return fakeCliHomeDir;
                })
            });

            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_CLI_HOME);
            expect(itemObj.itemVal).toContain("undefined");
            expect(itemObj.itemVal).toContain("Default = " + fakeCliHomeDir);
            expect(itemObj.itemValMsg).toContain("ZOWE_CLI_HOME =");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report an undefined ZOWE_APP_LOG_LEVEL", async () => {
            delete process.env.ZOWE_APP_LOG_LEVEL;
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_APP_LOG_LEVEL);
            expect(itemObj.itemVal).toBeUndefined();
            expect(itemObj.itemValMsg).toContain("ZOWE_APP_LOG_LEVEL = undefined");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report a valid ZOWE_APP_LOG_LEVEL", async () => {
            const logLevVal = "error";
            process.env.ZOWE_APP_LOG_LEVEL = logLevVal;
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_APP_LOG_LEVEL);
            expect(itemObj.itemVal).toBe(logLevVal);
            expect(itemObj.itemValMsg).toBe("ZOWE_APP_LOG_LEVEL = " + logLevVal);
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report a bogus ZOWE_APP_LOG_LEVEL", async () => {
            const logLevVal = "bogus";
            process.env.ZOWE_APP_LOG_LEVEL = logLevVal;
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_APP_LOG_LEVEL);
            expect(itemObj.itemVal).toBe(logLevVal);
            expect(itemObj.itemValMsg).toBe("ZOWE_APP_LOG_LEVEL = " + logLevVal);
            expect(itemObj.itemProbMsg).toContain("The ZOWE_APP_LOG_LEVEL must be set to one of:");
        });

        it("should report a valid ZOWE_IMPERATIVE_LOG_LEVEL", async () => {
            const logLevVal = "warn";
            process.env.ZOWE_IMPERATIVE_LOG_LEVEL = logLevVal;
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_IMPERATIVE_LOG_LEVEL);
            expect(itemObj.itemVal).toBe(logLevVal);
            expect(itemObj.itemValMsg).toBe("ZOWE_IMPERATIVE_LOG_LEVEL = " + logLevVal);
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report other Zowe variables", async () => {
            const newVarVal = "NewZoweVar";
            const otherVarVal = "OtherZoweVar";
            process.env.ZOWE_SOME_NEW_VAR  = newVarVal;
            process.env.ZOWE_SOME_OTHER_VAR = otherVarVal;
            process.env.ZOWE_PASSWORD_VAR = "ThisShouldBeASecret";

            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.OTHER_ZOWE_VARS);
            expect(itemObj.itemVal).toBeNull();
            expect(itemObj.itemValMsg).toContain("ZOWE_SOME_NEW_VAR = " + newVarVal);
            expect(itemObj.itemValMsg).toContain("ZOWE_SOME_OTHER_VAR = " + otherVarVal);
            expect(itemObj.itemValMsg).toContain("ZOWE_PASSWORD_VAR = " + "******");
            expect(itemObj.itemProbMsg).toBe("");

            delete process.env.ZOWE_SOME_NEW_VAR;
            delete process.env.ZOWE_SOME_OTHER_VAR;
            delete process.env.ZOWE_PASSWORD_VAR;
        });

        it("should report that no other Zowe variables are set", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.OTHER_ZOWE_VARS);
            expect(itemObj.itemVal).toBeNull();
            expect(itemObj.itemValMsg).toContain("No other 'ZOWE_' variables have been set.");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report the NPM Version", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.NPM_VER);
            expect(itemObj.itemVal).toMatch(/[0-9]+.[0-9]+.[0-9]+/);
            expect(itemObj.itemValMsg).toContain("NPM version =");
            expect(itemObj.itemValMsg).toContain("Shell =");
            expect(itemObj.itemValMsg).toContain("Global prefix =");
            expect(itemObj.itemValMsg).toContain("The directory above contains the Zowe Node.js command script.");
            expect(itemObj.itemValMsg).toContain("Global root node modules =");
            expect(itemObj.itemValMsg).toContain("Global config =");
            expect(itemObj.itemValMsg).toContain("Local prefix =");
            expect(itemObj.itemValMsg).toContain("Local root node modules =");
            expect(itemObj.itemValMsg).toContain("User config =");
            expect(itemObj.itemValMsg).toContain("registry =");
            expect(itemObj.itemValMsg).toContain("cwd =");
            expect(itemObj.itemValMsg).toContain("HOME =");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report installed plugins", async () => {
            const cmdResp: CommandResponse = new CommandResponse();
            const getItemOpts: IGetItemOpts = {
                progressApi: cmdResp.progress
            };

            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_PLUGINS, getItemOpts);
            expect(itemObj.itemVal).toBe(null);
            expect(itemObj.itemValMsg).toContain("Installed plugins");
            expect(itemObj.itemValMsg).toContain("cics-for-zowe-cli");
            expect(itemObj.itemValMsg).toContain("endevor-for-zowe-cli");
            expect(itemObj.itemValMsg).toContain("ims-for-zowe-cli");
            expect(itemObj.itemValMsg).toContain("zos-ftp-for-zowe-cli");
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report an unknown item id", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(999);
            expect(itemObj.itemProbMsg).toBe("An unknown item ID was supplied = 999");
        });

        it("should report Zowe V2 configuration info", async () => {
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_CONFIG_TYPE);
            expect(itemObj.itemVal).toContain("V2 Team Config");
            expect(itemObj.itemValMsg).toContain("Zowe daemon mode = off");
            expect(itemObj.itemValMsg).toContain("Zowe config type = V2 Team Config");
            expect(itemObj.itemValMsg).toContain("Team config files in effect:");
            expect(itemObj.itemValMsg).toContain("fakeDir/zowe.config.json");
            expect(itemObj.itemValMsg).toMatch(/base = +fakeBaseProfNm/);
            expect(itemObj.itemValMsg).toMatch(/zosmf = +fakeZosmfProfNm/);
            expect(itemObj.itemValMsg).toMatch(/jclcheck = +fakeJclCheckProfNm/);
            expect(itemObj.itemValMsg).toMatch(/tso = +fakeTsoProfNm/);
            expect(itemObj.itemValMsg).toMatch(/cics = +fakeCicsProfNm/);
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report when daemon is on", async () => {
            (impCfg.loadedConfig as any) = { daemonMode: true };

            // return the values that we want from external commands
            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_CONFIG_TYPE);
            expect(itemObj.itemVal).toContain("V2 Team Config");
            expect(itemObj.itemValMsg).toContain("Zowe daemon mode = on");
            expect(itemObj.itemValMsg).toMatch(/Default Zowe daemon executable directory = this_is_a_fake_cli_home_dir.bin/);
            expect(itemObj.itemProbMsg).toBe("");
        });

        it("should report Zowe V1 configuration info", async () => {
            // set ImperativeConfig properties to what we want
            Object.defineProperty(impCfg, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: false
                    };
                })
            });

            const isDirSpy = jest.spyOn(IO as any, "isDir")
                .mockReturnValue(true);

            const endvProfDir = "endevor";
            const tsoProfDir = "tso";
            const zosmfProfDir = "zosmf";
            const prof1 = "_prof_1";
            const prof2 = "_prof_2";
            const prof3 = "_prof_3";
            const readDirSyncSpy = jest.spyOn(fs, "readdirSync")
                .mockReturnValueOnce([
                    endvProfDir as unknown as fs.Dirent,
                    tsoProfDir as unknown as fs.Dirent,
                    zosmfProfDir as unknown as fs.Dirent
                ]).mockReturnValueOnce([
                    endvProfDir + prof1 as unknown as fs.Dirent,
                    endvProfDir + prof2 as unknown as fs.Dirent,
                    endvProfDir + prof3 as unknown as fs.Dirent
                ]).mockReturnValueOnce([
                    tsoProfDir + prof1 as unknown as fs.Dirent,
                    tsoProfDir + prof2 as unknown as fs.Dirent,
                    tsoProfDir + prof3 as unknown as fs.Dirent
                ]).mockReturnValueOnce([
                    zosmfProfDir + prof1 as unknown as fs.Dirent,
                    zosmfProfDir + prof2 as unknown as fs.Dirent,
                    zosmfProfDir + prof3 as unknown as fs.Dirent
                ]);

            const itemObj: IGetItemVal = await EnvQuery.getEnvItemVal(ItemId.ZOWE_CONFIG_TYPE);
            expect(itemObj.itemVal).toContain("V1 Profiles");
            expect(itemObj.itemValMsg).toContain("Zowe config type = V1 Profiles");
            expect(itemObj.itemValMsg).toContain("Available profiles:");
            expect(itemObj.itemValMsg).toContain(endvProfDir + " profiles:");
            expect(itemObj.itemValMsg).toContain(endvProfDir + prof1);
            expect(itemObj.itemValMsg).toContain(endvProfDir + prof2);
            expect(itemObj.itemValMsg).toContain(endvProfDir + prof3);
            expect(itemObj.itemValMsg).toContain(tsoProfDir + " profiles:");
            expect(itemObj.itemValMsg).toContain(tsoProfDir + prof1);
            expect(itemObj.itemValMsg).toContain(tsoProfDir + prof2);
            expect(itemObj.itemValMsg).toContain(tsoProfDir + prof3);
            expect(itemObj.itemValMsg).toContain(zosmfProfDir + " profiles:");
            expect(itemObj.itemValMsg).toContain(zosmfProfDir + prof1);
            expect(itemObj.itemValMsg).toContain(zosmfProfDir + prof2);
            expect(itemObj.itemValMsg).toContain(zosmfProfDir + prof3);
            expect(itemObj.itemProbMsg).toBe("");
        });
    }); // end getEnvItemVal function

    describe("test getCmdOutput", () => {
        it("should report a command that produces no output", async () => {
            /* Use EnvQuery["getCmdOutput"]() instead of EnvQuery.getCmdOutput()
             * so that we can call a private function.
             */
            const cmdOutput = await EnvQuery["getCmdOutput"]("bogusCmd", ["bogusArg"]);
            expect(cmdOutput).toContain("bogusCmd failed to display any output");
        });

        it("should report a command gave no output when it only outputs a newline", async () => {
            /* Use EnvQuery["getCmdOutput"]() instead of EnvQuery.getCmdOutput()
             * so that we can call a private function.
             */
            let cmdOutput: string;
            if (os.platform() === "win32") {
                cmdOutput = await EnvQuery["getCmdOutput"]("cmd", ["/C", "echo."]);
            } else {
                cmdOutput = await EnvQuery["getCmdOutput"]("echo", [""]);
            }
            expect(cmdOutput).toContain("Failed to get any information from");
        });

        it("should catch errors thrown by spawnSync", async () => {
            const spawn = require("cross-spawn");
            const spawnError = new Error("Pretend this was thrown by spawnSync");
            const isDirSpy = jest.spyOn(spawn, "sync").mockImplementation(() => {
                throw spawnError;
            });

            const cmdOutput = await EnvQuery["getCmdOutput"]("bogusCmd", ["bogusArg"]);
            expect(cmdOutput).toContain("Failed to run command = bogusCmd");
            expect(cmdOutput).toContain("Pretend this was thrown by spawnSync");
        });
    }); // end getCmdOutput function
}); // end Handler
