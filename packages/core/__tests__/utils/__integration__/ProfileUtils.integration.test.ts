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


import * as imperative from "@zowe/imperative";
import * as profileUtils from "../../../src/utils/ProfileUtils";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

const fs = require("fs");

const fakeServiceProfile: imperative.IProfile = {
    name: "fakeServiceProfile",
    type: "zosmf",
    host: "fakeHostService"
};

const fakeBaseProfile: imperative.IProfile = {
    name: "fakeBaseProfile",
    type: "base",
    host: "fakeHostBase"
};

const fakeProfileMissingInformation: imperative.IProfile = {
    name: "fakeServiceProfile",
    type: "zosmf",
    host: undefined
};

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("ProfileUtils", () => {
    describe("getDefaultProfile", () => {
        beforeAll(async () => {
            TEST_ENVIRONMENT = await TestEnvironment.setUp({
                testName: "core_utils_get_default_profile",
                skipProperties: true
            });
            process.env.ZOWE_CLI_HOME = TEST_ENVIRONMENT.workingDir;

            // copy existing profiles into test directory
            const response = runCliScript(__dirname + "/__scripts__/copy_profiles.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        beforeEach(() => {
            jest.resetAllMocks();

            // Pretend that we have no team config
            Object.defineProperty(imperative.ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: false
                    };
                })
            });
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        });


        it("Should return a service profile", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load")
                .mockResolvedValueOnce({ profile: fakeServiceProfile } as any);
            let error;
            let profile: imperative.IProfile;
            try {
                profile = await profileUtils.getDefaultProfile("zosmf", false);
            } catch (err) {
                error = err;
            }
            expect(error).not.toBeDefined();
            expect(profileManagerSpy).toHaveBeenCalledTimes(1);
            expect(profile).toEqual(fakeServiceProfile);
        });
        it("Should return a service profile even though base is missing", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load")
                .mockResolvedValueOnce({ profile: fakeServiceProfile } as any)
                .mockResolvedValueOnce({ profile: undefined } as any);
            let error;
            let profile: imperative.IProfile;
            try {
                profile = await profileUtils.getDefaultProfile("zosmf", true);
            } catch (err) {
                error = err;
            }
            expect(error).not.toBeDefined();
            expect(profileManagerSpy).toHaveBeenCalledTimes(2);
            expect(profile).toEqual(fakeServiceProfile);
        });
        it("Should return a base profile", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load")
                .mockResolvedValueOnce({ profile: undefined } as any)
                .mockResolvedValueOnce({ profile: fakeBaseProfile } as any);
            let error;
            let profile: imperative.IProfile;
            try {
                profile = await profileUtils.getDefaultProfile("zosmf", true);
            } catch (err) {
                error = err;
            }
            expect(error).not.toBeDefined();
            expect(profileManagerSpy).toHaveBeenCalledTimes(2);
            expect(profile).toEqual(fakeBaseProfile);
        });
        it("Should return a service profile even though base was specified", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load")
                .mockResolvedValueOnce({ profile: fakeServiceProfile } as any)
                .mockResolvedValueOnce({ profile: fakeBaseProfile } as any);
            let error;
            let profile: imperative.IProfile;
            try {
                profile = await profileUtils.getDefaultProfile("zosmf", true);
            } catch (err) {
                error = err;
            }
            expect(error).not.toBeDefined();
            expect(profileManagerSpy).toHaveBeenCalledTimes(2);
            expect(profile).toEqual(fakeServiceProfile);
        });
        it("Should properly combine profiles", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load")
                .mockResolvedValueOnce({ profile: fakeProfileMissingInformation } as any)
                .mockResolvedValueOnce({ profile: fakeBaseProfile } as any);
            let error;
            let profile: imperative.IProfile;
            try {
                profile = await profileUtils.getDefaultProfile("zosmf", true);
            } catch (err) {
                error = err;
            }
            expect(error).not.toBeDefined();
            expect(profileManagerSpy).toHaveBeenCalledTimes(2);
            expect(profile).toEqual({name: "fakeServiceProfile", type: "zosmf", host: "fakeHostBase"});
        });
        it("Should throw an error if it cannot get the service profile", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load").mockResolvedValueOnce({ profile: undefined } as any);
            let error;
            try {
                await profileUtils.getDefaultProfile("zosmf", false);
            } catch (err) {
                error = err;
            }
            expect(error).toBeDefined();
            expect(profileManagerSpy).toHaveBeenCalledTimes(1);
            expect(error.message).toContain("zosmf");
        });
        it("Should throw an error if it cannot get both profiles", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load").mockResolvedValue({ profile: undefined } as any);
            let error;
            try {
                await profileUtils.getDefaultProfile("zosmf", true);
            } catch (err) {
                error = err;
            }
            expect(error).toBeDefined();
            expect(profileManagerSpy).toHaveBeenCalledTimes(2);
            expect(error.message).toContain("zosmf");
            expect(error.message).toContain("base");
        });
    });
});