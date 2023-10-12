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

import { EnvironmentalVariableSettings } from "../../src/env/EnvironmentalVariableSettings";
import { ImperativeError } from "../../../error";

// save env so we can screw it up later
const nodeEnv = process.env;

describe("EnvironmentalVariableSettings tests", () => {
    it("should error if no prefix is supplied", () => {
        let error;
        try {
            EnvironmentalVariableSettings.read(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });


    it("should use my prefix even if its bad for linux", () => {
        const prefix = "_(){}[]$*+-\\/\"#',;.@!?a1234567890";
        const envSettings = EnvironmentalVariableSettings.read(prefix);
        expect(envSettings.imperativeLogLevel.key).toMatchSnapshot();
        expect(envSettings.imperativeLogLevel.value).toBeUndefined();
        expect(envSettings.appLogLevel.key).toMatchSnapshot();
        expect(envSettings.appLogLevel.value).toBeUndefined();
        expect(envSettings).toMatchSnapshot();
    });

    it("should get environmental variables for a given prefix", () => {
        const prefix = "MY_PREFIX";
        const envSettings = EnvironmentalVariableSettings.read(prefix);
        expect(envSettings.imperativeLogLevel.key).toMatchSnapshot();
        expect(envSettings.imperativeLogLevel.value).toBeUndefined();
        expect(envSettings.appLogLevel.key).toMatchSnapshot();
        expect(envSettings.appLogLevel.value).toBeUndefined();
        expect(envSettings).toMatchSnapshot();
    });

    describe("mock process value for env value tests", () => {

        afterEach(() => {
            process.env = nodeEnv; // won't undefine new vars added
        });

        it("should return defined imperative logging env var when set in process", () => {
            const prefix = "MOCK_PROCESS_IMP_TEST_PREFIX";
            const impLogLevel = "EXTREME";

            process.env[prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX] = impLogLevel;
            const envSettings = EnvironmentalVariableSettings.read(prefix);
            expect(envSettings.imperativeLogLevel.key).toBe(prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX);
            expect(envSettings.imperativeLogLevel.value).toBe(impLogLevel);
            expect(envSettings.appLogLevel.key).toMatchSnapshot();
            expect(envSettings.appLogLevel.value).toBeUndefined();
            expect(envSettings).toMatchSnapshot();
        });

        it("should return defined app logging env var when set in process", () => {
            const prefix = "MOCK_PROCESS_APP_TEST_PREFIX";
            const appLogLevel = "MORE_EXTREME";

            process.env[prefix + EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX] = appLogLevel;
            const envSettings = EnvironmentalVariableSettings.read(prefix);
            expect(envSettings.imperativeLogLevel.key).toMatchSnapshot();
            expect(envSettings.imperativeLogLevel.value).toBeUndefined();
            expect(envSettings.appLogLevel.key).toBe(prefix + EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX);
            expect(envSettings.appLogLevel.value).toBe(appLogLevel);
            expect(envSettings).toMatchSnapshot();
        });

        it("should return defined imperative and app logging env var when both are set in process", () => {
            const prefix = "MOCK_PROCESS_IMP_AND_APP_TEST_PREFIX";
            const impLogLevel = "SOME_EXTREME";
            const appLogLevel = "MOST_EXTREME_EVER";

            process.env[prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX] = impLogLevel;
            process.env[prefix + EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX] = appLogLevel;
            const envSettings = EnvironmentalVariableSettings.read(prefix);
            expect(envSettings.imperativeLogLevel.key).toBe(prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX);
            expect(envSettings.imperativeLogLevel.value).toBe(impLogLevel);
            expect(envSettings.appLogLevel.key).toBe(prefix + EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX);
            expect(envSettings.appLogLevel.value).toBe(appLogLevel);
            expect(envSettings).toMatchSnapshot();
        });
    });
});
