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

import { Session } from "@brightside/imperative";
import * as path from "path";
import { runCliScript, getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Create, CreateDataSetTypeEnum } from "../../../../../src/api/methods/create";
import { Upload } from "../../../../../src/api/methods/upload";
import { Delete } from "../../../../../src/api/methods/delete";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;
const testString = "test";

describe("List all members of data set", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "list_data_set"
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Without profile", () => {
        let sysProps;
        let defaultSys: ITestSystemSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_list_data_set_without_profile"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testString), `${dsname}(${testString})`);
            } catch (err) {
                throw err;
            }
        });

        afterEach(async () => {
            try {
                await Delete.dataSet(REAL_SESSION, dsname);
            } catch (err) {
                throw err;
            }
        });

        it("should list data set", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_list_all_members_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    dsname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(testString.toUpperCase());
        });
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testString), `${dsname}(${testString})`);
            } catch (err) {
                throw err;
            }
        });

        afterEach(async () => {
            try {
                await Delete.dataSet(REAL_SESSION, dsname);
            } catch (err) {
                throw err;
            }
        });

        it("should display list data set help", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_list_all_members_help.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should list data set", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_all_members.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(testString.toUpperCase());
        });

        it("should list data set with response-format-json flag", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_all_members.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(testString.toUpperCase());
        });

        it("should list data set while showing attributes", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_all_members.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, "-a", "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(testString.toUpperCase());
        });

        it("should indicate that the data set is empty", async () => {
            try {
                await Delete.dataSet(REAL_SESSION, `${dsname}(${testString})`);

                const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_all_members.sh");
                const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname]);
                expect(response.status).toBe(0);
                expect(response.stderr.toString()).toEqual("");
                expect(response.stdout.toString()).toEqual("");
            } catch (err) {
                expect(err).toBeUndefined();
            }
        });
    });

    describe("Expected failures", () => {
        it("should fail due to missing data set name", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_all_members.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Option");
            expect(response.stderr.toString()).toContain("dataSetName");
        });

        it("should fail due to data set not existing", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_all_members.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname + ".d"]);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toEqual("");
            expect(response.stderr.toString()).toContain("Data set not cataloged");
        });
    });
});
