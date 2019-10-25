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

import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { join } from "path";

let TEST_ENVIRONMENT: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let fromDsName: string;
let toDsName: string;
let user: string;

const scriptsLocation = join(__dirname, "__scripts__", "command");
const createPartitionedScript = join(scriptsLocation, "command_create_data_set_partitioned.sh");
const uploadScript = join(scriptsLocation, "command_upload_dtp.sh");
const deleteScript = join(scriptsLocation, "command_delete_data_set.sh");
const copyScript = join(scriptsLocation, "command_copy_data_set_member.sh");
const copyScriptReplace = join(scriptsLocation, "command_copy_data_set_member_with_replace.sh");
const localDirName = join(__dirname, "__data__", "command_upload_dtp_dir");
const memberName = "mem1";

describe("Copy Dataset", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_copy_data_set"
        });
        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        fromDsName = `${user}.FROM.PDS`;
        toDsName = `${user}.TO.PDS`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Member", () => {
        beforeEach(async () => {
            runCliScript(createPartitionedScript, TEST_ENVIRONMENT, [fromDsName]);
            runCliScript(createPartitionedScript, TEST_ENVIRONMENT, [toDsName]);
            runCliScript(uploadScript, TEST_ENVIRONMENT, [localDirName, fromDsName]);
        });

        afterEach(async () => {
            runCliScript(deleteScript, TEST_ENVIRONMENT, [fromDsName]);
            runCliScript(deleteScript, TEST_ENVIRONMENT, [toDsName]);
        });
        describe("Success scenarios", () => {
            it("copy a single member", async () => {
                const response = runCliScript(copyScript, TEST_ENVIRONMENT, [
                    fromDsName,
                    memberName,
                    toDsName,
                    memberName,
                ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
            });
            it("copy all members", async () => {
                const response = runCliScript(copyScript, TEST_ENVIRONMENT, [
                    fromDsName,
                    "*",
                    toDsName,
                ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
            });
            it("copy a single member and replace existing member", async () => {
                runCliScript(uploadScript, TEST_ENVIRONMENT, [localDirName, toDsName]);
                const response = runCliScript(copyScriptReplace, TEST_ENVIRONMENT, [
                    fromDsName,
                    memberName,
                    toDsName,
                    memberName,
                ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
            });
        });
        describe("Failure scenarios", () => {
            it("cannot replace a member without --replace flag", async () => {
                runCliScript(uploadScript, TEST_ENVIRONMENT, [localDirName, toDsName]);
                const response = runCliScript(copyScript, TEST_ENVIRONMENT, [
                    fromDsName,
                    memberName,
                    toDsName,
                    memberName,
                ]);
                expect(response.stderr.toString()).toContain("Like-named member already exists");
                expect(response.status).toBe(1);
                expect(response.stdout.toString()).toMatchSnapshot();
            });
        });
    });
});
