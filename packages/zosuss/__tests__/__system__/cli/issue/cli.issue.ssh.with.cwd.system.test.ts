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
import { Imperative, IO, Session } from "@brightside/imperative";
import * as path from "path";
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Get, ZosFilesConstants } from "../../../../../index";
import { ZosmfRestClient } from "../../../../../rest";

// Test environment will be populated in the "beforeAll"
let TEST_ENVIRONMENT: ITestEnvironment;
let REAL_SESSION: Session;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let ussname: string;

// tslint:disable-next-line:no-unused-expression
function checkResponse(response: any) {
    expect(response.stderr.toString()).toBe("");
    expect(response.status).toBe(0);
}

function generateRandomString(j) {
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
        const cwd =  `${defaultSystem.unix.testdir}/`;
        Imperative.console.info("Return OS command:" + commandName +"--cwd /" +cwd);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response);
        expect(response.stdout.toString()).toMatch("OS/390");
    });

    it("should resolve --cwd option", async () => {
        const commandName = "pwd";
        const cwd =  `${defaultSystem.unix.testdir}/`;
        Imperative.console.info("Resolve --cwd Command:" + commandName +"--cwd /" +cwd);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response);
        // match only "/" with no following alpha-numeric character
        expect(response.stdout.toString()).toMatch(new RegExp("\\" + cwd + "\\s"));
    });


    it("should get directory invalid --cwd option", async () => {
        const zosmfProperties = TEST_ENVIRONMENT.systemTestProperties.systems.common.zosmf;

        const commandName = "pwd";
        const cwd = "/invaliddir";
        Imperative.console.info("Invalid directory Command:" + commandName +"--cwd /" +cwd);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response);
        // match only "/" with no following alpha-numeric character
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
        const commandName = "mkdir " + directory + "usscwdtest";
        Imperative.console.info("Make test directory cmd:" + commandName);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);
        checkResponse(response);
        // match only "/" with no following alpha-numeric character
        expect(response.stdout.toString()).toContain(directory + "usscwdtest");

    });
    afterAll(async () => {
        // delete the test directory
        const directory = `${defaultSystem.unix.testdir}/`;
        const commandName = "rm -rf " + directory + "usscwdtest";
        Imperative.console.info("Remove test directory cmd:" + commandName);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_no_cwd.sh", TEST_ENVIRONMENT, [commandName]);
        Imperative.console.info("Remove Response:" + response.stdout.toString());
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);

    });

    it.skip("should write a long directory", async () => {
        const zosmfProperties = TEST_ENVIRONMENT.systemTestProperties.systems.common.zosmf;
        const j = 200;
        const randomDir = generateRandomString(j);
        const directory = `${defaultSystem.unix.testdir}/`;
        const testdir = directory + "usscwdtest/";
        const commandName = "mkdir " + testdir + randomDir;
        const cwd =  `${defaultSystem.unix.testdir}/`;
        Imperative.console.info("Long Dir Command:" + commandName +"--cwd /" +cwd);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response);
        // match only "/" with no following alpha-numeric character
        expect(response.stdout.toString()).toContain(randomDir);
    });

    it("should run install npm express", async () => {
        const zosmfProperties = TEST_ENVIRONMENT.systemTestProperties.systems.common.zosmf;
        const directory = `${defaultSystem.unix.testdir}/`;
        const testdir = directory + "usscwdtest/";
// tslint:disable-next-line: max-line-length
        const commandName = "cd " + testdir + " &&npm install --registry http://cicsk8sm.hursley.ibm.com:30799 express";
        const cwd =  `${defaultSystem.unix.testdir}/`;
        Imperative.console.info("Run npm Command:" + commandName +"--cwd /" +cwd);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response);
        // match only "/" with no following alpha-numeric character
        expect(response.stdout.toString()).toContain("express@4.16.4");
    });

    it("should run npm on nonexistant module", async () => {
        const zosmfProperties = TEST_ENVIRONMENT.systemTestProperties.systems.common.zosmf;
        const directory = `${defaultSystem.unix.testdir}/`;
// tslint:disable-next-line: max-line-length
        const testdir = directory + "usscwdtest/";
// tslint:disable-next-line: max-line-length
        const commandName = "cd " + testdir + " &&npm install --registry http://cicsk8sm.hursley.ibm.com:30799 NoddyNonExist";
        const cwd =  `${defaultSystem.unix.testdir}/`;
        Imperative.console.info("Run npm nonexistant Command:" + commandName +"--cwd /" +cwd);
        const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName, "/" + cwd]);

        checkResponse(response);
        // match only "/" with no following alpha-numeric character
        expect(response.stdout.toString()).toContain("no such package available : NoddyNonExist");
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
            let localFileName = path.join(__dirname, "__data__", "sleepFor5mins.txt");
            ussname = `${defaultSystem.unix.testdir}/sleepFor5mins.sh`;
            Imperative.console.info("Using ussfile:" + ussname);
            Imperative.console.info("Using localfile:" + localFileName);
            let response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
            Imperative.console.info("Response:" + response.stdout.toString());
            expect(response.stdout.toString()).toContain("USS file uploaded successfully");
            Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);

            ussname = `${defaultSystem.unix.testdir}/exit64.sh`;
            Imperative.console.info("Using ussfile:" + ussname);
            localFileName = path.join(__dirname, "__data__", "exit64.txt");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
            Imperative.console.info("Response:" + response.stdout.toString());
            expect(response.stdout.toString()).toContain("USS file uploaded successfully");
            Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);

            ussname = `${defaultSystem.unix.testdir}/askForName.sh`;
            Imperative.console.info("Using ussfile:" + ussname);
            localFileName = path.join(__dirname, "__data__", "askForName.txt");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
            Imperative.console.info("Response:" + response.stdout.toString());
            expect(response.stdout.toString()).toContain("USS file uploaded successfully");
            Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);

            ussname = `${defaultSystem.unix.testdir}/tester.txt`;
            Imperative.console.info("Using ussfile:" + ussname);
            localFileName = path.join(__dirname, "__data__", "tester.txt");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
            Imperative.console.info("Response:" + response.stdout.toString());
            expect(response.stdout.toString()).toContain("USS file uploaded successfully");
            Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);

            ussname = `${defaultSystem.unix.testdir}/killItself.sh`;
            Imperative.console.info("Using ussfile:" + ussname);
            localFileName = path.join(__dirname, "__data__", "killItself.txt");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [localFileName, ussname.substring(1)]);
            Imperative.console.info("Response:" + response.stdout.toString());
            expect(response.stdout.toString()).toContain("USS file uploaded successfully");
            Imperative.console.info("Uploaded :" + localFileName + "to" + ussname);


        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
            let response;
            let error;
            // delete uploaded test bash scripts
            ussname = `${defaultSystem.unix.testdir}/sleepFor5mins.sh`;
            const sleep10: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, sleep10);
                Imperative.console.info("Deleted :" + ussname);
            } catch (err) {
                error = err;
            }
            ussname = `${defaultSystem.unix.testdir}/exit64.sh`;
            const exit64: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, exit64);
                Imperative.console.info("Deleted :" + ussname);
            } catch (err) {
                error = err;
            }

            ussname = `${defaultSystem.unix.testdir}/askForName.sh`;
            const askForName: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, askForName);
                Imperative.console.info("Deleted :" + ussname);
            } catch (err) {
                error = err;
            }

            ussname = `${defaultSystem.unix.testdir}/tester.txt`;
            const tester: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, tester);
                Imperative.console.info("Deleted :" + ussname);
            } catch (err) {
                error = err;
            }

            ussname = `${defaultSystem.unix.testdir}/killItself.sh`;
            const killItself: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, killItself);
                Imperative.console.info("Deleted :" + ussname);
            } catch (err) {
                error = err;
            }


        });

        it.skip("script issues exit64", async () => {
            const zosmfProperties = TEST_ENVIRONMENT.systemTestProperties.systems.common.zosmf;
            const directory = `${defaultSystem.unix.testdir}`;
            const commandName = "cd " + directory + " && chmod 777 exit64.sh && exit64.sh";
            const cwd =  `${defaultSystem.unix.testdir}/`;
            Imperative.console.info("Exit command:" + commandName +"--cwd /" +cwd);
            const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName,"/" + cwd]);

            checkResponse(response);
            // match only "/" with no following alpha-numeric character
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).not.toContain("About to exit64");
        });

        it("script sleeps for 5 mins", async () => {
            const zosmfProperties = TEST_ENVIRONMENT.systemTestProperties.systems.common.zosmf;
            const directory = `${defaultSystem.unix.testdir}`;
            const commandName = "cd " + directory + " && chmod 777 sleepFor5mins.sh && sleepFor5mins.sh";
            const cwd =  `${defaultSystem.unix.testdir}/`;
            Imperative.console.info("Sleep command:" + commandName +"--cwd /" +cwd);
            const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName,"/" + cwd]);

            checkResponse(response);
            // match only "/" with no following alpha-numeric character
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("FINISHED");
        });


        it("script asks for input", async () => {
            const zosmfProperties = TEST_ENVIRONMENT.systemTestProperties.systems.common.zosmf;
            const directory = `${defaultSystem.unix.testdir}`;
            const commandName = " cd " + directory + " && chmod 777 askForName.sh && askForName.sh < tester.txt";
            const cwd =  `${defaultSystem.unix.testdir}/`;
            Imperative.console.info("Script for input command:" + commandName +"--cwd /" +cwd);
            const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName,"/" + cwd]);

            checkResponse(response);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Welcome Tester!");
        });

        it("script kills itself", async () => {
            const zosmfProperties = TEST_ENVIRONMENT.systemTestProperties.systems.common.zosmf;
            const directory = `${defaultSystem.unix.testdir}`;
            const commandName = " cd " + directory + " && chmod 777 killItself.sh && killItself.sh";
            const cwd =  `${defaultSystem.unix.testdir}/`;
            Imperative.console.info("Script for kill command:" + commandName +"--cwd /" +cwd);
            const response = await runCliScript(__dirname + "/__scripts__/issue_ssh_with_cwd.sh", TEST_ENVIRONMENT, [commandName,"/" + cwd]);

            checkResponse(response);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).not.toContain("Ended");
        });

});
