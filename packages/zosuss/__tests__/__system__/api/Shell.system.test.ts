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
import { Session } from "@brightside/imperative";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";

let testEnvironment: ITestEnvironment;
let SSH_SESSION: Session;

describe("Shell", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "shell_execute_command"
        });
        SSH_SESSION = TestEnvironment.createSshSession(testEnvironment);
    });

    it ("should execute uname command on the remote system by ssh and return operating system name", async () => {
        // TODO: make a meaningful test e.g. check output from stdout
        // await Shell.executeSsh(SSH_SESSION, "uname");
    });
});
