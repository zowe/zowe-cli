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

import { ITestEnvironment, runCliScript } from "../__packages__/cli-test-utils";
import { TestEnvironment } from "../__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../__src__/properties/ITestPropertiesSchema";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

describe("imperative create profile", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "imperative_create_profile",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("create zosmf profile", () => {

        afterEach(async () => {
            const opts = ["CreateProfileSystemTest"];
            try {
                runCliScript(__dirname + "/__scripts__/imperative_zosmf_delete_profile.sh", testEnvironment, opts);
            } catch (err) { /* Do nothing */ }
        });

        it("should successfully create a profile", async () => {
            const opts = [
                "CreateProfileSystemTest",
                "--host", "FAKEHOST",
                "--port", "443",
                "--user", "FAKEUSER",
                "--password", "FAKEPASS",
                "--reject-unauthorized", "false"
            ];

            const response = runCliScript(__dirname + "/__scripts__/imperative_zosmf_create_profile.sh",
                testEnvironment, opts
            );
            expect(response.stderr.toString()).toContain("deprecated");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Profile created successfully!");
            expect(response.stdout.toString()).toContain("FAKEHOST");
            expect(response.stdout.toString()).toContain("443");
            expect(response.stdout.toString()).toContain("FAKEUSER");
            expect(response.stdout.toString()).toContain("FAKEPASS");
        });

        it("should successfully create a profile without username, password, or host", async () => {
            const opts = [
                "CreateProfileSystemTest",
                "--port", "443",
                "--reject-unauthorized", "false"
            ];

            const response = runCliScript(__dirname + "/__scripts__/imperative_zosmf_create_profile.sh",
                testEnvironment, opts
            );
            expect(response.stderr.toString()).toContain("deprecated");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Profile created successfully!");
            expect(response.stdout.toString()).toContain("443");
        });
    });

    describe("create ssh profile", () => {

        afterEach(async () => {
            const opts = ["CreateProfileSystemTest"];
            try {
                runCliScript(__dirname + "/__scripts__/imperative_ssh_delete_profile.sh", testEnvironment, opts);
            } catch (err) { /* Do nothing */ }
        });

        it("should successfully create a profile", async () => {
            const opts = [
                "CreateProfileSystemTest",
                "--host", "FAKEHOST",
                "--port", "22",
                "--user", "FAKEUSER",
                "--password", "FAKEPASS"
            ];

            const response = runCliScript(__dirname + "/__scripts__/imperative_ssh_create_profile.sh",
                testEnvironment, opts
            );
            expect(response.stderr.toString()).toContain("deprecated");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Profile created successfully!");
            expect(response.stdout.toString()).toContain("FAKEHOST");
            expect(response.stdout.toString()).toContain("22");
            expect(response.stdout.toString()).toContain("FAKEUSER");
            expect(response.stdout.toString()).toContain("FAKEPASS");
        });

        it("should successfully create a profile without username, password, or host", async () => {
            const opts = [
                "CreateProfileSystemTest",
                "--port", "22"
            ];

            const response = runCliScript(__dirname + "/__scripts__/imperative_ssh_create_profile.sh",
                testEnvironment, opts
            );
            expect(response.stderr.toString()).toContain("deprecated");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Profile created successfully!");
            expect(response.stdout.toString()).toContain("22");
        });
    });

    describe("create tso profile", () => {

        afterEach(async () => {
            const opts = ["CreateProfileSystemTest"];
            try {
                runCliScript(__dirname + "/__scripts__/imperative_tso_delete_profile.sh", testEnvironment, opts);
            } catch (err) { /* Do nothing */ }
        });

        it("should successfully create a profile", async () => {
            const opts = [
                "CreateProfileSystemTest",
                "--account", "FAKEACCT"
            ];

            const response = runCliScript(__dirname + "/__scripts__/imperative_tso_create_profile.sh",
                testEnvironment, opts
            );
            expect(response.stderr.toString()).toContain("deprecated");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Profile created successfully!");
        });

        it("should successfully create a profile without username, password, or host", async () => {
            const opts = [
                "CreateProfileSystemTest"
            ];

            const response = runCliScript(__dirname + "/__scripts__/imperative_tso_create_profile.sh",
                testEnvironment, opts
            );
            expect(response.stderr.toString()).toContain("deprecated");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Profile created successfully!");
            expect(response.stdout.toString()).not.toContain("FAKEACCT");
        });
    });
});
