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
import { Create, Delete, CreateDataSetTypeEnum, Upload } from "@zowe/cli";
import * as path from "path";
import {ITestEnvironment, runCliScript} from "@zowe/cli-test-utils";
import {TestEnvironment} from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import {ITestPropertiesSchema} from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName} from "../../../../../../../__tests__/__src__/TestUtils";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
const TIMEOUT = 20000;
const buffer = Buffer.from("buff");

describe("Compare Data Sets", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            // installPlugin: true,
            testName: "compare_data_sets",
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

    describe("Success scenarios", () => {
        beforeEach(async () => {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
            await Upload.bufferToDataSet(REAL_SESSION, buffer, dsname+"(MEMB1)");
            await Upload.bufferToDataSet(REAL_SESSION, buffer, dsname+"(MEMB2)");
        });

        afterEach(async () => {
            await Delete.dataSet(REAL_SESSION, dsname);
        });

        it("should compare data sets", async () => {
            const shellScript = path.join(__dirname, "__scripts__/compare_data_set.sh");
            const response = runCliScript(shellScript, testEnvironment, [dsname+"(MEMB1)", dsname+"(MEMB2)"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        }, TIMEOUT);
    });
    describe("Expected failures", () => {
        it("should fail due to specified data set name does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_compare_data_set.sh"); 
            const response = runCliScript(shellScript, testEnvironment, [dsname+".dummy(MEMB1)", dsname+"(MEMB2)"]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Data set not found.");
        });
    });
});
