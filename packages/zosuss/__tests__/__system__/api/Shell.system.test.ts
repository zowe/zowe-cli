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

import { Shell, SshSession } from "../../../index";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ZosUssMessages } from "../../../src/api/constants/ZosUss.messages";

let TEST_ENVIRONMENT: ITestEnvironment;
let SSH_SESSION: SshSession;
let defaultSystem: ITestPropertiesSchema;
const TIME_OUT = 50000;

describe("zowe uss issue ssh api call test", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "issue_ssh_system_api",
        });
        SSH_SESSION = TestEnvironment.createSshSession(TEST_ENVIRONMENT);
        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it ("should execute uname command on the remote system by ssh and return operating system name", async () => {
        const command = "uname";
        let stdoutData = "";
        await Shell.executeSsh(SSH_SESSION, command, (data: string) => {
            stdoutData += data;
        });
        expect(stdoutData).toMatch("OS/390");

    }, TIME_OUT);

    it ("should resolve cwd option", async () => {
        const command = "pwd";
        const cwd =  `${defaultSystem.unix.testdir}`;
        let stdoutData = "";
        await Shell.executeSshCwd(SSH_SESSION, command, cwd, (data: string) => {
            stdoutData += data;
        });
        expect(stdoutData).toMatch(new RegExp("\\" + cwd + "\\s"));
    }, TIME_OUT);

    it("should receive return code for valid command", async () => {
        const command = "ls";
        let stdoutData = "";
        const COMMAND_RC = 0;
        const rc = await Shell.executeSsh(SSH_SESSION, command, (data: string) => {
            stdoutData += data;
        });
        expect(rc).toBe(COMMAND_RC);

    }, TIME_OUT);

    it("should receive return code for invalid command", async () => {
        const command = "invalidCommand";
        let stdoutData = "";
        const COMMAND_NOT_FOUND_RC = 127;
        const rc = await Shell.executeSsh(SSH_SESSION, command, (data: string) => {
            stdoutData += data;
        });
        expect(rc).toBe(COMMAND_NOT_FOUND_RC);

    }, TIME_OUT);

    it("should receive return code for valid command with cwd option", async () => {
        const command = "ls";
        const cwd =  `${defaultSystem.unix.testdir}`;
        let stdoutData = "";
        const COMMAND_RC = 0;
        const rc = await Shell.executeSshCwd(SSH_SESSION, command, cwd, (data: string) => {
            stdoutData += data;
        });
        expect(rc).toBe(COMMAND_RC);

    }, TIME_OUT);

    it("should receive return code for invalid command with cwd option", async () => {
        const command = "invalidCommand";
        const cwd =  `${defaultSystem.unix.testdir}`;
        let stdoutData = "";
        const COMMAND_NOT_FOUND_RC = 127;
        const rc = await Shell.executeSshCwd(SSH_SESSION, command, cwd, (data: string) => {
            stdoutData += data;
        });
        expect(rc).toBe(COMMAND_NOT_FOUND_RC);

    }, TIME_OUT);

    it("should handle errors correctly when connection fails", async () => {
        const invalidSshSession = new SshSession({
            hostname: "invalidhost",
            port: 22,
            user: "",
            password: ""
        });

        try {
            const command = "uname";
            let stdoutData = "";
            await Shell.executeSsh(invalidSshSession, command, (data: string) => {
                stdoutData += data;
            });
        } catch (error) {
            expect(error.toString()).toContain(ZosUssMessages.unexpected.message);
        }

    }, TIME_OUT);

    it("should handle errors correctly when connection is refused", async () => {
        const invalidSshSession = new SshSession({
            hostname: "localhost",
            port: 22,
            user: "root",
            password: "**ThisPasswordIsExpectedNotToBeTheRealPasswordForRoot**"
        });

        try {
            const command = "uname";
            let stdoutData = "";
            await Shell.executeSsh(invalidSshSession, command, (data: string) => {
                stdoutData += data;
            });
        } catch (error) {
            expect(error.toString()).toContain(ZosUssMessages.connectionRefused.message);
        }

    }, TIME_OUT);

});
