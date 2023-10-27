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

import * as path from "path";
import * as fs from "fs";

import { ITestEnvironment } from "../../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../../src/TestUtil";
import { homedir } from "os";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let envFileHome: string;
let envFileCli: string;

describe("imperative-test-cli config report-env", () => {
    // Create the test environment
    beforeAll(async () => {
        const serverAddressRegex = /(http.*)\s/;

        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_report-env_command"
        });

        envFileHome = path.join(homedir(), ".imperative-test-cli.env.json");
        envFileCli = path.join(process.env.IMPERATIVE_TEST_CLI_CLI_HOME as string, ".imperative-test-cli.env.json");
    });

    afterEach(() => {
        try {
            fs.unlinkSync(envFileHome);
        } catch (err) {
            // do nothing
        }

        try {
            fs.unlinkSync(envFileCli);
        } catch (err) {
            // do nothing
        }

        process.env.IMPERATIVE_TEST_CLI_CLI_HOME = TEST_ENVIRONMENT.workingDir;
    });

    describe("success scenarios", () => {

        it("should display the help", () => {
            const response = runCliScript(__dirname + "/../__scripts__/get_help.sh", TEST_ENVIRONMENT.workingDir, ["report-env"]);
            expect(response.output.toString()).toContain("report-env");
            expect(response.output.toString()).toContain("Reports key items from your environment and identifies problem conditions");
            expect(response.output.toString()).toContain("Report information and issues about");
            expect(response.error).toBeFalsy();
            expect(response.stderr.toString()).toEqual("");
        });

        it("should successfully produce a report", async () => {
            const pluginsDir = path.join(TEST_ENVIRONMENT.workingDir, "plugins");
            if (!fs.existsSync(pluginsDir)) {
                fs.mkdirSync(pluginsDir);
            }
            fs.copyFileSync(path.join(__dirname, "/__resources__/plugins.json"),
                path.join(pluginsDir, "/plugins.json")
            );

            fs.copyFileSync(path.join(__dirname, "/__resources__/test.config.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json")
            );
            fs.copyFileSync(path.join(__dirname, "/__resources__/test.schema.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "test.schema.good.json")
            );

            const response = runCliScript(path.join(__dirname, "/__scripts__/report-env.sh"),
                TEST_ENVIRONMENT.workingDir
            );

            expect(response.error).toBeFalsy();
            expect(response.output.toString()).toContain("Zowe CLI version =");
            expect(response.output.toString()).toContain("Node.js version =");
            expect(response.output.toString()).toContain("Node Version Manager version =");
            expect(response.output.toString()).toContain("O.S. platform =");
            expect(response.output.toString()).toContain("O.S. architecture =");
            expect(response.output.toString()).toContain("O.S. PATH =");
            expect(response.output.toString()).toContain("ZOWE_CLI_HOME =");
            expect(response.output.toString()).toContain("ZOWE_APP_LOG_LEVEL =");
            expect(response.output.toString()).toContain("ZOWE_IMPERATIVE_LOG_LEVEL =");
            expect(response.output.toString()).toContain("NPM version =");
            expect(response.output.toString()).toContain("Shell =");
            expect(response.output.toString()).toContain("Global prefix =");
            expect(response.output.toString()).toContain("registry =");
            expect(response.output.toString()).toContain("node bin location =");
            expect(response.output.toString()).toContain("HOME =");
            expect(response.output.toString()).toContain("Zowe CLI configuration information");
            expect(response.output.toString()).toContain("Zowe daemon mode =");
            expect(response.output.toString()).toContain("Zowe config type = V2 Team Config");
            expect(response.output.toString()).toContain("Team config files in effect:");
            expect(response.output.toString()).toContain("imperative-test-cli.config.json");
            expect(response.output.toString()).toContain("Default profile names:");
            expect(response.output.toString()).toContain("base = myBase");
            expect(response.output.toString()).toContain("tso =  myTso");
            expect(response.output.toString()).toContain("zosmf =myMainZosmf");
            expect(response.output.toString()).toContain("Available profile names:");
            expect(response.output.toString()).toContain("mySecondaryZosmf");
            expect(response.output.toString()).toContain("Installed plugins:");
            expect(response.output.toString()).toContain("Package = @zowe/cics-for-zowe-cli");
            expect(response.output.toString()).toContain("Package = @broadcom/endevor-for-zowe-cli@zowe-v2-lts");
            expect(response.output.toString()).toContain("Package = @zowe/ims-for-zowe-cli");
            expect(response.output.toString()).toContain("Package = @zowe/zos-ftp-for-zowe-cli");
            expect(response.output.toString()).toContain("This information contains site-specific data. Redact anything required");
        });

        it("should set up environment with file and successfully produce a report - home directory", async () => {
            const pluginsDir = path.join(TEST_ENVIRONMENT.workingDir, "plugins");
            if (!fs.existsSync(pluginsDir)) {
                fs.mkdirSync(pluginsDir);
            }
            fs.copyFileSync(path.join(__dirname, "/__resources__/plugins.json"),
                path.join(pluginsDir, "/plugins.json")
            );

            fs.copyFileSync(path.join(__dirname, "/__resources__/test.config.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json")
            );
            fs.copyFileSync(path.join(__dirname, "/__resources__/test.schema.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "test.schema.good.json")
            );

            fs.writeFileSync(envFileHome, '{"ZOWE_OPT_TEST": "TEST_VARIABLE"}');

            const response = runCliScript(path.join(__dirname, "/__scripts__/report-env.sh"),
                TEST_ENVIRONMENT.workingDir
            );

            expect(response.error).toBeFalsy();
            expect(response.stdout.toString()).toContain("Zowe CLI version =");
            expect(response.stdout.toString()).toContain("Node.js version =");
            expect(response.stdout.toString()).toContain("Node Version Manager version =");
            expect(response.stdout.toString()).toContain("O.S. platform =");
            expect(response.stdout.toString()).toContain("O.S. architecture =");
            expect(response.stdout.toString()).toContain("O.S. PATH =");
            expect(response.stdout.toString()).toContain("ZOWE_CLI_HOME =");
            expect(response.stdout.toString()).toContain("ZOWE_APP_LOG_LEVEL =");
            expect(response.stdout.toString()).toContain("ZOWE_IMPERATIVE_LOG_LEVEL =");
            expect(response.stdout.toString()).toContain("ZOWE_OPT_TEST = TEST_VARIABLE");
            expect(response.stdout.toString()).toContain("NPM version =");
            expect(response.stdout.toString()).toContain("Shell =");
            expect(response.stdout.toString()).toContain("Global prefix =");
            expect(response.stdout.toString()).toContain("registry =");
            expect(response.stdout.toString()).toContain("node bin location =");
            expect(response.stdout.toString()).toContain("HOME =");
            expect(response.stdout.toString()).toContain("Zowe CLI configuration information");
            expect(response.stdout.toString()).toContain("Zowe daemon mode =");
            expect(response.stdout.toString()).toContain("Zowe config type = V2 Team Config");
            expect(response.stdout.toString()).toContain("Team config files in effect:");
            expect(response.stdout.toString()).toContain("imperative-test-cli.config.json");
            expect(response.stdout.toString()).toContain("Default profile names:");
            expect(response.stdout.toString()).toContain("base = myBase");
            expect(response.stdout.toString()).toContain("tso =  myTso");
            expect(response.stdout.toString()).toContain("zosmf =myMainZosmf");
            expect(response.stdout.toString()).toContain("Available profile names:");
            expect(response.stdout.toString()).toContain("mySecondaryZosmf");
            expect(response.stdout.toString()).toContain("Installed plugins:");
            expect(response.stdout.toString()).toContain("Package = @zowe/cics-for-zowe-cli");
            expect(response.stdout.toString()).toContain("Package = @broadcom/endevor-for-zowe-cli@zowe-v2-lts");
            expect(response.stdout.toString()).toContain("Package = @zowe/ims-for-zowe-cli");
            expect(response.stdout.toString()).toContain("Package = @zowe/zos-ftp-for-zowe-cli");
            expect(response.stdout.toString()).toContain("This information contains site-specific data. Redact anything required");
            expect(response.stdout.toString()).not.toContain("Failed to set up environment variables from the environment file.");
            expect(response.stderr.toString()).not.toContain("Failed to set up environment variables from the environment file.");
        });

        it("should set up environment with file and successfully produce a report - cli directory", async () => {
            const pluginsDir = path.join(TEST_ENVIRONMENT.workingDir, "plugins");
            if (!fs.existsSync(pluginsDir)) {
                fs.mkdirSync(pluginsDir);
            }
            fs.copyFileSync(path.join(__dirname, "/__resources__/plugins.json"),
                path.join(pluginsDir, "/plugins.json")
            );

            fs.copyFileSync(path.join(__dirname, "/__resources__/test.config.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json")
            );
            fs.copyFileSync(path.join(__dirname, "/__resources__/test.schema.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "test.schema.good.json")
            );

            fs.writeFileSync(envFileCli, '{"ZOWE_OPT_TEST": "TEST_VARIABLE"}');

            const response = runCliScript(path.join(__dirname, "/__scripts__/report-env.sh"),
                TEST_ENVIRONMENT.workingDir
            );

            expect(response.error).toBeFalsy();
            expect(response.stdout.toString()).toContain("Zowe CLI version =");
            expect(response.stdout.toString()).toContain("Node.js version =");
            expect(response.stdout.toString()).toContain("Node Version Manager version =");
            expect(response.stdout.toString()).toContain("O.S. platform =");
            expect(response.stdout.toString()).toContain("O.S. architecture =");
            expect(response.stdout.toString()).toContain("O.S. PATH =");
            expect(response.stdout.toString()).toContain("ZOWE_CLI_HOME =");
            expect(response.stdout.toString()).toContain("ZOWE_APP_LOG_LEVEL =");
            expect(response.stdout.toString()).toContain("ZOWE_IMPERATIVE_LOG_LEVEL =");
            expect(response.stdout.toString()).toContain("ZOWE_OPT_TEST = TEST_VARIABLE");
            expect(response.stdout.toString()).toContain("NPM version =");
            expect(response.stdout.toString()).toContain("Shell =");
            expect(response.stdout.toString()).toContain("Global prefix =");
            expect(response.stdout.toString()).toContain("registry =");
            expect(response.stdout.toString()).toContain("node bin location =");
            expect(response.stdout.toString()).toContain("HOME =");
            expect(response.stdout.toString()).toContain("Zowe CLI configuration information");
            expect(response.stdout.toString()).toContain("Zowe daemon mode =");
            expect(response.stdout.toString()).toContain("Zowe config type = V2 Team Config");
            expect(response.stdout.toString()).toContain("Team config files in effect:");
            expect(response.stdout.toString()).toContain("imperative-test-cli.config.json");
            expect(response.stdout.toString()).toContain("Default profile names:");
            expect(response.stdout.toString()).toContain("base = myBase");
            expect(response.stdout.toString()).toContain("tso =  myTso");
            expect(response.stdout.toString()).toContain("zosmf =myMainZosmf");
            expect(response.stdout.toString()).toContain("Available profile names:");
            expect(response.stdout.toString()).toContain("mySecondaryZosmf");
            expect(response.stdout.toString()).toContain("Installed plugins:");
            expect(response.stdout.toString()).toContain("Package = @zowe/cics-for-zowe-cli");
            expect(response.stdout.toString()).toContain("Package = @broadcom/endevor-for-zowe-cli@zowe-v2-lts");
            expect(response.stdout.toString()).toContain("Package = @zowe/ims-for-zowe-cli");
            expect(response.stdout.toString()).toContain("Package = @zowe/zos-ftp-for-zowe-cli");
            expect(response.stdout.toString()).toContain("This information contains site-specific data. Redact anything required");
            expect(response.stdout.toString()).not.toContain("Failed to set up environment variables from the environment file.");
            expect(response.stderr.toString()).not.toContain("Failed to set up environment variables from the environment file.");
        });

        it("should set up environment with file and successfully produce a report - both directories", async () => {
            const pluginsDir = path.join(TEST_ENVIRONMENT.workingDir, "plugins");
            if (!fs.existsSync(pluginsDir)) {
                fs.mkdirSync(pluginsDir);
            }
            fs.copyFileSync(path.join(__dirname, "/__resources__/plugins.json"),
                path.join(pluginsDir, "/plugins.json")
            );

            fs.copyFileSync(path.join(__dirname, "/__resources__/test.config.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json")
            );
            fs.copyFileSync(path.join(__dirname, "/__resources__/test.schema.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "test.schema.good.json")
            );

            fs.writeFileSync(envFileHome, '{"ZOWE_OPT_TEST": "TEST_VARIABLE_ONE"}');
            fs.writeFileSync(envFileCli, '{"ZOWE_OPT_TEST": "TEST_VARIABLE_TWO"}');

            const response = runCliScript(path.join(__dirname, "/__scripts__/report-env.sh"),
                TEST_ENVIRONMENT.workingDir
            );

            expect(response.error).toBeFalsy();
            expect(response.stdout.toString()).toContain("Zowe CLI version =");
            expect(response.stdout.toString()).toContain("Node.js version =");
            expect(response.stdout.toString()).toContain("Node Version Manager version =");
            expect(response.stdout.toString()).toContain("O.S. platform =");
            expect(response.stdout.toString()).toContain("O.S. architecture =");
            expect(response.stdout.toString()).toContain("O.S. PATH =");
            expect(response.stdout.toString()).toContain("ZOWE_CLI_HOME =");
            expect(response.stdout.toString()).toContain("ZOWE_APP_LOG_LEVEL =");
            expect(response.stdout.toString()).toContain("ZOWE_IMPERATIVE_LOG_LEVEL =");
            expect(response.stdout.toString()).toContain("ZOWE_OPT_TEST = TEST_VARIABLE_TWO");
            expect(response.stdout.toString()).toContain("NPM version =");
            expect(response.stdout.toString()).toContain("Shell =");
            expect(response.stdout.toString()).toContain("Global prefix =");
            expect(response.stdout.toString()).toContain("registry =");
            expect(response.stdout.toString()).toContain("node bin location =");
            expect(response.stdout.toString()).toContain("HOME =");
            expect(response.stdout.toString()).toContain("Zowe CLI configuration information");
            expect(response.stdout.toString()).toContain("Zowe daemon mode =");
            expect(response.stdout.toString()).toContain("Zowe config type = V2 Team Config");
            expect(response.stdout.toString()).toContain("Team config files in effect:");
            expect(response.stdout.toString()).toContain("imperative-test-cli.config.json");
            expect(response.stdout.toString()).toContain("Default profile names:");
            expect(response.stdout.toString()).toContain("base = myBase");
            expect(response.stdout.toString()).toContain("tso =  myTso");
            expect(response.stdout.toString()).toContain("zosmf =myMainZosmf");
            expect(response.stdout.toString()).toContain("Available profile names:");
            expect(response.stdout.toString()).toContain("mySecondaryZosmf");
            expect(response.stdout.toString()).toContain("Installed plugins:");
            expect(response.stdout.toString()).toContain("Package = @zowe/cics-for-zowe-cli");
            expect(response.stdout.toString()).toContain("Package = @broadcom/endevor-for-zowe-cli@zowe-v2-lts");
            expect(response.stdout.toString()).toContain("Package = @zowe/ims-for-zowe-cli");
            expect(response.stdout.toString()).toContain("Package = @zowe/zos-ftp-for-zowe-cli");
            expect(response.stdout.toString()).toContain("This information contains site-specific data. Redact anything required");
            expect(response.stdout.toString()).not.toContain("Failed to set up environment variables from the environment file.");
            expect(response.stderr.toString()).not.toContain("Failed to set up environment variables from the environment file.");
        });

        it("should set up bad environment with file and successfully produce a report", async () => {
            const pluginsDir = path.join(TEST_ENVIRONMENT.workingDir, "plugins");
            if (!fs.existsSync(pluginsDir)) {
                fs.mkdirSync(pluginsDir);
            }
            fs.copyFileSync(path.join(__dirname, "/__resources__/plugins.json"),
                path.join(pluginsDir, "/plugins.json")
            );

            fs.copyFileSync(path.join(__dirname, "/__resources__/test.config.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json")
            );
            fs.copyFileSync(path.join(__dirname, "/__resources__/test.schema.good.json"),
                path.join(TEST_ENVIRONMENT.workingDir, "test.schema.good.json")
            );

            fs.writeFileSync(envFileHome, '{"ZOWE_OPT_TEST": "TEST_VARIABLE" "ZOWE_OPT_TEST2": "TEST_VARIABLE"}');

            const response = runCliScript(path.join(__dirname, "/__scripts__/report-env.sh"),
                TEST_ENVIRONMENT.workingDir
            );

            expect(response.error).toBeFalsy();
            expect(response.stdout.toString()).toContain("Zowe CLI version =");
            expect(response.stdout.toString()).toContain("Node.js version =");
            expect(response.stdout.toString()).toContain("Node Version Manager version =");
            expect(response.stdout.toString()).toContain("O.S. platform =");
            expect(response.stdout.toString()).toContain("O.S. architecture =");
            expect(response.stdout.toString()).toContain("O.S. PATH =");
            expect(response.stdout.toString()).toContain("ZOWE_CLI_HOME =");
            expect(response.stdout.toString()).toContain("ZOWE_APP_LOG_LEVEL =");
            expect(response.stdout.toString()).toContain("ZOWE_IMPERATIVE_LOG_LEVEL =");
            expect(response.stdout.toString()).not.toContain("ZOWE_OPT_TEST =");
            expect(response.stdout.toString()).not.toContain("ZOWE_OPT_TEST2 =");
            expect(response.stdout.toString()).toContain("NPM version =");
            expect(response.stdout.toString()).toContain("Shell =");
            expect(response.stdout.toString()).toContain("Global prefix =");
            expect(response.stdout.toString()).toContain("registry =");
            expect(response.stdout.toString()).toContain("node bin location =");
            expect(response.stdout.toString()).toContain("HOME =");
            expect(response.stdout.toString()).toContain("Zowe CLI configuration information");
            expect(response.stdout.toString()).toContain("Zowe daemon mode =");
            expect(response.stdout.toString()).toContain("Zowe config type = V2 Team Config");
            expect(response.stdout.toString()).toContain("Team config files in effect:");
            expect(response.stdout.toString()).toContain("imperative-test-cli.config.json");
            expect(response.stdout.toString()).toContain("Default profile names:");
            expect(response.stdout.toString()).toContain("base = myBase");
            expect(response.stdout.toString()).toContain("tso =  myTso");
            expect(response.stdout.toString()).toContain("zosmf =myMainZosmf");
            expect(response.stdout.toString()).toContain("Available profile names:");
            expect(response.stdout.toString()).toContain("mySecondaryZosmf");
            expect(response.stdout.toString()).toContain("Installed plugins:");
            expect(response.stdout.toString()).toContain("Package = @zowe/cics-for-zowe-cli");
            expect(response.stdout.toString()).toContain("Package = @broadcom/endevor-for-zowe-cli@zowe-v2-lts");
            expect(response.stdout.toString()).toContain("Package = @zowe/ims-for-zowe-cli");
            expect(response.stdout.toString()).toContain("Package = @zowe/zos-ftp-for-zowe-cli");
            expect(response.stdout.toString()).toContain("This information contains site-specific data. Redact anything required");
            expect(response.stdout.toString()).not.toContain("Failed to set up environment variables from the environment file.");
            expect(response.stderr.toString()).toContain("Failed to set up environment variables from the environment file.");
        });
    });
});
