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

import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { Imperative } from "@zowe/imperative";
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("zos-tso ping address-space", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_tso_start_as",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/address-space/address_space_help.sh", TEST_ENVIRONMENT);
        // Imperative.console.info(inspect(response));
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

});
