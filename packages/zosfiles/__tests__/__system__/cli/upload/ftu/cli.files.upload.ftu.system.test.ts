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

import { Imperative, IO, Session } from "@brightside/imperative";
import * as path from "path";
import { getUniqueDatasetName, runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Create, CreateDataSetTypeEnum } from "../../../../../src/api/methods/create";
import { Delete } from "../../../../../src/api/methods/delete";
import { Get, ZosFilesConstants } from "../../../../../index";
import { ZosmfRestClient } from "../../../../../../rest";

let REAL_SESSION: Session;
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;
let ussname: string;

describe("Upload uss file", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "upload_uss_file"
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
        ussname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
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
                testName: "zos_files_upload_file_to_uss_without_profile"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();

        });

        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
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

        it("should upload USS file from local file", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_fully_qualified.sh");
            const localFileName = path.join(__dirname, "__data__", "command_upload_ftu.txt");
            const response = runCliScript(shellScript,
                TEST_ENVIRONMENT_NO_PROF,
                [localFileName,
                    ussname.substring(1),
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("USS file uploaded successfully.");
            const content = await Get.USSFile(REAL_SESSION, ussname);
            expect(content.toString().trim()).toEqual(IO.readFileSync(localFileName).toString().trim());
        });
    });

    describe("Success scenarios", () => {

        afterEach(async () => {
            let error;
            let response;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, endpoint);
            } catch (err) {
                error = err;
            }
        });

        it("should display upload uss file help", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_upload_ftu_help.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const helpText = response.stdout.toString();
            expect(helpText).toContain("COMMAND NAME");
            expect(helpText).toContain("DESCRIPTION");
            expect(helpText).toContain("USAGE");
            expect(helpText).toContain("OPTIONS");
            expect(helpText).toContain("EXAMPLES");
            expect(helpText).toContain("\"success\": true");
            expect(helpText).toContain("\"message\":");
            expect(helpText).toContain("\"stdout\":");
            expect(helpText).toContain("\"stderr\":");
            expect(helpText).toContain("\"data\":");
        });

        it("should upload USS file from local file", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_ftu.sh");
            const localFileName = path.join(__dirname, "__data__", "command_upload_ftu.txt");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("USS file uploaded successfully");
        });

    });

    describe("Expected failures", () => {
        it("should fail due to missing uss file name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_ftu.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Option");
            expect(response.stderr.toString()).toContain("USSFileName");
        });

        it("should fail when local file does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_ftu.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["localFileThatDoesNotExist", ussname]);
            expect(stripNewLines(response.stderr.toString())).toContain("no such file or directory, lstat");
            expect(stripNewLines(response.stderr.toString())).toContain("localFileThatDoesNotExist");
        });
    });
});

