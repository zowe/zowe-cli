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
import { IImperativeEnvironmentalVariableSettings } from "../../src/doc/IImperativeEnvironmentalVariableSettings";
import { IImperativeEnvironmentalVariableSetting } from "../../src/doc/IImperativeEnvironmentalVariableSetting";
import { ImperativeError } from "../../../error/src/ImperativeError";
import { Constants } from "../../../constants/src/Constants";

// save env so we can screw it up later
const nodeEnv = process.env;

describe("EnvironmentalVariableSettings tests", () => {

    const getSetting = (key: string, defaultValue?: string): IImperativeEnvironmentalVariableSetting => {
        return { key, value: process.env[key] || defaultValue };
    };
    const getEnvSettings = (prefix: string): IImperativeEnvironmentalVariableSettings => {
        return {
            imperativeLogLevel: getSetting(prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX),
            appLogLevel: getSetting(prefix + EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX),
            cliHome: getSetting(prefix + EnvironmentalVariableSettings.CLI_HOME_SUFFIX),
            promptPhrase: getSetting(prefix + EnvironmentalVariableSettings.PROMPT_PHRASE_SUFFIX),
            maskOutput: getSetting(prefix + EnvironmentalVariableSettings.APP_MASK_OUTPUT_SUFFIX, Constants.DEFAULT_MASK_OUTPUT),
            pluginsDir: getSetting(prefix + EnvironmentalVariableSettings.CLI_PLUGINS_DIR_SUFFIX)
        };
    };

    it("should error if no prefix is supplied", () => {
        let error;
        try {
            EnvironmentalVariableSettings.read(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("You must specify the environmental variable prefix");
    });

    it("should use my prefix even if its bad for linux", () => {
        const prefix = "_(){}[]$*+-\\/\"#',;.@!?a1234567890";
        const envSettings = EnvironmentalVariableSettings.read(prefix);
        expect(envSettings.imperativeLogLevel.key).toEqual(prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX);
        expect(envSettings).toEqual(getEnvSettings(prefix));
    });

    it("should get environmental variables for a given prefix", () => {
        const prefix = "MY_PREFIX";
        const envSettings = EnvironmentalVariableSettings.read(prefix);
        expect(envSettings.imperativeLogLevel.key).toEqual(prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX);
        expect(envSettings).toEqual(getEnvSettings(prefix));
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
            expect(envSettings.imperativeLogLevel.key).toEqual(prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX);
            expect(envSettings.imperativeLogLevel.value).toEqual(impLogLevel);
            expect(envSettings).toEqual(getEnvSettings(prefix));
        });

        it("should return defined app logging env var when set in process", () => {
            const prefix = "MOCK_PROCESS_APP_TEST_PREFIX";
            const appLogLevel = "MORE_EXTREME";

            process.env[prefix + EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX] = appLogLevel;
            const envSettings = EnvironmentalVariableSettings.read(prefix);
            expect(envSettings.imperativeLogLevel.key).toEqual(prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX);
            expect(envSettings.imperativeLogLevel.value).toBeUndefined();
            expect(envSettings.appLogLevel.key).toEqual(prefix + EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX);
            expect(envSettings.appLogLevel.value).toEqual(appLogLevel);
            expect(envSettings).toEqual(getEnvSettings(prefix));
        });

        it("should return defined imperative and app logging env var when both are set in process", () => {
            const prefix = "MOCK_PROCESS_IMP_AND_APP_TEST_PREFIX";
            const impLogLevel = "SOME_EXTREME";
            const appLogLevel = "MOST_EXTREME_EVER";

            process.env[prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX] = impLogLevel;
            process.env[prefix + EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX] = appLogLevel;
            const envSettings = EnvironmentalVariableSettings.read(prefix);
            expect(envSettings.imperativeLogLevel.value).toEqual(impLogLevel);
            expect(envSettings.appLogLevel.value).toEqual(appLogLevel);
            expect(envSettings.cliHome.value).toBeUndefined();
            expect(envSettings.promptPhrase.value).toBeUndefined();
            expect(envSettings.maskOutput.value).toEqual(Constants.DEFAULT_MASK_OUTPUT);
            expect(envSettings.pluginsDir.value).toBeUndefined();
            expect(envSettings).toEqual(getEnvSettings(prefix));
        });

        it("should return defined imperative logging and mask output env var when both are set in process", () => {
            const prefix = "MOCK_PROCESS_IMP_AND_MASK_TEST_PREFIX";
            const impLogLevel = "SOME_EXTREME";
            const maskLogLevel = "PLEASE MASK IT : )";

            process.env[prefix + EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX] = impLogLevel;
            process.env[prefix + EnvironmentalVariableSettings.APP_MASK_OUTPUT_SUFFIX] = maskLogLevel;
            const envSettings = EnvironmentalVariableSettings.read(prefix);
            expect(envSettings.imperativeLogLevel.value).toEqual(impLogLevel);
            expect(envSettings.appLogLevel.value).toBeUndefined();
            expect(envSettings.cliHome.value).toBeUndefined();
            expect(envSettings.promptPhrase.value).toBeUndefined();
            expect(envSettings.maskOutput.value).toEqual(maskLogLevel);
            expect(envSettings.pluginsDir.value).toBeUndefined();
            expect(envSettings).toEqual(getEnvSettings(prefix));
        });
    });
});
