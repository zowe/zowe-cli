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
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Delete } from "../../../../../src/api/methods/delete";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;
let dsnameSuffix: string;
let user: string;

describe("Create Binary Data Set", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_binary_data_set"
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        dsname = `${user}.TEST.DATA.SET`;

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
                testName: "zos_files_create_binary_pds_without_profile"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        afterEach(async () => {
            // use DELETE APIs
            if (dsnameSuffix !== "") {
                const response = await Delete.dataSet(REAL_SESSION, dsname + "." + dsnameSuffix);
            }
        });

        it("should create a binary partitioned data set", () => {
            dsnameSuffix = "binary";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_binary_pds_fully_qualified.sh",
                TEST_ENVIRONMENT,
                [user,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Success scenarios", () => {
        beforeEach(() => {
            dsnameSuffix = "";  // reset
        });

        afterEach(async () => {
            // use DELETE APIs
            if (dsnameSuffix !== "") {
                const response = await Delete.dataSet(REAL_SESSION, dsname + "." + dsnameSuffix);
            }
        });

        it("should display create binary help",  () => {
            const response = runCliScript(__dirname + "/__scripts__/create_binary_pds_help.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a binary partitioned data set", () => {
            dsnameSuffix = "binary";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_binary_pds.sh",
              TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a binary partitioned data set and print attributes", () => {
            dsnameSuffix = "binary";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_binary_pds_rfj.sh",
              TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a binary partitioned data set with specified size", () => {
            dsnameSuffix = "binary.size";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_binary_pds_with_size.sh",
              TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {

        it("should fail creating a binary partitioned data set due to missing data set name", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_binary_fail_missing_dataset_name.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("dataSetName");
            expect(response.stderr.toString()).toContain("Missing Positional");
        });
    });
});
