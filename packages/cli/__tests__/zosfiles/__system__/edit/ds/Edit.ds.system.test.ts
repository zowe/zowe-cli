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
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { Create, CreateDataSetTypeEnum, Delete, Upload } from "@zowe/zos-files-for-zowe-sdk";

let REAL_SESSION: Session;
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let user: string;
let dsname: string;

describe("Edit Data Set", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "download_data_set"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        await Delete.dataSet(REAL_SESSION, dsname);
    });

    describe("Success scenarios", () => {
        beforeAll(async () => {
            user = defaultSystem.zosmf.user.trim().toUpperCase();
            dsname = `${user}.EDIT.DS`;
            const data = "1234";
            // dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
            await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(data), `${dsname}(member1)`);
        });

        afterAll(async () => {
            await Delete.dataSet(REAL_SESSION, dsname);
        });

        it("should download data set", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "edit_successful_single_prompt.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("uploaded");
        });
    });

    describe("Expected failures", () => {
        it("should fail if specified data set doesn't exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "edit_nonexistent_ds.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("not found");
        });
    });
});