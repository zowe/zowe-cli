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
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { Delete, IDeleteVsamOptions } from "@zowe/zos-files-for-zowe-sdk";

const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let volume: string;

describe("Create VSAM Data Set", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_vsam_data_set"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.VSAM`);
        volume = defaultSystem.datasets.vol;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_create_vsam_data_set_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterEach(async () => {
            // use DELETE APIs
            const deleteOptions: IDeleteVsamOptions = {} as any;

            deleteOptions.purge = true;

            const response = await Delete.vsam(REAL_SESSION, dsname, deleteOptions);
        });

        it("should create a VSAM data set", () => {

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_create_vsam_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [dsname,
                    `-v ${volume}`,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });
    });

    describe("Success scenarios", () => {

        afterEach(async () => {
            // use DELETE APIs
            const deleteOptions: IDeleteVsamOptions = {} as any;

            deleteOptions.purge = true;

            const response = await Delete.vsam(REAL_SESSION, dsname, deleteOptions);
        });

        it("should create a VSAM data set", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_vsam.sh",
                TEST_ENVIRONMENT, [dsname, `-v ${volume}`]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        it("should create a VSAM data set with response timeout", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_vsam.sh",
                TEST_ENVIRONMENT, [dsname, `-v ${volume} --responseTimeout 5`]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        it("should create a VSAM data set specifying 'retain-to'", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_vsam.sh",
                TEST_ENVIRONMENT, [dsname, `-v ${volume} --rt ${new Date().getFullYear() + 1}360`]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        it("should create a VSAM data set specifying 'size '", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_vsam.sh",
                TEST_ENVIRONMENT, [dsname, `-v ${volume} --size 30MB`]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });
    });
});
