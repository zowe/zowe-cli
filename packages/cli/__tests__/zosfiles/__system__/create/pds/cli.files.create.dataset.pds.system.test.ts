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
import { ITestEnvironment, runCliScript } from "../../../../../../../__tests__/__packages__/cli-test-utils";
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

describe("Create Partitioned Data Set", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_pfd_dataset"
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
                testName: "zos_files_create_pds_without_profile"
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

        it("should create a partitioned data set", () => {
            dsnameSuffix = "pds";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fully_qualified.sh",
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

        it("should create a partitioned data set", () => {
            dsnameSuffix = "pds";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set with response timeout", () => {
            dsnameSuffix = "pds";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds.sh",
                TEST_ENVIRONMENT, [user, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set and print attributes", () => {
            dsnameSuffix = "pds";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_rfj.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set with specified size", () => {
            dsnameSuffix = "pds.size";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_with_size.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set with specified primary allocation", () => {
            dsnameSuffix = "pds.primary";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_with_primary.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set with specified primary and secondary allocation", () => {
            dsnameSuffix = "pds.second";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_with_primary_secondary.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set extended (PDSE)", () => {
            dsnameSuffix = "pdse";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pdse.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {

        it("should fail creating a partitioned data set due to zero directory-blocks specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_dirblk.sh",
                TEST_ENVIRONMENT, [user]);
            expect(stripNewLines(response.stderr.toString())).toContain("'PO' data set organization (dsorg) specified and the directory " +
                "blocks (dirblk) is zero.");
        });

        it("should fail creating a partitioned data set due to invalid directory-blocks specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_dirblk.sh",
                TEST_ENVIRONMENT, [user]);
            expect(stripNewLines(response.stderr.toString())).toContain("'PO' data set organization (dsorg) specified and the directory " +
                "blocks (dirblk) is zero.");
        });

        it("should fail creating a partitioned data set due to invalid size units", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_with_MB_size.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("Invalid zos-files create command 'alcunit' option: MB");
        });

        it("should fail creating a partitioned data set extended due to invalid data-set-type", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pdse_fail_dsntype.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("Invalid zos-files create command 'dsntype' option: NONLIBRARY");
        });

        it("should fail creating a partitioned data set due to exceeding maximum value for size (primary space)", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_size_max.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("Maximum allocation quantity of 16777215 exceeded for 'primary'.");
        });

        it("should fail creating a partitioned data set due to exceeding maximum value for secondary space", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_secondary_max.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("Maximum allocation quantity of 16777215 exceeded for 'secondary'.");
        });

        it("should fail creating a partitioned data set due to invalid record format", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_recfm.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("Invalid zos-files create command 'recfm' option: NB");
        });

        it("should fail creating a partitioned data set due to block size specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_block_size.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--block-size");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to data class specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_data_class.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toContain("--data-class");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to device type specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_device_type.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--device-type");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to directory blocks specified but no value specified", () => {
            const response = runCliScript(
                __dirname + "/__scripts__/command/command_create_pds_fail_missing_directory_blocks.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--directory-blocks");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to management class specified but no value specified", () => {
            const response = runCliScript(
                __dirname + "/__scripts__/command/command_create_pds_fail_missing_management_class.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--management-class");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to record format specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_record_format.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--record-format");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to record length specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_record_length.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--record-length");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to secondary space specified but no value specified", () => {
            const response = runCliScript(
                __dirname + "/__scripts__/command/command_create_pds_fail_missing_secondary_space.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--secondary-space");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to size specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_size.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--size");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to storage class specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_storage_class.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--storage-class");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to volume serial specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_volume_serial.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toContain("--volume-serial");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });
    });
});
