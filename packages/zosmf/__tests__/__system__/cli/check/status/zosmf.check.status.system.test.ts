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

import { runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { IO } from "@brightside/imperative";

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let host: string;
let port: number;
let user: string;
let pass: string;


describe("zosmf check status", () => {
    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_check_status"
        });

        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        host = systemProps.getDefaultSystem().zosmf.host;
        port = systemProps.getDefaultSystem().zosmf.port;
        user = systemProps.getDefaultSystem().zosmf.user;
        pass = systemProps.getDefaultSystem().zosmf.pass;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {

        it("should display zosmf help", async () => {
            const response = runCliScript(__dirname + "/__scripts__/zosmf_check_status_help.sh", testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should display successful connection to z/OSMF", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_check_status.sh", testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(stripNewLines(response.stdout.toString())).toContain("The user '" + user + "' successfully connected to z/OSMF");
        });

        it("should display successful connection to z/OSMF and print attributes", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_check_status.sh", testEnvironment, ["--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(stripNewLines(response.stdout.toString())).toContain("The user '" + user + "' successfully connected to z/OSMF");
        });
    });

    describe("Expected failures", () => {

        it("should fail due to invalid status command", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_check_missing_status.sh", testEnvironment);
            expect(stripNewLines(response.stderr.toString())).toContain("Command failed due to improper syntax");
        });

        it("should fail due to invalid port", async () => {
            // create a temporary zowe profile with an invalid port
            const scriptPath = testEnvironment.workingDir + "_create_profile_invalid_port";
            const command = "zowe profiles create zosmf " + host + "temp --host " + host + " --port " + port + 1
                + " --user " + user + " --password " + pass + " --ru false";
            await IO.writeFileAsync(scriptPath, command);
            let response = runCliScript(scriptPath, testEnvironment);
            expect(response.status).toBe(0);
            // default to the temporary profile
            await IO.writeFileAsync(scriptPath, "zowe profiles set  zosmf " + host + "temp");
            response = runCliScript(scriptPath, testEnvironment);
            expect(response.status).toBe(0);
            // now check the status
            response = runCliScript(__dirname + "/__scripts__/command/zosmf_check_status.sh", testEnvironment);
            expect(stripNewLines(response.stderr.toString())).toContain(`Unable to establish connection at port ${port + "1"}`);
        });
    });
});
