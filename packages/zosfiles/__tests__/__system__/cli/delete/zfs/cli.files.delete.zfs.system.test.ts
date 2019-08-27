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
import { getUniqueDatasetName, runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let fsname: string;
let volume: string;

describe("Delete z/OS File System", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_delete_zos_file_system"
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
                testName: "zos_files_delete_zos_file_system_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should delete a ZFS", async () => {
            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            let response = runCliScript(__dirname + "/__scripts__/command/command_create_zfs_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF, [fsname, volume,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);

            response = runCliScript(__dirname + "/__scripts__/command/command_delete_zfs_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF, [fsname, "--for-sure",
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
        it("should delete a ZFS", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_create_zfs.sh",
                TEST_ENVIRONMENT, [fsname, volume]);

            response = runCliScript(__dirname + "/__scripts__/command/command_delete_zfs.sh",
                TEST_ENVIRONMENT, [fsname, "--for-sure"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {
        it("should fail deleting a ZFS that does not exist", async () => {
            const notExistZfs = `${fsname}.NOTEXIST`;
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_zfs.sh",
                TEST_ENVIRONMENT, [notExistZfs, "--for-sure"]);
            expect(response.status).toBe(1);
            expect(stripNewLines(response.stderr.toString())).toContain(`ENTRY ${notExistZfs} NOT DELETED`);
        });
    });
});
