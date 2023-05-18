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
import { Create, Delete } from "@zowe/zos-files-for-zowe-sdk";

let REAL_SESSION: Session;
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let ussname: string;

describe("Edit uss file", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "edit_uss_file"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        ussname = getUniqueDatasetName(defaultSystem.zosmf.user);
        ussname = ussname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${ussname}.txt`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Success scenarios", () => {
        beforeAll(async () => {
            await Create.uss(REAL_SESSION, ussname, 'file');
        });

        afterAll(async () => {
            await Delete.ussFile(REAL_SESSION, ussname);
        });

        it("should download data set", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "uss_edit_success.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("uploaded");
        });
    });

    describe("Expected failures", () => {
        it("should fail if specified uss file doesn't exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "edit_nonexistent_uss.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("No such file or directory");
        });
    });
});