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
import { TestLogger } from "../../../../src/TestLogger";
import { CliProfileManager } from "../../../../../src/cmd/src/profiles/CliProfileManager";
import { ICommandProfileTypeConfiguration } from "../../../../../src/cmd";
import { ProfileUtils } from "../../../../../src/profiles";
import { ITestEnvironment } from "../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../__src__/environment/SetupTestEnvironment";
import { bananaProfile, getConfig, PROFILE_TYPE } from "./CliProfileManagerTestConstants";

let TEST_ENVIRONMENT: ITestEnvironment;

describe("Cli Profile Manager", () => {
    const mainModule = process.mainModule;
    const testLogger = TestLogger.getTestLogger();
    const profileTypeOne = "banana";

    beforeAll(async () => {
        (process.mainModule as any) = {
            filename: __filename
        };

        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "basic_profile_mgr"
        });
    });

    afterAll(() => {
        process.mainModule = mainModule;
        TestUtil.rimraf(TEST_ENVIRONMENT.workingDir);
    });

    it("should create a profile manager", async () => {
        let caughtError: Error = new Error("");
        let newProfMgr;

        try {
            // Create a manager instance
            newProfMgr = new CliProfileManager({
                logger: TestLogger.getTestLogger(),
                type: PROFILE_TYPE.BANANA,
                typeConfigurations: [bananaProfile]
            });
        } catch (e) {
            caughtError = e;
            TestLogger.error(caughtError.message);
        }

        expect(newProfMgr).not.toBeNull();
        expect(caughtError.message).toEqual("");
    });

    it("should be able to retrieve all defined types after init", async function () {
        const Imperative = require("../../../../../src/imperative/src/Imperative").Imperative;
        const ImperativeConfig = require("../../../../../src/utilities/src/ImperativeConfig").ImperativeConfig;

        const config = getConfig(TEST_ENVIRONMENT.workingDir);
        await Imperative.init(config);
        expect(ProfileUtils.getAllTypeNames(ImperativeConfig.instance.loadedConfig.profiles).length).toEqual(Object.keys(PROFILE_TYPE).length);
        expect(ProfileUtils.getAllTypeNames(ImperativeConfig.instance.loadedConfig.profiles)).toContain("banana");
    });

    it("should be able to automatically map command line options to " +
        "profile fields without a handler for a simple single layer " +
        "profile schema", async () => {
        // use different option names than the field names
        // of the profile to test that the properties are associated
        // with the correct command line options
        const configs: ICommandProfileTypeConfiguration[] = [{
            type: profileTypeOne,
            schema: {
                type: "object",
                title: "test profile",
                description: "test profile",
                properties: {
                    property1: {
                        type: "number",
                        optionDefinition: {
                            name: "differentProperty1", type: "number", description: "property1"
                        }
                    },
                    property2: {
                        type: "string",
                        optionDefinition: {
                            name: "differentProperty2", type: "string", description: "property2"
                        }
                    }
                },
                required: ["property1"]
            },
        }];

        let caughtError;
        try {
            new CliProfileManager({
                type: profileTypeOne,
                logger: testLogger,
                typeConfigurations: configs
            });
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
    });
});
