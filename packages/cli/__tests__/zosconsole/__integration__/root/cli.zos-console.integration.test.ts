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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("zos-console", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_console_root",
            skipProperties: true
        });
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/root_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail with invalid parameter", async () => {
        const response = runCliScript(__dirname + "/__scripts__/invalid_parameter.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toContain('================Z/OS CONSOLE INVALID PARAMETERS===============');
        expect(response.stderr.toString()).toContain('Unknown argument: foobar');
        expect(response.stderr.toString()).toContain('Command failed due to improper syntax');
        expect(response.stderr.toString()).toContain('Did you mean: zos-console collect');
        expect(response.stderr.toString()).toContain('Command entered: "zos-console foobar"');
        expect(response.stderr.toString()).toContain('Use "zowe zos-console --help" to view groups, commands, and options.');
        expect(response.stderr.toString()).toContain('Error: Unknown argument: foobar');
    });

    it("should fail with invalid option", async () => {
        const response = runCliScript(__dirname + "/__scripts__/invalid_option.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toContain('================Z/OS CONSOLE INVALID OPTION===============');
        expect(response.stderr.toString()).toContain('Unknown arguments: foo-bar, fooBar');
        expect(response.stderr.toString()).toContain('Command failed due to improper syntax');
        expect(response.stderr.toString()).toContain('Did you mean: zos-console collect');
        expect(response.stderr.toString()).toContain('Command entered: "zos-console --foo-bar"');
        expect(response.stderr.toString()).toContain('Use "zowe zos-console --help" to view groups, commands, and options.');
        expect(response.stderr.toString()).toContain('Error: Unknown arguments: foo-bar, fooBar');
    });
});
