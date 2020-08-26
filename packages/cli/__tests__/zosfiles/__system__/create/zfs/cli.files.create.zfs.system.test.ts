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
import { getUniqueDatasetName, runCliScript } from "../../../../../../../../__tests__/__src__/TestUtils";
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
let fsname: string;
let volume: string;

describe("Create z/OS File System", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_zos_file_system"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        fsname = getUniqueDatasetName(defaultSystem.zosmf.user);
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
                testName: "zos_files_create_zos_file_system_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterEach(async () => {
            // use DELETE APIs
            await Delete.zfs(REAL_SESSION, fsname);
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should create a z/OS file system", () => {
            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_create_zfs_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [fsname, volume,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });
    });

    describe("Success scenarios", () => {

        afterEach(async () => {
            const response = await Delete.zfs(REAL_SESSION, fsname);
        });

        it("should create a ZFS", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_zfs.sh",
                TEST_ENVIRONMENT, [fsname, volume]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        it("should create a ZFS with response timeout", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_zfs.sh",
                TEST_ENVIRONMENT, [fsname, volume, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        it("should create a ZFS with primary and secondary cylinders specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_zfs.sh",
                TEST_ENVIRONMENT, [fsname, volume, `--cp 100 --cs 10`]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });
    });
});
