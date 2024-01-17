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

import * as TestUtil from "../../../TestUtil";
import { inspect } from "util";
import { TestLogger } from "../../../../src/TestLogger";
import { ProfileUtils } from "../../../../../src/profiles";
import { BANANA_AGE, getConfig, PROFILE_TYPE } from "../src/constants/BasicProfileManagerTestConstants";

describe("Imperative should allow CLI implementations to configure their own profiles and types", function () {
    const mainModule = process.mainModule;
    const loadChangingDependencies = () => {
        return {
            Imperative: require("../../../../../src/imperative/src/Imperative").Imperative,
            ImperativeConfig: require("../../../../../src/utilities/ImperativeConfig").ImperativeConfig,
            ImperativeError: require("../../../../../src/error/src/ImperativeError").ImperativeError
        };
    };

    let {Imperative, ImperativeError, ImperativeConfig} = loadChangingDependencies();

    // Initialize imperative before each test
    beforeEach(() => {
        jest.resetModules();
        ({Imperative, ImperativeError, ImperativeConfig} = loadChangingDependencies());
    });

    beforeAll(() => {
        (process.mainModule as any) = {
            filename: __filename
        };
    });

    afterAll(() => {
        process.mainModule = mainModule;
    });

    it("should be able to create a profile type and retrieve all defined types after init", async function () {
        const config = getConfig(TestUtil.createUniqueTestDataDir("profile-manager-initialize"));
        await Imperative.init(config);
        expect(ProfileUtils.getAllTypeNames(ImperativeConfig.instance.loadedConfig.profiles).length).toEqual(Object.keys(PROFILE_TYPE).length);
        expect(ProfileUtils.getAllTypeNames(ImperativeConfig.instance.loadedConfig.profiles)).toContain("banana");
    });

    it("should be receive a failure message when attempting to load a profile that doesn't exist", async function () {
        const config = getConfig(TestUtil.createUniqueTestDataDir("profile-manager-initialize"));
        await Imperative.init(config);
        let error;
        try {
            const response = await Imperative.api.profileManager("banana").load({name: "notreal"});
            TestLogger.info(response.message);
        } catch (e) {
            error = e;
            TestLogger.info(error.message);
        }
        expect(error).toBeInstanceOf(ImperativeError);
    });

    it("should receive a failure message when attempting to create an ill-formed profile", async function () {
        const config = getConfig(TestUtil.createUniqueTestDataDir("profile-manager-initialize"));
        await Imperative.init(config);
        let error;
        try {
            const response = await Imperative.api.profileManager("banana").save({
                name: "illformed",
                profile: {
                    fail: "this"
                }
            });
            TestLogger.info(response.message);
        } catch (e) {
            error = e;
            TestLogger.info(error.message);
        }
        expect(error).toBeInstanceOf(ImperativeError);
    });

    it("should be able to create a basic profile", async function () {
        const config = getConfig(TestUtil.createUniqueTestDataDir("profile-manager-initialize"));
        await Imperative.init(config);
        const response = await Imperative.api.profileManager("banana").save({
            name: "legit",
            profile: {
                age: BANANA_AGE
            }
        });
        TestLogger.info(`Profile create success response: ${inspect(response, {depth: null})}`);
        expect(response.message).toContain(`Profile ("legit" of type "banana") successfully written:`);
        expect(response.overwritten).toEqual(false);
        expect(response.path).toContain("legit.yaml");
    });

    it("should be able to create a basic profile and load that profile", async function () {
        const config = getConfig(TestUtil.createUniqueTestDataDir("profile-manager-initialize"));
        await Imperative.init(config);
        const saveResponse = await Imperative.api.profileManager("banana").save({
            name: "legit",
            profile: {age: BANANA_AGE},
            overwrite: true,
            updateDefault: true
        });

        TestLogger.info("Save response: " + saveResponse.message);
        const loadResponse = await Imperative.api.profileManager("banana").load({name: "legit"});
        TestLogger.info(`Profile loaded success response: ${inspect(loadResponse, {depth: null})}`);
        expect(loadResponse.name).toEqual("legit");
        expect(loadResponse.type).toEqual("banana");
        expect(loadResponse.profile).toBeDefined();
        expect(loadResponse.profile).toMatchSnapshot();
    });

    it("should be able to create a basic profile and load as the default", async function () {
        const config = getConfig(TestUtil.createUniqueTestDataDir("profile-manager-initialize"));
        await Imperative.init(config);
        const response = await Imperative.api.profileManager("banana").save({
            name: "legit",
            profile: {age: BANANA_AGE},
            overwrite: true,
            updateDefault: true
        });
        TestLogger.info(`Profile create success response: ${inspect(response, {depth: null})}`);
        const load = await Imperative.api.profileManager("banana").load({loadDefault: true});
        expect(load.type).toEqual("banana");
        expect(load.profile).toBeDefined();
        expect(load.profile).toMatchSnapshot();
    });
});
