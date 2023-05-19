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
import { Session } from "@zowe/imperative";
import * as nodePath from "path";

const yaml = require("js-yaml");
const propfilename: string = process.env.propfile || "custom_properties.yaml";
const propfiledir: string = process.env.propdirectory || nodePath.resolve(__dirname + "/../../../../../../__tests__/__resources__/properties/") + "/";
const propfile: string = propfiledir + propfilename;
const jsonObject = yaml.safeLoad(fs.readFileSync(propfile, "utf8"));

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let systemProps: ITestPropertiesSchema;
let REAL_SESSION: Session;
let acc: string = jsonObject.tso.account;

describe("zos-tso issue command", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_tso_start_as",
            tempProfileTypes: ["zosmf", "tso"]
        });

        systemProps = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        acc = systemProps.tso.account.toString();
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should successfully issue command = \"time\"", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/address_space_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/as/address_space_success.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    it("should honor the logon proc specified in the profile", async () => {
        systemProps = TEST_ENVIRONMENT.systemTestProperties;
        const fakeProc = "F4K3PR0C";
        const response = runCliScript(__dirname + "/__scripts__/as/change_proc.sh", TEST_ENVIRONMENT, [
            systemProps.tso.account,
            fakeProc
        ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain(fakeProc);
    });

    describe("without profiles", () => {

        // Create a separate test environment for no profiles
        let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
        let SYSTEM_PROPS: ITestPropertiesSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_tso_issue_cmd_without_profiles"
            });

            SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should successfully issue command = \"time\" without a profile", async () => {
            const regex = fs.readFileSync(__dirname + "/__regex__/address_space_response.regex").toString();

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (SYSTEM_PROPS.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = SYSTEM_PROPS.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/as/issue_command_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    SYSTEM_PROPS.zosmf.host,
                    SYSTEM_PROPS.zosmf.port,
                    SYSTEM_PROPS.zosmf.user,
                    SYSTEM_PROPS.zosmf.password,
                    SYSTEM_PROPS.tso.account,
                ]
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        });

        (acc.includes("#") ? it : it.skip)("should successfully issue command = \"time\" with an account with an # in it", async () => {
            const regex = fs.readFileSync(__dirname + "/__regex__/address_space_response.regex").toString();

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (SYSTEM_PROPS.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = SYSTEM_PROPS.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/as/issue_command_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    SYSTEM_PROPS.zosmf.host,
                    SYSTEM_PROPS.zosmf.port,
                    SYSTEM_PROPS.zosmf.user,
                    SYSTEM_PROPS.zosmf.password,
                    "ACCT#"
                ]
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
        });
    });
});
