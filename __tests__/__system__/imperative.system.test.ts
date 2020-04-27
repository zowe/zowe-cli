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

import { runCliScript, stripNewLines } from "../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../__tests__/__src__/properties/ITestPropertiesSchema";

let testEnvironment: ITestEnvironment;
let host: string;
let port: number;
let user: string;
let pass: string;
let systemProps: ITestPropertiesSchema;

describe("imperative zosmf create profile", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_check_status"
        });

        systemProps = testEnvironment.systemTestProperties;
        host = systemProps.zosmf.host;
        port = systemProps.zosmf.port;
        user = systemProps.zosmf.user;
        pass = systemProps.zosmf.pass;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("create profile", () => {

        // Create a separate test environment for no profiles
        let TEST_ENVIRONMENT: ITestEnvironment;
        let SYSTEM_PROPS: ITestPropertiesSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT = await TestEnvironment.setUp({
                testName: "zosmf_create_profile"
            });

            SYSTEM_PROPS = TEST_ENVIRONMENT.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        });

        afterEach(async () => {
            const opts = ["CreateProfileSystemTest"];
            try {
                runCliScript(__dirname + "/__scripts__/imperative_zosmf_delete_profile.sh", TEST_ENVIRONMENT, opts);
            // tslint:disable-next-line: no-empty
            } catch (err) { }
        });

        it("should successfully create a profile", async () => {
            const opts = [
                "CreateProfileSystemTest",
                "--host", SYSTEM_PROPS.zosmf.host,
                "--port", SYSTEM_PROPS.zosmf.port,
                "--user", SYSTEM_PROPS.zosmf.user,
                "--password", SYSTEM_PROPS.zosmf.pass,
                "--reject-unauthorized", SYSTEM_PROPS.zosmf.rejectUnauthorized
            ];

            const response = runCliScript(__dirname + "/__scripts__/imperative_zosmf_create_profile.sh",
                TEST_ENVIRONMENT, opts
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Profile created successfully!");
            expect(response.stdout.toString()).toContain(SYSTEM_PROPS.zosmf.host);
            expect(response.stdout.toString()).toContain(SYSTEM_PROPS.zosmf.port);
            expect(response.stdout.toString()).toContain(SYSTEM_PROPS.zosmf.user);
            expect(response.stdout.toString()).toContain(SYSTEM_PROPS.zosmf.pass);
        });

        it("should successfully create a profile without username, password, or host", async () => {
            const opts = [
                "CreateProfileSystemTest",
                "--port", SYSTEM_PROPS.zosmf.port,
                "--reject-unauthorized", SYSTEM_PROPS.zosmf.rejectUnauthorized
            ];

            const response = runCliScript(__dirname + "/__scripts__/imperative_zosmf_create_profile.sh",
                TEST_ENVIRONMENT, opts
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Profile created successfully!");
            expect(response.stdout.toString()).toContain(SYSTEM_PROPS.zosmf.port);
        });
    });
});
