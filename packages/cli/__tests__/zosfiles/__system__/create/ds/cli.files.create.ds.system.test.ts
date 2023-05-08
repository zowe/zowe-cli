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
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { delay, delTime } from "../../../../../../../__tests__/__src__/TestUtils";
import { Delete } from "@zowe/zos-files-for-zowe-sdk";

const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let dsnameSuffix: string;
let user: string;
let pass: string;
let host: string;

describe("Create Data Set", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_dataset"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim();
        pass = defaultSystem.zosmf.password.trim();
        host = defaultSystem.zosmf.host.trim();
        dsname = `${user.toUpperCase()}.TEST.DATA.SET`;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Success scenarios", () => {

        beforeEach(() => {
            dsnameSuffix = "";  // reset
        });

        afterEach(async () => {
            // use DELETE APIs
            if (dsnameSuffix !== "") {
                await delay(delTime);
                const response = await Delete.dataSet(REAL_SESSION, dsname + "." + dsnameSuffix);
            }
        });

        it("should create a data set", () => {
            dsnameSuffix = "like";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ds_like.sh",
                TEST_ENVIRONMENT, [user,defaultSystem.zosjobs.iefbr14PSDataSet]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set created successfully.");
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a data set with missing like", () => {
            dsnameSuffix = "noLike";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ds_missing_like.sh",
                TEST_ENVIRONMENT,[host,user,pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set created successfully.");
            expect(response.stdout.toString()).toMatchSnapshot();
        });

    });

});
