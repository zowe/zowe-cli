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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import * as fs from "fs";
import * as nodeJsPath from "path";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

describe("daemon enable", () => {
    const rimraf = require("rimraf").sync;
    let pathToBin: string;

    beforeAll(async () => {
        // Create the unique test environment
        testEnvironment = await TestEnvironment.setUp({
            testName: "daemon_enable_integration",
            skipProperties: true
        });
        pathToBin = nodeJsPath.normalize(testEnvironment.workingDir + "/bin");
    });

    beforeEach(async () => {
        // Remove any existing bin directory
        rimraf(pathToBin);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable_help.sh", testEnvironment);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail if a bin file exists", async () => {
        fs.writeFileSync(pathToBin, "not a directory");
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        const stdoutStr = response.stdout.toString();
        expect(stdoutStr).toContain("Failed to enable daemon mode.");
        expect(stdoutStr).toContain(`The existing file '${pathToBin}' must be a directory.`);
        expect(response.status).toBe(1);
    });

    it("should place exe in a new bin dir", async () => {
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        expect(response.status).toBe(0);
        // todo: confirm exe exists
    });

    it("should place exe in an existing bin dir", async () => {
        fs.mkdirSync(pathToBin, 0o755);
        const response = runCliScript(__dirname + "/__scripts__/daemon_enable.sh", testEnvironment);
        expect(response.status).toBe(0);
        // todo: confirm exe exists
    });
});
