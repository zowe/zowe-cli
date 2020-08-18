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
import { runCliScript, delay, delTime } from "../../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Delete } from "../../../../../../../../packages/zosfiles/src/methods/delete";

const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let dsnameSuffix: string;
let user: string;

describe("Create Classic Data Set", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_classic_dataset"
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
                testName: "zos_files_create_classic_pds_without_profile"
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

        it("should create a classic partitioned data set", () => {
            dsnameSuffix = "classic";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_create_classic_pds_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
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
                await delay(delTime);
                const response = await Delete.dataSet(REAL_SESSION, dsname + "." + dsnameSuffix);
            }
        });

        it("should create a classic partitioned data set", () => {
            dsnameSuffix = "classic";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_classic_pds.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a classic partitioned data set with response timeout", () => {
            dsnameSuffix = "classic";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_classic_pds.sh",
                TEST_ENVIRONMENT, [user, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a classic partitioned data set and print attributes", () => {
            dsnameSuffix = "classic";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_classic_pds_rfj.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a classic partitioned data set with specified size", () => {
            dsnameSuffix = "classic.size";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_classic_pds_with_size.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a classic partitioned data set with specified primary allocation", () => {
            dsnameSuffix = "classic.primary";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_classic_pds_with_primary.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a classic partitioned data set with specified primary and secondary allocation", () => {
            dsnameSuffix = "classic.second";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_classic_pds_with_primary_secondary.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

});
