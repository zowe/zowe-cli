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

import { Imperative, Session, IO } from "@brightside/imperative";
import * as path from "path";
import { runCliScript , stripNewLines } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ZosFilesConstants } from "../../../../../index";
import { ZosmfRestClient } from "../../../../../rest";


// Test environment will be populated in the "beforeAll"
let TEST_ENVIRONMENT: ITestEnvironment;
let REAL_SESSION: Session;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let ussname: string;

let host: string;
let port: number;
let user: string;
let password: string;
let privateKey: string;
let keyPassphrase: string;

function checkResponse(response: any) {
    expect(response.stderr.toString()).toBe("");
    expect(response.status).toBe(0);
}

function generateRandomString(j: number) {
    let text = "";

    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < j ; i++) {
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

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should return operating system name", async () => {
        const commandName = "uname";
        // Imperative.console.info("Return OS command:" + commandName);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);

        checkResponse(response);
        expect(response.stdout.toString()).toMatch("OS/390");
    });

    it("should resolve --cwd option", async () => {
        const commandName = "pwd";
        const cwd =  `${defaultSystem.unix.testdir}/`;
        // Imperative.console.info("Resolve --cwd Command:" + commandName +"--cwd /" +cwd);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response);
        // match only "/"+cwd with no following alpha-numeric character e.g. "/cwd   "
        expect(response.stdout.toString()).toMatch(new RegExp("\\" + cwd + "\\s"));
    });

    it("should get directory invalid --cwd option", async () => {
        const commandName = "pwd";
        const cwd = "/invaliddir";
        // Imperative.console.info("Invalid directory Command:" + commandName +"--cwd /" +cwd);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response);
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

            systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
            defaultSystem = systemProps.getDefaultSystem();
            const directory = `${defaultSystem.unix.testdir}/`;
            // create a directory that the random dir will be created in
            const commandName = "mkdir " + directory + "usstest";
            // Imperative.console.info("Make test directory cmd:" + commandName);
            const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);
            checkResponse(response);
            expect(response.stdout.toString()).toContain(directory + "usstest");
        });
        afterAll(async () => {
            // delete the test directory
            const directory = `${defaultSystem.unix.testdir}/`;
            const commandName = "rm -rf " + directory + "usstest";
            // Imperative.console.info("Remove test directory cmd:" + commandName);
            const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);
            // Imperative.console.info("Remove Response:" + response.stdout.toString());
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT);

        });

        it("should write a long directory", async () => {
            const j = 200;
            const randomDir = generateRandomString(j);
            const directory = `${defaultSystem.unix.testdir}/`;
            const testdir = directory + "test/";
            const commandName = "mkdir " + testdir + "usstest/" + randomDir;
            // Imperative.console.info("Long Dir Command:" + commandName);
            const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);

            checkResponse(response);
            expect(response.stdout.toString()).toContain(randomDir);
        });
    });

