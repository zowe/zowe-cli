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

const fs = require("fs");

describe("CoreUtils", () => {
    describe("getDefaultProfile", () => {
        beforeEach(() => {
            jest.resetAllMocks();
            Object.defineProperty(imperative.CliProfileManager, "prototype", jest.fn(
                () => ({ load: jest.fn()})
            ));
        })
        it("Should return a service profile", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load").mockReturnValueOnce({profile: fakeServiceProfile});
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
        })
        it("Should return a service profile even though base is missing", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load")
                .mockReturnValueOnce({profile: fakeServiceProfile})
                .mockReturnValueOnce(undefined);
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
        })
        it("Should return a base profile", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load")
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce({profile: fakeBaseProfile});
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
        })
        it("Should return a service profile even though base was specified", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load")
                .mockReturnValueOnce({profile: fakeServiceProfile})
                .mockReturnValueOnce({profile: fakeBaseProfile});
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
        })
        it("Should properly combine profiles", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load")
                .mockReturnValueOnce({profile: fakeProfileMissingInformation})
                .mockReturnValueOnce({profile: fakeBaseProfile});
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
        })
        it("Should throw an error if it cannot get the service profile", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load").mockReturnValueOnce({profile: undefined});
            let error;
            try {
                await profileUtils.getDefaultProfile("zosmf", false);
            } catch (err) {
                error = err;
            }
            expect(error).toBeDefined();
            expect(profileManagerSpy).toHaveBeenCalledTimes(1);
            expect(error.message).toContain("zosmf");
        })
        it("Should throw an error if it cannot get both profiles", async() => {
            const profileManagerSpy = jest.spyOn(imperative.CliProfileManager.prototype, "load").mockReturnValue({profile: undefined});
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
        })
    })
});