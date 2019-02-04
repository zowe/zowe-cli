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

import { Shell } from "../../../index";
import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import { ITestEnvironment } from "../../__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../__src__/environment/TestEnvironment";

let testEnvironment: ITestEnvironment;
let ZOSMF_SESSION: Session;
let SSH_SESSION: Session;
const TEST_TIMOUT = 15000;

describe("Shell", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "shell_execute_command"
        });
        ZOSMF_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        SSH_SESSION = TestEnvironment.createSshSession(testEnvironment);
    });

    it ("should execute uname command on the remote system by jcl and return operating system name", async () => {
        expect(await Shell.executeCommand(ZOSMF_SESSION, "uname")).toBe("OS/390\n");
    }, TEST_TIMOUT);

    it ("should execute pwd command with cwd option on the remote system and return cwd", async () => {
        const cwd = "/";
        expect(await Shell.executeCommandCwd(ZOSMF_SESSION, "pwd", cwd)).toBe(`${cwd}\n`);
    }, TEST_TIMOUT);

    it ("should execute uname command on the remote system by ssh and return operating system name", async () => {
        // TODO: make a meaningful test e.g. check output from stdout
        // await Shell.executeSsh(SSH_SESSION, "uname");
    });
});
