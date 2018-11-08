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

import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../__tests__/__src__/TestUtils";

let TEST_ENVIRONMENT: ITestEnvironment;

describe("Root level help tests", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zowe_help_test",
        });
    });


    /**
     * This test covers the "description" area of the help text, which contains links to support and documentation
     */
    it("top level help should contain support link", () => {
        const response = runCliScript(__dirname + "/__scripts__/top_level_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
