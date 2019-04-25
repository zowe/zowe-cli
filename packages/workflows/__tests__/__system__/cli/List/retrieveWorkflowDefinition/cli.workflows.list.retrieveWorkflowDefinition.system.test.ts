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

import { ZosmfRestClient } from "../../../../../../rest";
import { Session } from "@brightside/imperative";
import { getUniqueDatasetName, runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { Upload } from "../../../../../../zosfiles/src/api/methods/upload";
import { ZosFilesConstants } from "../../../../../../zosfiles/src/api";
import { join } from "path";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let system: string;
let owner: string;
let wfName: string;
let uniqueFileName: string;
const workflow = join(__dirname, "../../../testfiles/demo.xml");

describe("Retrieve workflow definition cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "workflow_definition_cli"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
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
            await Upload.fileToUSSFile(REAL_SESSION, workflow, definitionFile, true);
        });
        afterAll(async () => {
            let error;
            let response;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES;
            // deleting uploaded workflow file
            try {
                const wfEndpoint = endpoint + definitionFile;
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, wfEndpoint);
            } catch (err) {
                error = err;
            }
        });
        describe("Success Scenarios", () => {
            it("Should return the details of a workflow definition file.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_definition_file_details.sh",
                    testEnvironment, [`/${defaultSystem.unix.testdir.toLocaleLowerCase()}/${uniqueFileName}.xml`]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain(`success": true`);
            });
            it("Should return a message if search does not match any existing files", async () => {
                const response = await runCliScript(__dirname + "/__scripts__/command/command_definition_file_details.sh",
                    testEnvironment, [`/${defaultSystem.unix.testdir.toLocaleLowerCase()}/${uniqueFileName}`]);
                expect(response.status).toBe(1);
                expect(response.stdout.toString()).toContain("not found or cannot be accessed.");
            });

            it("Should return a message if search is for a diectory", async () => {
                const fakeName = `/${defaultSystem.unix.testdir.toLocaleLowerCase()}`;
                const response = await runCliScript(__dirname + "/__scripts__/command/command_definition_file_details.sh",
                    testEnvironment, [fakeName]);
                expect(response.status).toBe(1);
                expect(response.stdout.toString()).toContain("is not a UNIX file");
            });
        });
    });
});
