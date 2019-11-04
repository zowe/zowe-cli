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
import { List } from "../../../../../src/api";
import { Session } from "@zowe/imperative";
import { IZosmfListResponse } from "../../../../../src/api/methods/list/doc/IZosmfListResponse";

let TEST_ENVIRONMENT: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let fromDSName: string;
let toDSName: string;
let user: string;
let volume: string;
let REAL_SESSION: Session;

const scriptsLocation = join(__dirname, "__scripts__", "command");
const createSequentialScript = join(scriptsLocation, "command_create_data_set_sequential.sh");
const uploadScript = join(scriptsLocation, "command_upload_stds_fully_qualified.sh");
const deleteScript = join(scriptsLocation, "command_delete_data_set.sh");
const copyScript = join(scriptsLocation, "command_copy_data_set.sh");
const copyScriptVolumes = join(scriptsLocation, "command_copy_data_set_volumes.sh");
const copyScriptAlias = join(scriptsLocation, "command_copy_data_set_alias.sh");
const copyScriptEnqueue = join(scriptsLocation, "command_copy_data_set_enqueue.sh");

describe("Copy Dataset", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_copy_data_set"
        });
        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        volume = defaultSystem.datasets.vol;
        fromDSName = `${user}.FROM.DS`;
        toDSName = `${user}.TO.DS`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            runCliScript(createSequentialScript, TEST_ENVIRONMENT, [fromDSName, volume]);
            runCliScript(createSequentialScript, TEST_ENVIRONMENT, [toDSName, volume]);
            runCliScript(uploadScript, TEST_ENVIRONMENT, [fromDSName]);
        });

        afterEach(async () => {
            runCliScript(deleteScript, TEST_ENVIRONMENT, [fromDSName]);
            runCliScript(deleteScript, TEST_ENVIRONMENT, [toDSName]);
        });

        it("Should copy a data set", async () => {
            const response = runCliScript(copyScript, TEST_ENVIRONMENT, [fromDSName, toDSName]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
        });

        it("Should copy a data set with from and to volume specified", async () => {
            let toVolume;
            let fromVolume;
            let error;

            try {
                const listOfFromDataSets = await List.dataSet(REAL_SESSION, fromDSName, {attributes: true});
                listOfFromDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => fromVolume = dataSetObj.vol);

                const listOfToDataSets = await List.dataSet(REAL_SESSION, toDSName, { attributes: true });
                listOfToDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => toVolume = dataSetObj.vol);
            } catch (err) {
                error = err;
            }

            const response = runCliScript(copyScriptVolumes, TEST_ENVIRONMENT, [
                fromDSName,
                toDSName,
                fromVolume,
                toVolume,
            ]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
            expect(error).toBeUndefined();
        });

        it("Should copy a data set with alias = true", async () => {
            const response = runCliScript(copyScriptAlias, TEST_ENVIRONMENT, [fromDSName, toDSName]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
        });

        it("Should copy a data set with enqueue = SHR", async () => {
            const response = runCliScript(copyScriptEnqueue, TEST_ENVIRONMENT, [fromDSName, toDSName, "SHR"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.stdout.toString()).toContain("Data set copied successfully.");
        });
    });
    describe("Failure scenarios", () => {
        it("Shouldn't be able to copy a data set with invalid enqueue type", async () => {
            const response = runCliScript(copyScriptEnqueue, TEST_ENVIRONMENT, [fromDSName, toDSName, "ABC"]);
            expect(response.stderr.toString()).toContain("Invalid value specified for option");
            expect(response.stderr.toString()).toMatchSnapshot();
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });
});
