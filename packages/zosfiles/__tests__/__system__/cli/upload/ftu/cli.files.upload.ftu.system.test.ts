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

import { Imperative, IO, Session } from "@brightside/imperative";
import * as path from "path";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Get, ZosFilesConstants } from "../../../../../index";
import { ZosmfRestClient } from "../../../../../../rest";

let REAL_SESSION: Session;
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let ussname: string;

describe("Upload uss file", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "upload_uss_file"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_upload_file_to_uss_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        it("should upload USS file from local file", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_fully_qualified.sh");
            const localFileName = path.join(__dirname, "__data__", "command_upload_ftu.txt");

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

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

        it("should upload USS file from local file", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_ftu.sh");
            const localFileName = path.join(__dirname, "__data__", "command_upload_ftu.txt");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("USS file uploaded successfully");
        });

    });

});

