/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { Session } from "@brightside/imperative";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Delete } from "../../../../../src/api/methods/delete";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;
let dsnameSuffix: string;
let user: string;

describe("Create C Data Set", () => {

    describe("Success scenarios", () => {

        // Create the unique test environment
        beforeAll(async () => {
            testEnvironment = await TestEnvironment.setUp({
                tempProfileTypes: ["zosmf"],
                testName: "zos_create_C_dataset"
            });

            systemProps = new TestProperties(testEnvironment.systemTestProperties);
            defaultSystem = systemProps.getDefaultSystem();

            REAL_SESSION = new Session({
                user: defaultSystem.zosmf.user,
                password: defaultSystem.zosmf.pass,
                hostname: defaultSystem.zosmf.host,
                port: defaultSystem.zosmf.port,
                type: "basic",
                rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized,
            });

            user = defaultSystem.zosmf.user.trim().toUpperCase();
            dsname = `${user}.TEST.DATA.SET`;

        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(testEnvironment);
        });

        beforeEach(() => {
            dsnameSuffix = "";  // reset
        });

        afterEach(async () => {
            // use DELETE APIs
            if (dsnameSuffix !== "") {
                const response = await Delete.dataSet(REAL_SESSION, dsname + "." + dsnameSuffix);
            }
        });

        it("should display create help", () => {
            const response = runCliScript(__dirname + "/__scripts__/create_c_pds_help.sh", testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a c partitioned data set", () => {
            dsnameSuffix = "c";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_c_pds.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a c partitioned data set and print attributes", () => {
            dsnameSuffix = "c";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_c_pds_rfj.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should create a c partitioned data set with specified size", () => {
            dsnameSuffix = "c.size";
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_c_pds_with_size.sh",
                testEnvironment, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {
        it("should fail creating a C partitioned data set due to missing data set name", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_c_fail_missing_dataset_name.sh", testEnvironment);

            expect(response.stderr.toString()).toContain("Missing Positional Option");
            expect(response.stderr.toString()).toContain("dataSetName");
            expect(response.status).toBe(1);
        });
    });
});
