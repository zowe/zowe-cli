/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript, stripNewLines } from "../../../../../../__tests__/__src__/TestUtils";

let testEnvironment: ITestEnvironment;

describe("zosmf check status", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_check_status_integration"
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/zosmf_check_status_help.sh", testEnvironment);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail due to invalid status command", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/zosmf_check_missing_status.sh", testEnvironment);
        expect(stripNewLines(response.stderr.toString())).toContain("Command failed due to improper syntax");
    });

});
