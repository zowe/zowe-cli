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
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { ZosFilesMessages } from "../../../../../src/api/constants/ZosFiles.messages";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let user: string;
let volume: string;

describe("Invoke AMS CLI", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_invoke_ams"
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
        volume = defaultSystem.datasets.list[0].vol;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {

        it("should display invoke and invoke ams help", async () => {
            const response = runCliScript(__dirname + "/__scripts__/invoke_ams_help.sh", testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should invoke ams to create and then delete a VSAM cluster using control statements", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            let testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_delete_statement.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);
        });

        it("should invoke ams to create and then delete a VSAM cluster using a control statement and print attributes", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement_rfj.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            let testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_delete_statement_rfj.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);
        });
    });

    describe("Expected failures", () => {

        it("should fail due to controlStatements not specified", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_missing_statement.sh", testEnvironment);
            expect(stripNewLines(response.stderr.toString())).toContain("Syntax Error");
            expect(stripNewLines(response.stderr.toString())).toContain("Missing Positional");
            expect(stripNewLines(response.stderr.toString())).toContain("controlStatements");
        });
    });
});
