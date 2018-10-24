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

import * as fs from "fs";
import { Session, TextUtils } from "@brightside/imperative";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { getUniqueDatasetName, runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { ZosFilesMessages } from "../../../../../src/api/constants/ZosFiles.messages";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let user: string;
let volume: string;

describe("Invoke AMS CLI", () => {

    function createTestAMSStatementFileFromTemplate(templateFile: string, dsname?: string) {
        // replace high-level-qualifier with user value
        const AMSStatement = fs.readFileSync(templateFile).toString();
        const updatedStatement = TextUtils.renderWithMustache(AMSStatement, {DSN: dsname, VOL: volume});
        fs.writeFileSync(templateFile + ".temp", updatedStatement);
        return templateFile + ".temp";
    }

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_invoke_ams"
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
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
        volume = defaultSystem.datasets.list[0].vol;

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
                testName: "zos_files_invoke_ams_file_without_profile"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();

            user = defaultSys.zosmf.user.trim().toUpperCase();
            volume = defaultSys.datasets.list[0].vol;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should invoke ams to create and then delete a VSAM cluster using files containing the appropriate control statement", async () => {
            const dsname = getUniqueDatasetName(defaultSys.zosmf.user);

            // create a temporary file from the template file that has the proper high level qualifier to create the VSAM file
            let controlStatementFile: string = createTestAMSStatementFileFromTemplate(
                process.cwd() + "/packages/zosfiles/__tests__/__system__/api/methods/invoke/DefineVSAM.ams",
                dsname);

            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_file_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [controlStatementFile,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            let testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            // Delete the temp file
            fs.unlinkSync(controlStatementFile);

            // create a temporary file from the template file that has the proper high level qualifier to delete the VSAM file
            controlStatementFile = createTestAMSStatementFileFromTemplate(
                process.cwd() + "/packages/zosfiles/__tests__/__system__/api/methods/invoke/DeleteVSAM.ams",
                dsname);

            response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_file_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [controlStatementFile,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            // Delete the temp file
            fs.unlinkSync(controlStatementFile);
        });
    });

    describe("Success scenarios", () => {

        it("should display invoke and invoke ams help", async () => {
            const response = runCliScript(__dirname + "/__scripts__/invoke_ams_help.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should invoke ams to create and then delete a VSAM cluster using files containing the appropriate control statement", async () => {
            const dsname = getUniqueDatasetName(defaultSystem.zosmf.user);

            // create a temporary file from the template file that has the proper high level qualifier to create the VSAM file
            let controlStatementFile: string = createTestAMSStatementFileFromTemplate(
                process.cwd() + "/packages/zosfiles/__tests__/__system__/api/methods/invoke/DefineVSAM.ams",
                dsname);

            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_file.sh",
                TEST_ENVIRONMENT, [controlStatementFile]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            let testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            // Delete the temp file
            fs.unlinkSync(controlStatementFile);

            // create a temporary file from the template file that has the proper high level qualifier to delete the VSAM file
            controlStatementFile = createTestAMSStatementFileFromTemplate(
                process.cwd() + "/packages/zosfiles/__tests__/__system__/api/methods/invoke/DeleteVSAM.ams",
                dsname);

            response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_file.sh",
                TEST_ENVIRONMENT, [controlStatementFile]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            // Delete the temp file
            fs.unlinkSync(controlStatementFile);
        });
    });

    describe("Expected failures", () => {

        it("should fail due to controlStatements not specified", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_missing_statement.sh", TEST_ENVIRONMENT);
            expect(stripNewLines(response.stderr.toString())).toContain("Syntax Error");
            expect(stripNewLines(response.stderr.toString())).toContain("Missing Positional");
            expect(stripNewLines(response.stderr.toString())).toContain("controlStatements");
        });
    });
});
