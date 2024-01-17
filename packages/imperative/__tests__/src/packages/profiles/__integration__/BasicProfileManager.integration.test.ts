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
import { ITestEnvironment } from "../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../__src__/environment/SetupTestEnvironment";
import { inspect } from "util";
import { TestLogger } from "../../../../src/TestLogger";
import { ProfileUtils } from "../../../../../src/profiles";
import { getConfig, PROFILE_TYPE } from "../src/constants/BasicProfileManagerTestConstants";

let TEST_ENVIRONMENT: ITestEnvironment;

describe("Imperative should allow CLI implementations to read their own profiles and types", function () {
    const mainModule = process.mainModule;
    const loadChangingDependencies = () => {
        return {
            Imperative: require("../../../../../src/imperative/src/Imperative").Imperative,
            ImperativeConfig: require("../../../../../src/utilities/ImperativeConfig").ImperativeConfig,
            ImperativeError: require("../../../../../src/error/src/ImperativeError").ImperativeError
        };
    };

    let {Imperative, ImperativeError, ImperativeConfig} = loadChangingDependencies();

    beforeAll(async () => {
        (process.mainModule as any) = {
            filename: __filename
        };

        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "basic_profile_mgr"
        });

        // copy existing profiles into test directory
        const response = TestUtil.runCliScript(__dirname + "/__scripts__/copy_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
    });

    // Initialize imperative before each test
    beforeEach(() => {
        jest.resetModules();
        ({Imperative, ImperativeError, ImperativeConfig} = loadChangingDependencies());
    });

    afterAll(() => {
        process.mainModule = mainModule;
        TestUtil.rimraf(TEST_ENVIRONMENT.workingDir);
    });

    it("should be able to retrieve all defined types after init", async function () {
        const config = getConfig(TEST_ENVIRONMENT.workingDir);
        await Imperative.init(config);
        expect(ProfileUtils.getAllTypeNames(ImperativeConfig.instance.loadedConfig.profiles).length).toEqual(Object.keys(PROFILE_TYPE).length);
        expect(ProfileUtils.getAllTypeNames(ImperativeConfig.instance.loadedConfig.profiles)).toContain("banana");
    });

    it("should receive a failure message when attempting to load a profile that doesn't exist", async function () {
        const config = getConfig(TEST_ENVIRONMENT.workingDir);
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

    it("should be able to load a specific profile", async function () {
        const config = getConfig(TEST_ENVIRONMENT.workingDir);

        await Imperative.init(config);
        const loadResponse = await Imperative.api.profileManager("banana").load({name: "legit"});
        TestLogger.info(`Profile loaded success response: ${inspect(loadResponse, {depth: null})}`);

        expect(loadResponse.message).toEqual('Profile "legit" of type "banana" loaded successfully.');
        expect(loadResponse.type).toEqual("banana");
        expect(loadResponse.name).toEqual("legit");
        expect(loadResponse.profile).toBeDefined();
        expect(loadResponse.profile).toEqual({"age": 1000});
    });

    it("should be able to load a default profile", async function () {
        const config = getConfig(TEST_ENVIRONMENT.workingDir);

        await Imperative.init(config);
        const loadResponse = await Imperative.api.profileManager("banana").load({loadDefault: true});

        expect(loadResponse.message).toEqual('Profile "legit" of type "banana" loaded successfully.');
        expect(loadResponse.type).toEqual("banana");
        expect(loadResponse.name).toEqual("legit");
        expect(loadResponse.profile).toBeDefined();
        expect(loadResponse.profile).toEqual({ "age": 1000 });
    });
});
