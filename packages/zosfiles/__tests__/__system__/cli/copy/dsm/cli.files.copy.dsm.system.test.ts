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
import { List } from "../../../../..";
import { IZosmfListResponse } from "../../../../../src/api/methods/list/doc/IZosmfListResponse";
import { Session } from "@zowe/imperative";

let TEST_ENVIRONMENT: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let fromDSName: string;
let toDSName: string;
let user: string;
let REAL_SESSION: Session;

const scriptsLocation = join(__dirname, "__scripts__", "command");
const createPartitionedScript = join(scriptsLocation, "command_create_data_set_partitioned.sh");
const uploadScript = join(scriptsLocation, "command_upload_dtp.sh");
const deleteScript = join(scriptsLocation, "command_delete_data_set.sh");
const copyScript = join(scriptsLocation, "command_copy_data_set_member.sh");
const copyScriptReplace = join(scriptsLocation, "command_copy_data_set_member_with_replace.sh");
const copyScriptVolume = join(scriptsLocation, "command_copy_data_set_member_with_volumes.sh");
const copyScriptAlias = join(scriptsLocation, "command_copy_data_set_member_with_alias.sh");
const copyScriptEnqueue = join(scriptsLocation, "command_copy_data_set_member_with_enqueue.sh");
const localDirName = join(__dirname, "__data__", "command_upload_dtp_dir");
const memberName = "mem1";

describe("Copy dataset member", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_copy_data_set"
        });
        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        fromDSName = `${user}.FROM.PDS`;
        toDSName = `${user}.TO.PDS`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    beforeEach(async () => {
        runCliScript(createPartitionedScript, TEST_ENVIRONMENT, [fromDSName]);
        runCliScript(createPartitionedScript, TEST_ENVIRONMENT, [toDSName]);
        runCliScript(uploadScript, TEST_ENVIRONMENT, [localDirName, fromDSName]);
    });

    afterEach(async () => {
        runCliScript(deleteScript, TEST_ENVIRONMENT, [fromDSName]);
        runCliScript(deleteScript, TEST_ENVIRONMENT, [toDSName]);
    });

    describe("Success scenarios", () => {
        it("Should copy a single member", async () => {
            const response = runCliScript(copyScript, TEST_ENVIRONMENT, [
                fromDSName,
                memberName,
                toDSName,
                memberName,
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
        });
        it("Should copy all members of a data set", async () => {
            const response = runCliScript(copyScript, TEST_ENVIRONMENT, [
                fromDSName,
                "*",
                toDSName,
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
        });
        it("Should copy a single member and replace existing members", async () => {
            runCliScript(uploadScript, TEST_ENVIRONMENT, [localDirName, toDSName]);
            const response = runCliScript(copyScriptReplace, TEST_ENVIRONMENT, [
                fromDSName,
                memberName,
                toDSName,
                memberName,
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
        });
        it("Should copy a data set member with from and to volume specified", async () => {
            let fromVolume;
            let toVolume;
            let error;

            try {
                const listOfFromDataSets = await List.dataSet(REAL_SESSION, fromDSName, {attributes: true});
                listOfFromDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => fromVolume = dataSetObj.vol);

                const listOfToDataSets = await List.dataSet(REAL_SESSION, toDSName, { attributes: true });
                listOfToDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => toVolume = dataSetObj.vol);
            } catch (err) {
                error = err;
            }

            const response = runCliScript(copyScriptVolume, TEST_ENVIRONMENT, [
                fromDSName,
                memberName,
                toDSName,
                memberName,
                fromVolume,
                toVolume,
            ]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
            expect(error).toBeUndefined();
        });
        it("Should copy a data set member with alias = true", async () => {
            const response = runCliScript(copyScriptAlias, TEST_ENVIRONMENT, [
                fromDSName,
                memberName,
                toDSName,
                memberName,
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
        });
        it("Should copy a data set member with enqueue = SHRW", async () => {
            const response = runCliScript(copyScriptEnqueue, TEST_ENVIRONMENT, [
                fromDSName,
                memberName,
                toDSName,
                memberName,
                "SHRW"
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
        });
    });
    describe("Failure scenarios", () => {
        it("Shouldn't be able to replace a data set member without --replace flag", async () => {
            runCliScript(uploadScript, TEST_ENVIRONMENT, [localDirName, toDSName]);
            const response = runCliScript(copyScriptAlias, TEST_ENVIRONMENT, [
                fromDSName,
                memberName,
                toDSName,
                memberName,
            ]);
            expect(response.stderr.toString()).toContain("Like-named member already exists");
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
        it("Shouldn't be able to copy a data set member with invalid enqueue type", async () => {
            const response = runCliScript(copyScriptEnqueue, TEST_ENVIRONMENT, [fromDSName, toDSName, "ABC"]);
            expect(response.stderr.toString()).toContain("Invalid value specified for option");
            expect(response.stderr.toString()).toMatchSnapshot();
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });
});
