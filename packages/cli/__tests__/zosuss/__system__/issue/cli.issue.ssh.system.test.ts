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
import { runCliScript, TempTestProfiles } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Shell } from "@zowe/zos-uss-for-zowe-sdk";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/ITestEnvironment";


// Test environment will be populated in the "beforeAll"
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let ussname: string;

let host: string;
let port: number;
let user: string;
let password: string;
let keyPassphrase: string;

function checkResponse(response: any, expectStatus: number) {
    expect(response.stderr.toString()).toBe("");
    expect(response.status).toBe(expectStatus);
    expect(response.stdout.toString()).not.toMatch(Shell.startCmdFlag);
}

function generateRandomString(j: number) {
    let text = "";

    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < j; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

describe("zowe uss issue ssh without running bash scripts", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "issue_ssh",
            tempProfileTypes: ["ssh"]
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should return operating system name", () => {
        const commandName = "uname";
        // Imperative.console.info("Return OS command:" + commandName);
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);

        checkResponse(response, 0);
        expect(response.stdout.toString()).toMatch("OS/390");
    });

    it("should resolve --cwd option", () => {
        const commandName = "pwd";
        const cwd = `${defaultSystem.unix.testdir}`;
        // Imperative.console.info("Resolve --cwd Command:" + commandName +"--cwd /" +cwd);
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response, 0);
        // match only "/"+cwd with no following alpha-numeric character e.g. "/cwd   "
        expect(response.stdout.toString()).toMatch(new RegExp(cwd.substring(1) + "\\s"));
    });

    it("should get directory invalid --cwd option", () => {
        const commandName = "pwd";
        const cwd = "/invaliddir";
        // Imperative.console.info("Invalid directory Command:" + commandName +"--cwd /" +cwd);
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response, 1);
        expect(response.stdout.toString()).toContain("EDC5129I No such file or directory");
    });
});


describe("Use a test directory to do stuff in that creates files", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "issue_ssh",
            tempProfileTypes: ["ssh"]
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        const directory = `${defaultSystem.unix.testdir}/`;
        // create a directory that the random dir will be created in
        const commandName = `mkdir ${directory}/usstest && cd ${directory}/usstest && pwd`;
        // Imperative.console.info("Make test directory cmd:" + commandName);
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);
        checkResponse(response, 0);
        expect(response.stdout.toString()).toContain(directory.substring(1) + "usstest");
    });
    afterAll(async () => {
        // delete the test directory
        const directory = `${defaultSystem.unix.testdir}/`;
        const commandName = "rm -rf " + directory + "usstest";
        // Imperative.console.info("Remove test directory cmd:" + commandName);
        runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);
        // Imperative.console.info("Remove Response:" + response.stdout.toString());
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);

    });

    // eslint-disable-next-line jest/expect-expect
    it("should write a long directory", () => {
        const j = 200;
        const randomDir = generateRandomString(j);
        const directory = `${defaultSystem.unix.testdir}/`;
        const commandName = "mkdir -p " + directory + "usstest/" + randomDir + "; ls " + directory + "usstest/" + randomDir;
        // Imperative.console.info("Long Dir Command:" + commandName);
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);
        checkResponse(response, 0);
    });
});

describe("zowe uss issue ssh running bash scripts", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "issue_ssh",
            tempProfileTypes: ["ssh", "zosmf"]
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        // upload required test files
        const shellScript = path.join(__dirname, "__scripts__", "command_upload_ftu.sh");
        let localFileName: string;
        let response: any;

        ussname = `${defaultSystem.unix.testdir}/exit64.sh`;
        // Imperative.console.info("Using ussfile:" + ussname);
        localFileName = path.join(__dirname, "__data__", "exit64.txt");
        response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname]);
        // Imperative.console.info("Response:" + response.stdout.toString());
        expect(response.stdout.toString()).toContain("USS file uploaded successfully");
        // Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);
        TEST_ENVIRONMENT.resources.files.push(ussname);

        ussname = `${defaultSystem.unix.testdir}/killItself.sh`;
        // Imperative.console.info("Using ussfile:" + ussname);
        localFileName = path.join(__dirname, "__data__", "killItself.txt");
        response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname]);
        // Imperative.console.info("Response:" + response.stdout.toString());
        expect(response.stdout.toString()).toContain("USS file uploaded successfully");
        // Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);
        TEST_ENVIRONMENT.resources.files.push(ussname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("script issues exit64", () => {
        const directory = `${defaultSystem.unix.testdir}`;
        const commandName = "cd " + directory + " && chmod 777 exit64.sh && exit64.sh";
        // Imperative.console.info("Exit command:" + commandName);
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);
        const SIX_FOUR= 64;

        checkResponse(response, SIX_FOUR);
        expect(response.stdout.toString()).toContain("About to exit64");
        expect(response.stdout.toString()).not.toContain("It should not echo this");
    });

    it("script kills itself", () => {
        const directory = `${defaultSystem.unix.testdir}`;
        const commandName = " cd " + directory + " && chmod 777 killItself.sh && killItself.sh";
        // Imperative.console.info("Script for kill command:" + commandName);
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);
        const ONE_FOUR_THREE = 143;

        checkResponse(response, ONE_FOUR_THREE);
        expect(response.stdout.toString()).not.toContain("Ended");
    });

});
describe("zowe uss issue ssh passwords and passkeys", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "issue_ssh",
            tempProfileTypes: ["ssh"]
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        host = defaultSystem.ssh.host;
        port = defaultSystem.ssh.port;
        user = defaultSystem.ssh.user;
        password = defaultSystem.ssh.password;
        keyPassphrase = defaultSystem.ssh.keyPassphrase;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("uses only user and password", async () => {
        // create a temporary zowe profile with an invalid port
        const onlyPassword = await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT, "ssh",
            { host, port, user, password });
        // now check the command can run
        const command = "uname";
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT,
            [command, "--ssh-p", onlyPassword]);
        checkResponse(response, 0);
        expect(response.stdout.toString()).toMatch("OS/390");
    });

    it("use invalid privateKey", async () => {
        // create a temporary zowe profile with an invalid passkey
        const bogusPrivateKey = "bogusKey";
        const invalidPrivateKey = await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT, "ssh",
            { host, port, user, password, privateKey: bogusPrivateKey, keyPassphrase });
        // now check the command can run
        const command = "uname";
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT,
            [command, "--ssh-p", invalidPrivateKey]);
        expect(response.stderr.toString()).toMatch("no such file or directory, open 'bogusKey'");
    });

    it("should fail command execution without trace when improper user credentials", async () => {
        // create a temporary zowe profile with an invalid user
        const user = "bogusUser";
        const invalidCreds = await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT, "ssh",
            { host, port, user, password });

        const command = "echo test";
        const response = runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT,
            [command, "--ssh-p", invalidCreds]);
        expect(response.stderr.toString()).toMatch("All configured authentication methods failed");
    });
});
