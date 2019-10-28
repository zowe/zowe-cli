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
let fromDSName: string;
let toDSName: string;
let user: string;
let volume: string;

const scriptsLocation = join(__dirname, "__scripts__", "command");
const createSequentialScript = join(scriptsLocation, "command_create_data_set_sequential.sh");
const uploadScript = join(scriptsLocation, "command_upload_stds_fully_qualified.sh");
const deleteScript = join(scriptsLocation, "command_delete_data_set.sh");
const copyScript = join(scriptsLocation, "command_copy_data_set.sh");
const copyScriptWithVolumes = join(scriptsLocation, "command_copy_data_set_volumes.sh");

describe("Copy Dataset", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_copy_data_set"
        });
        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        user = defaultSystem.zosmf.user.trim().toUpperCase();

        volume = defaultSystem.datasets.vol;
        fromDSName = `${user}.FROM.DS`;
        toDSName = `${user}.TO.DS`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Sequential", () => {
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

            it("copy", async () => {
                const response = runCliScript(copyScript, TEST_ENVIRONMENT, [fromDSName, toDSName]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
            });

            it("copy with from and to volume specified", async () => {
                const response = runCliScript(copyScriptWithVolumes, TEST_ENVIRONMENT, [
                    fromDSName,
                    toDSName,
                    volume,
                    volume,
                ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
            });
        });
    });
});
