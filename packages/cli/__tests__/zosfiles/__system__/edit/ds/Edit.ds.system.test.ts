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

import { Session } from "@zowe/imperative";
import * as path from "path";
import {ITestEnvironment, runCliScript} from "@zowe/cli-test-utils";
import {TestEnvironment} from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import {ITestPropertiesSchema} from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName} from "../../../../../../../__tests__/__src__/TestUtils";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;

describe("Edit data set", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "edit_data_set",
            tempProfileTypes: ["zosmf"]
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.password,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    // describe("Success scenarios", () => {
    //     //this test hangs because requires user input mocking - deciding to put this in unit test
    //     //it("should edit data set (should upload edited local file with the correct/expected etag)", async () => {})
    // });
    describe("Expected failures", () => {
        it("should fail if specified data set doesn't exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "edit_nonexistent_ds.sh");
            const response = runCliScript(shellScript, testEnvironment, [dsname + ".dummy"]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Data set not found.");
        });
    });
});