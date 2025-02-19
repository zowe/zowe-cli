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

import { resolve } from "path";
import { TestEnvironment } from "../../../__tests__/__src__/environment/TestEnvironment";

describe("behavior of main.ts", () => {

    // Create the unique test environment
    beforeAll(async () => {
        await TestEnvironment.setUp({
            testName: "imperative_integration_tests",
            skipProperties: true
        });
    });

    describe("Imperative init error handling", () => {

        it("should exit with non zero return code if Imperative.init() fails - calling main.ts directly", async () => {

            const mainTs = resolve(__dirname, '../lib/main');

            const realImperative = require("@zowe/imperative").Imperative;
            const imperativeMock = jest.spyOn(realImperative, "init");
            const fatalLogMock = jest.spyOn(realImperative.console, "fatal");

            let setExitCode = 0;

            const mockExit = jest.spyOn(process as any, 'exit').mockImplementation((newExitCode: any) => {
                setExitCode = newExitCode;
            });

            const errMsg = "This should fail zowe!";
            let loggedMsg = "";

            fatalLogMock.mockImplementation((message: any, ..._args: any[]) => {
                loggedMsg = message;
            });

            imperativeMock.mockImplementation(async () => {
                throw new Error(errMsg);
            });

            await require(mainTs);
            expect(mockExit).toHaveBeenCalledWith(1);
            expect(setExitCode).toBe(1);
            expect(loggedMsg).toContain(errMsg);
        });

    });
});
