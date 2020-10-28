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

import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

let TEST_ENVIRONMENT: ITestEnvironment;

describe("Rename Data Set Member", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_rename_data_set_member",
            skipProperties: true
        });
    });

    afterAll(() => TestEnvironment.cleanUp(TEST_ENVIRONMENT));

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/rename_data_set_member_help.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should display the help in json format", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/rename_data_set_member_help_rfj.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
