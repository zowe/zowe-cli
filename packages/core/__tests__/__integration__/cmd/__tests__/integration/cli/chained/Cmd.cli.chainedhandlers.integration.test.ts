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

import { ITestEnvironment } from "../../../../../../__resources__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__resources__/__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../__resources__/src/TestUtil";
import { ICommandResponse } from "../../../../../../../src/cmd";
import { Imperative } from "../../../../../../../src/imperative";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("cmd-cli chained handlers", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_chained"
        });
    });

    const mainModule = process.mainModule;

    beforeEach(() => {
        (process.mainModule as any) = {
            filename: __filename
        };
    });

    afterEach(() => {
        process.mainModule = mainModule;
    });

    it("should not allow us to configure chained handlers that map arguments to indices beyond " +
        "the end of the list of chained handlers (edge case - one beyond the length of the array)", async () => {
        const fakeHandler = "my_handler_here";
        const THREE_AHEAD = 3;
        try {
            await Imperative.init({
                productDisplayName: "dummy",
                definitions: [{
                    name: "hello",
                    description: "this should fail due to mapping indices being invalid",
                    type: "command",
                    chainedHandlers: [{
                        handler: fakeHandler,
                        mapping: [{
                            from: "hello",
                            to: "hello",
                            applyToHandlers: [THREE_AHEAD]
                        }]
                    },
                    {handler: "dummy"},
                    {handler: "dummy"}]
                }],
                name: "hi",
                defaultHome: TEST_ENVIRONMENT.workingDir
            });

            expect("Imperative.init() call should have failed").toEqual("fail");  // should have encountered an error
        } catch (initErr) {
            expect(initErr.message).toContain("mapping");
            expect(initErr.message).toContain(fakeHandler);
        }
    });

    it("should be able to chain three different handlers together and get all output", () => {
        const response = runCliScript(__dirname + "/__scripts__/print-animals.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("aardvark");
        expect(response.stdout.toString()).toContain("bonobo");
        expect(response.stdout.toString()).toContain("cheetah");
    });

    it("should produce valid json for chained handlers if --response-format-json is specified", () => {
        const response = runCliScript(__dirname + "/__scripts__/print-animals-json.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        // parsing should succeed
        const jsonResponse: ICommandResponse = JSON.parse(response.stdout.toString());
        expect(jsonResponse.stdout).toContain("aardvark");
        expect(jsonResponse.stdout).toContain("bonobo");
        expect(jsonResponse.stdout).toContain("cheetah");
    });

    it("should be able to chain three different handlers together, but not print output for commands marked silent", () => {
        const response = runCliScript(__dirname + "/__scripts__/print-cheetah.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        // silent mode should make the first two messages not print out
        expect(response.stdout.toString().indexOf("aardvark")).toEqual(-1);
        expect(response.stdout.toString().indexOf("bonobo")).toEqual(-1);
        expect(response.stdout.toString()).toContain("cheetah");
    });

    it("should fail if a non optional response object mapping fail", () => {
        const response = runCliScript(__dirname + "/__scripts__/fail-response-mapping.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("this.field.does.not.exist");
    });

    it("should succeed if an optional mapping fails", () => {
        const response = runCliScript(__dirname + "/__scripts__/optional-response-mapping.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("undefined"); // the optional mapping failed, so the string argument is undefined
    });

    it("should throw an error if a non-existent mapping access fails", () => {
        const response = runCliScript(__dirname + "/__scripts__/access-mapping-notexist.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toContain("argument_does_not_exist: %s");
        // the way TextUtils work, accessing a null or undefined value in a log message just prints nothing out - no error or "undefined" added
    });

    it("should throw an error if a handler throws an error, and future handlers are not invoked", () => {
        const response = runCliScript(__dirname + "/__scripts__/handler-chain-failure.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toContain("aardvark");
        expect(response.stdout.toString()).not.toContain("bonobo");
        expect(response.stdout.toString()).not.toContain("cheetah");
    });


    it("should properly map arguments in a command with many handlers", () => {
        const response = runCliScript(__dirname + "/__scripts__/many-handlers.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        // these phrases should only be in the output if the mapping was successful
        expect(response.stdout.toString()).toContain("squiggle");
        expect(response.stdout.toString()).toContain("lasagna");
        expect(response.stdout.toString()).toContain("LASAGNA"); // from PrintStringArgsInCaps handler
    });

});
