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

import * as fs from "fs";
import { spawnSync, SpawnSyncReturns } from "child_process";
import { ITestEnvironment } from "./environment/doc/response/ITestEnvironment";
import { CommandProfiles, ICommandDefinition, IHandlerParameters } from "@zowe/core-for-zowe-sdk";

/**
 * Execute a CLI script
 * @export
 * @param  scriptPath - the path to the script
 * @param  testEnvironment - the test environment with env
 * @param [args=[]] - set of script args (optional)
 * @returns  node.js details about the results of
 *           executing the script, including exit code and output
 */
export function runCliScript(scriptPath: string, testEnvironment: ITestEnvironment<any>, args: any[] = []): SpawnSyncReturns<Buffer> {
    if (fs.existsSync(scriptPath)) {

        // We force the color off to prevent any oddities in the snapshots or expected values
        // Color can vary OS/terminal
        const childEnv = JSON.parse(JSON.stringify(process.env));
        childEnv.FORCE_COLOR = "0";
        for (const key of Object.keys(testEnvironment.env)) {
            // copy the values from the env
            childEnv[key] = testEnvironment.env[key];
        }

        if (process.platform === "win32") {
            // Execute the command synchronously
            return spawnSync("sh", [`${scriptPath}`].concat(args), {
                cwd: testEnvironment.workingDir,
                env: childEnv,
                encoding: "buffer"
            });
        }

        // Check to see if the file is executable
        try {
            fs.accessSync(scriptPath, fs.constants.X_OK);
        } catch {
            fs.chmodSync(scriptPath, "755");
        }
        return spawnSync(scriptPath, args, {
            cwd: testEnvironment.workingDir,
            env: childEnv,
            encoding: "buffer"
        });

    } else {
        throw new Error(`The script file ${scriptPath} doesn't exist`);

    }
}

/**
 * Check if stderr output is empty for profiles command. Ignores any message
 * about profiles being deprecated.
 * @deprecated Use `stripProfileDeprecationMessages`
 */
export function isStderrEmptyForProfilesCommand(output: Buffer): boolean {
    return stripProfileDeprecationMessages(output).length === 0;
}

/**
 * Strip v1 profile deprecation messages from stderr output.
 */
export function stripProfileDeprecationMessages(stderr: Buffer | string): string {
    return stderr.toString()
        .replace(/Warning: The command 'profiles [a-z]+' is deprecated\./g, "")
        .replace(/Recommended replacement: The 'config [a-z]+' command/g, "")
        .replace(/Recommended replacement: Edit your Zowe V2 configuration\s+zowe\.config\.json/g, "")
        .trim();
}

/**
 * Type for handler data used to build mock IHandlerParameters object.
 * The type inherits from IHandlerParameters but is different:
 * - `arguments` omits the required properties `$0` and `_`
 * - All properties are optional except for `definition`
 */
type PartialHandlerParameters = Partial<Omit<IHandlerParameters, "arguments">> & {
    arguments?: Record<string, any>;
    definition: ICommandDefinition;
};

/**
 * Build a mocked IHandlerParameters object. Includes the following properties:
 * - `response` - Mocked IHandlerResponseApi
 * - `arguments`
 *   - `$0` - hardcoded to "zowe"
 *   - `_` = `params.positionals`
 *   - `...params.arguments`
 * - `positionals` = `params.positionals`
 * - `profiles` = `params.profiles`
 * - `definition` = `params.definition`
 * - `fullDefinition` = `params.definition`
 * - `stdin` - hardcoded to `process.stdin`
 * @param params Partial handler parameters object (see above for usage)
 * @returns Mocked handler parameters object. Most mocks do nothing, but the
 * following methods call `expect().toMatchSnapshot`:
 * - `response.data`: `setMessage`, `setObj`
 * - `response.console`: `log`, `error`
 * - `response.format`: `output`
 */
export function mockHandlerParameters(params: PartialHandlerParameters): IHandlerParameters {
    return {
        response: {
            data: {
                setMessage: jest.fn((setMsgArgs) => {
                    expect(setMsgArgs).toMatchSnapshot();
                }) as any,
                setObj: jest.fn((setObjArgs) => {
                    expect(Buffer.isBuffer(setObjArgs) ? setObjArgs.toString() : setObjArgs).toMatchSnapshot();
                }),
                setExitCode: jest.fn()
            },
            console: {
                log: jest.fn((logs) => {
                    expect(logs.toString()).toMatchSnapshot();
                }) as any,
                error: jest.fn((errors) => {
                    expect(errors.toString()).toMatchSnapshot();
                }) as any,
                errorHeader: jest.fn(() => undefined) as any,
                prompt: jest.fn(async () => null) as any
            },
            progress: {
                startBar: jest.fn((parms) => undefined),
                endBar: jest.fn(() => undefined)
            },
            format: {
                output: jest.fn((parms) => {
                    expect(parms).toMatchSnapshot();
                })
            }
        },
        arguments: {
            $0: "zowe",
            _: params.positionals || [],
            ...(params.arguments || {})
        },
        positionals: params.positionals || [],
        profiles: params.profiles || new CommandProfiles(new Map()),
        definition: params.definition,
        fullDefinition: params.definition,
        stdin: process.stdin,
        isChained: params.isChained
    };
}
