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
import { runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { Upload } from "@zowe/zos-files-for-zowe-sdk";
import { join } from "path";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/ITestEnvironment";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let owner: string;
let uniqueFileName: string;
const workflow = join(__dirname, "../../../../../../workflows/__tests__/__system__/testfiles/demo.xml");

describe("Retrieve workflow definition cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "workflow_definition_cli"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        owner = defaultSystem.zosmf.user;
        uniqueFileName = getUniqueDatasetName(owner);
        definitionFile = `${defaultSystem.unix.testdir}/${uniqueFileName}.xml`;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });
    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("List workflow definition file details", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUssFile(REAL_SESSION, workflow, definitionFile, { binary: true });
            testEnvironment.resources.files.push(definitionFile);
        });
        describe("Success Scenarios", () => {
            it("Should return the details of a workflow definition file.", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_definition_file_details.sh",
                    testEnvironment, [`/${defaultSystem.unix.testdir.toLocaleLowerCase()}/${uniqueFileName}.xml`]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain(`success": true`);
            });
            it("Should return a message if search does not match any existing files", () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_definition_file_details.sh",
                    testEnvironment, [`/${defaultSystem.unix.testdir.toLocaleLowerCase()}/${uniqueFileName}`]);
                expect(response.status).toBe(1);
                expect(response.stdout.toString()).toContain("not found or cannot be accessed.");
            });

            it("Should return a message if search is for a diectory", () => {
                const fakeName = `/${defaultSystem.unix.testdir.toLocaleLowerCase()}`;
                const response = runCliScript(__dirname + "/__scripts__/command/command_definition_file_details.sh",
                    testEnvironment, [fakeName]);
                expect(response.status).toBe(1);
                expect(response.stdout.toString()).toContain("is not a UNIX file");
            });
        });
    });
});
