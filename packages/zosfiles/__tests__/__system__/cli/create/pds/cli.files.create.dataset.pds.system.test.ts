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
import { runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Delete } from "../../../../../src/api/methods/delete";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;
let dsnameSuffix: string;
let user: string;

describe("Create Partitioned Data Set", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_pfd_dataset"
        });

        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized,
        });

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        dsname = `${user}.TEST.DATA.SET`;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
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

        it("should display create data-set-partitioned help", () => {
            const response = runCliScript(__dirname + "/__scripts__/create_pds_help.sh", testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set", () => {
            dsnameSuffix = "pds";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set and print attributes", () => {
            dsnameSuffix = "pds";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_rfj.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set with specified size", () => {
            dsnameSuffix = "pds.size";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_with_size.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a partitioned data set extended (PDSE)", () => {
            dsnameSuffix = "pdse";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pdse.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {

        it("should fail creating a partitioned data set due to zero directory-blocks specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_dirblk.sh",
                testEnvironment, [user]);
            expect(stripNewLines(response.stderr.toString())).toContain("'PO' data set organization (dsorg) specified and the directory " +
                "blocks (dirblk) is zero.");
        });

        it("should fail creating a partitioned data set due to invalid directory-blocks specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_dirblk.sh",
                testEnvironment, [user]);
            expect(stripNewLines(response.stderr.toString())).toContain("'PO' data set organization (dsorg) specified and the directory " +
                "blocks (dirblk) is zero.");
        });

        it("should fail creating a partitioned data set due to invalid size units", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_with_MB_size.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("Invalid zos-files create command 'alcunit' option: MB");
        });

        it("should fail creating a partitioned data set extended due to invalid data-set-type", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pdse_fail_dsntype.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("Invalid zos-files create command 'dsntype' option: NONLIBRARY");
        });

        it("should fail creating a partitioned data set due to exceeding maximum value for size (primary space)", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_size_max.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("Maximum allocation quantity of 16777215 exceeded for 'primary'.");
        });

        it("should fail creating a partitioned data set due to exceeding maximum value for secondary space", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_secondary_max.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("Maximum allocation quantity of 16777215 exceeded for 'secondary'.");
        });

        it("should fail creating a partitioned data set due to invalid record format", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_recfm.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("Invalid zos-files create command 'recfm' option: NB");
        });

        it("should fail creating a partitioned data set due to block size specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_block_size.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--block-size");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to data class specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_data_class.sh", testEnvironment);
            expect(response.stderr.toString()).toContain("--data-class");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to device type specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_device_type.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--device-type");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to directory blocks specified but no value specified", () => {
            const response = runCliScript(
                __dirname + "/__scripts__/command/command_create_pds_fail_missing_directory_blocks.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--directory-blocks");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to management class specified but no value specified", () => {
            const response = runCliScript(
                __dirname + "/__scripts__/command/command_create_pds_fail_missing_management_class.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--management-class");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to record format specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_record_format.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--record-format");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to record length specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_record_length.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--record-length");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to secondary space specified but no value specified", () => {
            const response = runCliScript(
                __dirname + "/__scripts__/command/command_create_pds_fail_missing_secondary_space.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--secondary-space");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to size specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_size.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--size");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to storage class specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_storage_class.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--storage-class");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });

        it("should fail creating a partitioned data set due to volume serial specified but no value specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_pds_fail_missing_volume_serial.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toContain("--volume-serial");
            expect(response.stderr.toString()).toContain("No value");
            expect(response.status).toEqual(1);
        });
    });
});
