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

import { ITestEnvironment, TempTestProfiles, runCliScript } from "../../../__packages__/cli-test-utils";
import { TestEnvironment } from "../../../__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../__src__/properties/ITestPropertiesSchema";
import { join } from "path";
import * as fs from "fs";
import { Constants } from "../../../../packages/cli/src/Constants";

// Test environment created in the before all
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("Zowe CLI Logging", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zowe_logging_password_test",
            tempProfileTypes: ["zosmf"]
        });
    });

    /**************************************************************************
     * !!! NOTE: This test won't pass if your username and password match     *
     **************************************************************************/
    it("should not log passwords if the default log level of DEBUG is set", () => {

        // Issue a few commands (after the setup created a profile)
        const response = runCliScript(join(__dirname, "/__scripts__/sample_commands.sh"), TEST_ENVIRONMENT, ["DEBUG"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // Create the basic auth header
        const zosmfUsername = TEST_ENVIRONMENT.systemTestProperties.zosmf.user;
        const zosmfPassword = TEST_ENVIRONMENT.systemTestProperties.zosmf.password;
        const encodedAuth = Buffer.from(zosmfUsername + ":" + zosmfPassword).toString("base64");

        // Grab both log files
        const imperativeLogContents = fs.readFileSync(join(TEST_ENVIRONMENT.workingDir, "/logs/imperative.log"));
        const zoweLogContents = fs.readFileSync(join(TEST_ENVIRONMENT.workingDir, "/" + Constants.LOG_LOCATION));
        const tempTestLog = fs.readFileSync(join(TEST_ENVIRONMENT.workingDir, TempTestProfiles.LOG_FILE_NAME));

        // ensure that the password and encoded auth does not appear in the imperative log
        expect(imperativeLogContents.indexOf(zosmfPassword)).not.toBeGreaterThanOrEqual(0);
        expect(imperativeLogContents.indexOf(encodedAuth)).not.toBeGreaterThanOrEqual(0);

        // ensure that the password and encoded auth does not appear in the Zowe log
        expect(zoweLogContents.indexOf(zosmfPassword)).not.toBeGreaterThanOrEqual(0);
        expect(zoweLogContents.indexOf(encodedAuth)).not.toBeGreaterThanOrEqual(0);
    });

    /**************************************************************************
     * !!! NOTE: This test won't pass if your username and password match     *
     **************************************************************************/
    it("should not log passwords regardless if 'password', 'pass' or 'pw' used in command if the default log level of DEBUG is set", () => {

        // Create the basic auth header
        const zosmfUsername = TEST_ENVIRONMENT.systemTestProperties.zosmf.user;
        const zosmfPassword = TEST_ENVIRONMENT.systemTestProperties.zosmf.password;
        const encodedAuth = Buffer.from(zosmfUsername + ":" + zosmfPassword).toString("base64");

        // Issue a few commands (after the setup created a profile)
        const response = runCliScript(join(__dirname, "/__scripts__/sample_commands_connect_options.sh"),
            TEST_ENVIRONMENT, ["DEBUG", zosmfPassword]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // Grab both log files
        const imperativeLogContents = fs.readFileSync(join(TEST_ENVIRONMENT.workingDir, "/logs/imperative.log"));
        const zoweLogContents = fs.readFileSync(join(TEST_ENVIRONMENT.workingDir, "/" + Constants.LOG_LOCATION));
        const tempTestLog = fs.readFileSync(join(TEST_ENVIRONMENT.workingDir, TempTestProfiles.LOG_FILE_NAME));

        // ensure that the password and encoded auth does not appear in the imperative log
        expect(imperativeLogContents.indexOf(zosmfPassword)).not.toBeGreaterThanOrEqual(0);
        expect(imperativeLogContents.indexOf(encodedAuth)).not.toBeGreaterThanOrEqual(0);

        // ensure that the password and encoded auth does not appear in the Zowe log
        expect(zoweLogContents.indexOf(zosmfPassword)).not.toBeGreaterThanOrEqual(0);
        expect(zoweLogContents.indexOf(encodedAuth)).not.toBeGreaterThanOrEqual(0);
    });
});
