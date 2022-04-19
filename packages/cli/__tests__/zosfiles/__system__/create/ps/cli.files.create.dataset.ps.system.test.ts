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
import { stripNewLines, delay, delTime } from "../../../../../../../__tests__/__src__/TestUtils";
import { Delete } from "@zowe/zos-files-for-zowe-sdk";

const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let dsnameSuffix: string;
let user: string;

describe("Create Physical Sequential Data Set", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_binary_dataset"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        dsname = `${user}.TEST.DATA.SET`;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_create_ps_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        afterEach(async () => {
            // use DELETE APIs
            if (dsnameSuffix !== "") {
                await delay(delTime);
                const response = await Delete.dataSet(REAL_SESSION, dsname + "." + dsnameSuffix);
            }
        });

        it("should create a physical sequential data set", () => {
            dsnameSuffix = "ps";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ps_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [user,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password]);
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
                await delay(delTime);
                const response = await Delete.dataSet(REAL_SESSION, dsname + "." + dsnameSuffix);
            }
        });

        it("should create a physical sequential data set", () => {
            dsnameSuffix = "ps";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ps.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a physical sequential data set with response timeout", () => {
            dsnameSuffix = "ps";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ps.sh",
                TEST_ENVIRONMENT, [user, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a physical sequential data set and print attributes", () => {
            dsnameSuffix = "ps";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ps_rfj.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a physical sequential data set with specified size", () => {
            dsnameSuffix = "ps.size";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ps_with_size.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a physical sequential data set with specified primary allocation", () => {
            dsnameSuffix = "ps.primary";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ps_with_primary.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a physical sequential data set with specified primary and secondary allocation", () => {
            dsnameSuffix = "ps.second";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ps_with_primary_secondary.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {

        it("should fail creating a physical sequential data set due to directory-blocks specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ps_fail_dirblk.sh",
                TEST_ENVIRONMENT, [user]);
            expect(stripNewLines(response.stderr.toString())).toContain("'PS' data set organization (dsorg) specified and the directory " +
                "blocks (dirblk) is not zero.");
        });

        it("should fail creating a physical sequential data set due to missing data set name", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_ps_fail_missing_dataset_name.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Argument");
            expect(response.stderr.toString()).toContain("dataSetName");
        });
    });
});