describe("zowe uss issue ssh running bash scripts", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "issue_ssh",
            tempProfileTypes: ["ssh","zosmf"]
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        // upload required test files
        const shellScript = path.join(__dirname, "__scripts__", "command_upload_ftu.sh");
        let localFileName: string;
        let response: any;

        ussname = `${defaultSystem.unix.testdir}/exit64.sh`;
        // Imperative.console.info("Using ussfile:" + ussname);
        localFileName = path.join(__dirname, "__data__", "exit64.txt");
        response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
        // Imperative.console.info("Response:" + response.stdout.toString());
        expect(response.stdout.toString()).toContain("USS file uploaded successfully");
        // Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);

        ussname = `${defaultSystem.unix.testdir}/askForName.sh`;
        // Imperative.console.info("Using ussfile:" + ussname);
        localFileName = path.join(__dirname, "__data__", "askForName.txt");
        response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
        // Imperative.console.info("Response:" + response.stdout.toString());
        expect(response.stdout.toString()).toContain("USS file uploaded successfully");
        // Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);

        ussname = `${defaultSystem.unix.testdir}/tester.txt`;
        // Imperative.console.info("Using ussfile:" + ussname);
        localFileName = path.join(__dirname, "__data__", "tester.txt");
        response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
        // Imperative.console.info("Response:" + response.stdout.toString());
        expect(response.stdout.toString()).toContain("USS file uploaded successfully");
        // Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);

        ussname = `${defaultSystem.unix.testdir}/killItself.sh`;
        // Imperative.console.info("Using ussfile:" + ussname);
        localFileName = path.join(__dirname, "__data__", "killItself.txt");
        response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
        // Imperative.console.info("Response:" + response.stdout.toString());
        expect(response.stdout.toString()).toContain("USS file uploaded successfully");
        // Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);


    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        let response: any;
        // delete uploaded test bash scripts
        ussname = `${defaultSystem.unix.testdir}/exit64.sh`;
        const exit64: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

        try {
            response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, exit64);
            // Imperative.console.info("Deleted :" + ussname);
        } catch (err) {
            Imperative.console.error(err);
        }

        ussname = `${defaultSystem.unix.testdir}/askForName.sh`;
        const askForName: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

        try {
            response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, askForName);
            // Imperative.console.info("Deleted :" + ussname);
        } catch (err) {
            Imperative.console.error(err);
        }

        ussname = `${defaultSystem.unix.testdir}/tester.txt`;
        const tester: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

        try {
            response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, tester);
            // Imperative.console.info("Deleted :" + ussname);
        } catch (err) {
            Imperative.console.error(err);
        }

        ussname = `${defaultSystem.unix.testdir}/killItself.sh`;
        const killItself: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

        try {
            response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, killItself);
            // Imperative.console.info("Deleted :" + ussname);
        } catch (err) {
            Imperative.console.error(err);
        }


    });

    it("script issues exit64", async () => {
        const directory = `${defaultSystem.unix.testdir}`;
        const commandName = "cd " + directory + " && chmod 777 exit64.sh && exit64.sh";
        // Imperative.console.info("Exit command:" + commandName);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);

        checkResponse(response);
        expect(response.stdout.toString()).not.toContain("About to exit64");
    });

    it("script asks for input", async () => {
        const directory = `${defaultSystem.unix.testdir}`;
        const commandName = " cd " + directory + " && chmod 777 askForName.sh && askForName.sh < tester.txt";
        // Imperative.console.info("Script for input command:" + commandName);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);

        checkResponse(response);
        expect(response.stdout.toString()).toContain("Welcome Tester!");
    });

    it("script kills itself", async () => {
        const directory = `${defaultSystem.unix.testdir}`;
        const commandName = " cd " + directory + " && chmod 777 killItself.sh && killItself.sh";
        // Imperative.console.info("Script for kill command:" + commandName);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);

        checkResponse(response);
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

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        host = systemProps.getDefaultSystem().ssh.host;
        port = systemProps.getDefaultSystem().ssh.port;
        user = systemProps.getDefaultSystem().ssh.user;
        password = systemProps.getDefaultSystem().ssh.password;
        privateKey = systemProps.getDefaultSystem().ssh.privateKey;
        keyPassphrase = systemProps.getDefaultSystem().ssh.keyPassphrase;
        defaultSystem = systemProps.getDefaultSystem();
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("uses only user and password", async () => {

        // create a temporary zowe profile with an invalid port
        let scriptPath = TEST_ENVIRONMENT.workingDir + "_create_profile_withoutprivateKey";
        let command = "zowe profiles create ssh-profile " + host + "onlypassword --host " + host  + " --port " + port
                        + " --user " + user + " --password " + password;
        Imperative.console.info("create zoweProfile:_withouthprivateKey" + command);
        await IO.writeFileAsync(scriptPath, command);
        let resp = runCliScript(scriptPath, TEST_ENVIRONMENT);
        Imperative.console.info("Response from create profile withoutprivatekey:" + resp.stdout.toString());
        expect(resp.status).toBe(0);
        // default to the temporary profile
        command = "zowe profiles set  ssh " + host + "onlypassword";
        scriptPath = TEST_ENVIRONMENT.workingDir + "_set_profile_withoutprivateKey";
        Imperative.console.info("Set zoweProfile_withoutprivatekey:" + command);
        await IO.writeFileAsync(scriptPath, command);
        resp = runCliScript(scriptPath, TEST_ENVIRONMENT);
        Imperative.console.info("Response from set profile withoutprivatekey:" + resp.stdout.toString());
        expect(resp.status).toBe(0);
        // now check the command can run
        command = "uname";
        Imperative.console.info("Return OS command:" + command);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [command]);
        checkResponse(response);
        Imperative.console.info("Response from command withoutprivatekey:" + response.stdout.toString());
        expect(response.stdout.toString()).toMatch("OS/390");


    });

    it("use invalid passphrase", async () => {
        // create a temporary zowe profile with an invalid passphrase
        const bogusKeyPassword = "bogusKeyPassword";
        let scriptPath = TEST_ENVIRONMENT.workingDir + "_create_profile_invalid_passphrase";
        let command = "zowe profiles create ssh-profile " + host + "invalidpassphrase --host " + host  + " --port " + port
                        + " --user " + user + " --password " + password + " --privateKey " +  privateKey
                        + " --keyPassphrase " + bogusKeyPassword;

        Imperative.console.info("create zoweProfile:_with_invalid_passphrase" + command);
        await IO.writeFileAsync(scriptPath, command);
        let resp = runCliScript(scriptPath, TEST_ENVIRONMENT);
        Imperative.console.info("Response from create profile with_invalid_passphrase:" + resp.stdout.toString());
        expect(resp.status).toBe(0);
        // default to the temporary profile
        command = "zowe profiles set  ssh " + host + "invalidpassphrase";
        scriptPath = TEST_ENVIRONMENT.workingDir + "_set_profile_with_invalid_passphrase";
        Imperative.console.info("Set zoweProfile_with_invalid_passphrase:" + command);
        await IO.writeFileAsync(scriptPath, command);
        resp = runCliScript(scriptPath, TEST_ENVIRONMENT);
        Imperative.console.info("Response from set profile with_invalid_passphrase:" + resp.stdout.toString());
        expect(resp.status).toBe(0);
        // now check the command can run
        command = "uname";
        Imperative.console.info("Return OS command:" + command);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [command]);
        Imperative.console.info("Response from command with_invalid_passphrase:" + response.stdout.toString());
        expect(response.stderr.toString()).toContain("Bad passphrase");
    });

    it("use invalid privateKey", async () => {
        // create a temporary zowe profile with an invalid passkey
        const bogusPrivateKey = "bogusKey";
        let scriptPath = TEST_ENVIRONMENT.workingDir + "_create_profile_invalid_privatekey";
        let command = "zowe profiles create ssh-profile " + host + "invalidprivatekey --host " + host  + " --port " + port
                        + " --user " + user + " --password " + password + " --privateKey " +  bogusPrivateKey
                        + " --keyPassphrase " + keyPassphrase;

        Imperative.console.info("create zoweProfile:_with_invalid_privateKey" + command);
        await IO.writeFileAsync(scriptPath, command);
        let resp = runCliScript(scriptPath, TEST_ENVIRONMENT);
        Imperative.console.info("Response from create profile with_invalid_privateKey:" + resp.stdout.toString());
        expect(resp.status).toBe(0);
        // default to the temporary profile
        command = "zowe profiles set  ssh " + host + "invalidprivatekey";
        scriptPath = TEST_ENVIRONMENT.workingDir + "_set_profile_with_invalid_privateKey";
        Imperative.console.info("Set zoweProfile_with_invalid_privateKey:" + command);
        await IO.writeFileAsync(scriptPath, command);
        resp = runCliScript(scriptPath, TEST_ENVIRONMENT);
        Imperative.console.info("Response from set profile with_invalid_privateKey:" + resp.stdout.toString());
        expect(resp.status).toBe(0);
        // now check the command can run
        command = "uname";
        Imperative.console.info("Return OS command:" + command);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [command]);
        Imperative.console.info("Response from command with_invalid_privateKey:" + response.stderr.toString());
        expect(response.stderr.toString()).toMatch("no such file or directory, open 'bogusKey'");
    });
});
