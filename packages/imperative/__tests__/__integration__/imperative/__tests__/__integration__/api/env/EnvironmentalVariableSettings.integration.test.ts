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

import { EnvironmentalVariableSettings,
    IImperativeEnvironmentalVariableSettings,
    IImperativeConfig,
    Imperative } from "../../../../../../../src";

describe("environmental variable integration", () => {
    const mainModule = process.mainModule;

    beforeEach(() => {
        (process.mainModule as any) = {
            filename: __filename
        };
    });

    afterEach(() => {
        process.mainModule = mainModule;
    });

    it ("should be able to extract the values for the environment variables", () => {
        process.env.IMP_INTEGRATION_TESTING_IMPERATIVE_LOG_LEVEL = "THIS IS A TEST";
        process.env.IMP_INTEGRATION_TESTING_APP_LOG_LEVEL = "THIS IS ANOTHER TEST";
        const vars: IImperativeEnvironmentalVariableSettings = EnvironmentalVariableSettings.read("IMP_INTEGRATION_TESTING");
        expect(vars).toMatchSnapshot();
    });

    it ("should set the log levels based on the imperative prefix", async () => {
        // Load the imperative config and set the env var prefix
        const config: IImperativeConfig = require("../../../../src/imperative");
        config.envVariablePrefix = "THIS_IS_A_TEST";
        delete config.commandModuleGlobs;
        config.definitions = [
            {
                name: "fake",
                description: "fake",
                type: "command",
                handler: "fake"
            }
        ];

        // Set the environmental variables for this test
        const vars: IImperativeEnvironmentalVariableSettings = EnvironmentalVariableSettings.read(config.envVariablePrefix);
        expect(vars.appLogLevel.key).toContain("THIS_IS_A_TEST");
        expect(vars.imperativeLogLevel.key).toContain("THIS_IS_A_TEST");
        process.env[vars.appLogLevel.key] = "WARN";
        process.env[vars.imperativeLogLevel.key] = "ERROR";

        // Init and check the logger settings
        await Imperative.init(config);

        // TODO: I think this is a defect - level is defined as type "string", but returns an object
        expect(Imperative.api.imperativeLogger.level as any).toBe("ERROR");
        expect(Imperative.api.appLogger.level as any).toBe("WARN");
    });
});
