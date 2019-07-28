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


/**
 * Execute a CLI script
 * @export
 * @param  scriptPath - the path to the script
 * @param  testEnvironment - the test environment with env
 * @param [args=[]] - set of script args (optional)
 * @returns  node.js details about the results of
 *           executing the script, including exit code and output
 */
export function runCliScript(scriptPath: string, testEnvironment: ITestEnvironment, args: any[] = []): SpawnSyncReturns<Buffer> {
    if (fs.existsSync(scriptPath)) {

        // We force the color off to prevent any oddities in the snapshots or expected values
        // Color can vary OS/terminal
        const childEnv = JSON.parse(JSON.stringify(process.env));
        childEnv.FORCE_COLOR = "0";
        for (const key of Object.keys(testEnvironment.env)) {
            // copy the values from the env
            childEnv[key] = testEnvironment.env[key];
        }

        // Execute the command synchronously
        return spawnSync("sh", [`${scriptPath}`].concat(args), {cwd: testEnvironment.workingDir, env: childEnv});
    } else {
        throw new Error(`The script file  ${scriptPath} doesn't exist`);

    }
}

