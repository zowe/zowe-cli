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
import * as lodash from "lodash";
import { CredentialManagerFactory } from "../../security";
import { ImperativeError } from "../../error/src/ImperativeError";
import { Config } from "../src/Config";
import { IConfig } from "../src/doc/IConfig";
import { IConfigSecure } from "../src/doc/IConfigSecure";
import { IConfigVault } from "../src/doc/IConfigVault";

const MY_APP = "my_app";

const projectConfigPath = path.join(__dirname, "__resources__/project.config.json");
const projectUserConfigPath = path.join(__dirname, "__resources__/project.config.user.json");
const securePropPath = "profiles.fruit.properties.secret";
const secureConfigs: IConfigSecure = {
    [projectConfigPath]: {
        [securePropPath]: "area51"
    },
    fakePath: {
        [securePropPath]: "area52"
    }
};

describe("Config secure tests", () => {
    let mockSecureLoad = jest.fn();
    let mockSecureSave = jest.fn();
    let mockVault: IConfigVault = {
        load: mockSecureLoad,
        save: mockSecureSave
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        mockSecureLoad = jest.fn();
        mockSecureSave = jest.fn();
        mockVault = {
            load: mockSecureLoad,
            save: mockSecureSave
        };
    });

    it("should set vault if provided for secure load", async () => {
        const config = new (Config as any)();
        expect((config as any).mVault).toBeUndefined();
        await (config.api.secure as any).load(mockVault);
        expect((config as any).mVault).toBe(mockVault);
    });

    it("should skip secure save if there are no secure properties or anything in keytar", async () => {
        const config = new (Config as any)();
        config.mLayers = [
            {
                properties: { profiles: { fake: { secure: [] } } }
            }
        ];
        config.mVault = mockVault;
        config.mSecure = {};
        await (config.api.secure as any).save(true);
        expect(mockSecureLoad).toHaveBeenCalledTimes(0);
        expect(mockSecureSave).toHaveBeenCalledTimes(0);
    });

    it("should secure save if there are secure properties", async () => {
        const config = new (Config as any)();
        config.mLayers = [
            {
                path: "fake fakety fake",
                properties: { profiles: {fake: { secure: ["fake"], properties: {fake: "fake"}}}}
            }
        ];
        config.mVault = mockVault;
        config.mSecure = {};
        await (config.api.secure as any).save(true);
        expect(mockSecureLoad).toHaveBeenCalledTimes(0);
        expect(mockSecureSave).toHaveBeenCalledTimes(1);
    });

    it("should load and save all secure properties", async () => {
        jest.spyOn(Config, "search").mockReturnValueOnce(projectUserConfigPath).mockReturnValueOnce(projectConfigPath);
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false);
        mockSecureLoad.mockReturnValueOnce(JSON.stringify(secureConfigs));
        const config = await Config.load(MY_APP, { vault: mockVault });
        // Check that secureLoad was called and secure value was extracted
        expect(mockSecureLoad).toHaveBeenCalledWith("secure_config_props");
        expect(config.properties.profiles.fruit.properties.secret).toBe("area51");

        const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
        await config.save(false);

        // Check that secureSave was called, secure value was preserved in
        // active layer, and the value was excluded from the config file
        expect(mockSecureSave).toHaveBeenCalledTimes(1);
        expect(mockSecureSave.mock.calls[0][0]).toBe("secure_config_props");
        expect(mockSecureSave.mock.calls[0][1]).toContain("area51");
        expect(config.properties.profiles.fruit.properties.secret).toBe("area51");
        expect(writeFileSpy).toHaveBeenCalled();
        expect(writeFileSpy.mock.calls[0][1]).not.toContain("area51");
    });

    it("should toggle the security of a property if requested", async () => {
        jest.spyOn(Config, "search").mockReturnValue(projectConfigPath);
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValue(false);
        mockSecureLoad.mockImplementation();
        const config = await Config.load(MY_APP, { vault: mockVault });

        config.set(securePropPath, "notSecret", { secure: false });
        let layer = config.api.layers.get();
        expect(layer.properties.profiles.fruit.secure.includes("secret")).toBe(false);

        config.set(securePropPath, "area51", { secure: true });
        layer = config.api.layers.get();
        expect(layer.properties.profiles.fruit.secure.includes("secret")).toBe(true);
    });

    it("should not actually load config that has a bad vault when noLoad specified", async () => {
        jest.spyOn(Config, "search").mockReturnValue(__dirname + "/__resources__/badproject.config.json");
        jest.spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)     // Project user layer
            .mockReturnValueOnce(true)      // Project layer
            .mockReturnValueOnce(false)     // User layer
            .mockReturnValueOnce(false);    // Global layer
        jest.spyOn(fs, "readFileSync");
        let secureError: any;
        const vault: IConfigVault = {
            load: jest.fn().mockRejectedValue(new ImperativeError({msg: "The vault failed"})),
            save: jest.fn()
        };
        const config = await Config.load(MY_APP, {noLoad: true, vault: vault});
        config.mVault = vault;
        try {
            await config.api.secure.load(vault);
        } catch (err) {
            secureError = err;
        }
        expect(vault.load).toHaveBeenCalledTimes(1);
        expect(secureError).toBeDefined();
        expect(config.properties).toMatchSnapshot();
    });

    it("should list all secure fields in config layer", async () => {
        jest.spyOn(Config, "search").mockReturnValue(projectConfigPath);
        jest.spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)     // Project user layer
            .mockReturnValueOnce(true)      // Project layer
            .mockReturnValueOnce(false)     // User layer
            .mockReturnValueOnce(false);    // Global layer
        jest.spyOn(fs, "readFileSync");
        const config = await Config.load(MY_APP);
        expect(config.api.secure.secureFields()).toEqual(["profiles.fruit.properties.secret"]);
    });

    it("should list all secure fields for a profile", async () => {
        jest.spyOn(Config, "search").mockReturnValue(projectConfigPath);
        jest.spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)     // Project user layer
            .mockReturnValueOnce(true)      // Project layer
            .mockReturnValueOnce(false)     // User layer
            .mockReturnValueOnce(false);    // Global layer
        jest.spyOn(fs, "readFileSync");
        const config = await Config.load(MY_APP);
        expect(config.api.secure.securePropsForProfile("fruit.apple")).toEqual(["secret"]);
    });

    describe("secureInfoForProp", () => {
        const configProperties: IConfig = {
            profiles: {
                fruit: {
                    type: "fruit",
                    profiles: {
                        apple: {
                            type: "apple",
                            properties: {}
                        }
                    },
                    properties: {}
                }
            },
            defaults: {}
        };

        it("should return info for same level property when secure array includes property at higher level", () => {
            const config = new (Config as any)();
            const secureConfigProperties = lodash.cloneDeep(configProperties);
            secureConfigProperties.profiles.fruit.secure = ["secret"];
            jest.spyOn(config, "layerActive").mockReturnValueOnce({
                exists: true,
                properties: secureConfigProperties
            });
            expect(config.api.secure.secureInfoForProp("profiles.fruit.profiles.apple.properties.secret", false)).toMatchObject({
                path: "profiles.fruit.profiles.apple.secure",
                prop: "secret"
            });
        });

        it("should return undefined when input is not a property path", () => {
            const config = new (Config as any)();
            expect(config.api.secure.secureInfoForProp("profiles.fruit")).toBeUndefined();
        });

        describe("when findUp is true", () => {
            it("should return info for property when layer does not exist", () => {
                const config = new (Config as any)();
                jest.spyOn(config, "layerActive").mockReturnValueOnce({ exists: false });
                expect(config.api.secure.secureInfoForProp("profiles.fruit.profiles.apple.properties.secret", true)).toMatchObject({
                    path: "profiles.fruit.profiles.apple.secure",
                    prop: "secret"
                });
            });

            it("should return info for property when secure array does not exist", () => {
                const config = new (Config as any)();
                jest.spyOn(config, "layerActive").mockReturnValueOnce({
                    exists: true,
                    properties: configProperties
                });
                expect(config.api.secure.secureInfoForProp("profiles.fruit.profiles.apple.properties.secret", true)).toMatchObject({
                    path: "profiles.fruit.profiles.apple.secure",
                    prop: "secret"
                });
            });

            it("should return info for same level property when secure array includes property at same level", () => {
                const config = new (Config as any)();
                const secureConfigProperties = lodash.cloneDeep(configProperties);
                secureConfigProperties.profiles.fruit.profiles.apple.secure = ["secret"];
                jest.spyOn(config, "layerActive").mockReturnValueOnce({
                    exists: true,
                    properties: secureConfigProperties
                });
                expect(config.api.secure.secureInfoForProp("profiles.fruit.profiles.apple.properties.secret", true)).toMatchObject({
                    path: "profiles.fruit.profiles.apple.secure",
                    prop: "secret"
                });
            });

            it("should return info for higher level property when secure array includes property at higher level", () => {
                const config = new (Config as any)();
                const secureConfigProperties = lodash.cloneDeep(configProperties);
                secureConfigProperties.profiles.fruit.secure = ["secret"];
                jest.spyOn(config, "layerActive").mockReturnValueOnce({
                    exists: true,
                    properties: secureConfigProperties
                });
                expect(config.api.secure.secureInfoForProp("profiles.fruit.profiles.apple.properties.secret", true)).toMatchObject({
                    path: "profiles.fruit.secure",
                    prop: "secret"
                });
            });
        });
    });

    it("rmUnusedProps should delete properties for files that do not exist", () => {
        const config = new (Config as any)();
        config.mSecure = {...secureConfigs};
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(false);
        const prunedFiles = config.api.secure.rmUnusedProps();
        expect(prunedFiles).toEqual(["fakePath"]);
        expect(config.mSecure[projectConfigPath]).toBeDefined();
        expect(config.mSecure["fakePath"]).toBeUndefined();
    });

    describe("loadFailed", () => {
        const mockCredMgrInitialized = jest.fn().mockReturnValue(true);

        beforeAll(() => {
            Object.defineProperty(CredentialManagerFactory, "initialized", { get: mockCredMgrInitialized });
        });

        it("should be false if credentials loaded successfully", async () => {
            jest.spyOn(Config, "search").mockReturnValue(projectConfigPath);
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValue(false);
            mockSecureLoad.mockImplementation();
            const config = await Config.load(MY_APP, { vault: mockVault });
            expect(config.api.secure.loadFailed).toBe(false);
        });

        it("should be true if credentials failed to load", async () => {
            const secureLoadError = new Error("failed to load credentials");
            jest.spyOn(Config, "search").mockReturnValue(projectConfigPath);
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValue(false);
            mockSecureLoad.mockReturnValueOnce(undefined).mockRejectedValue(secureLoadError);

            const config = await Config.load(MY_APP, { vault: mockVault });
            let caughtError: Error;
            try {
                await config.api.secure.load();
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toBe(secureLoadError.message);
            expect(config.api.secure.loadFailed).toBe(true);
        });

        it("should be true if credential manager failed to load", async () => {
            jest.spyOn(Config, "search").mockReturnValue(projectConfigPath);
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValue(false);
            mockCredMgrInitialized.mockReturnValueOnce(false);
            mockSecureLoad.mockImplementation();
            const config = await Config.load(MY_APP, { vault: mockVault });
            expect(config.api.secure.loadFailed).toBe(true);
        });
    });
});
