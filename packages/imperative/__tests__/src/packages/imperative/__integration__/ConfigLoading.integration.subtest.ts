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

import * as T from "../../../TestUtil";
import { IImperativeConfig, Imperative } from "../../../../../src/imperative";
import { ImperativeConfig } from "../../../../../src/utilities";
import { dirname } from "path";
import { existsSync } from "fs";

describe("Imperative should validate config provided by the consumer", function () {
    let packageJsonPath: string;
    // This is just to satisfy the type check. As long as we are CommonJS, this should be defined
    if (require.main) {
        packageJsonPath = dirname(require.main.filename) + "/package.json";
        if (existsSync(packageJsonPath)) {
            // Throw an error if package.json exists in the main module dir, since we don't want to overwrite or delete it. 
            // Let the user decide if it is test data, and delete it if it is left over from a previous test. 
            throw Error("Package JSON exists at " + packageJsonPath + ". Verify the file is test data and delete if it is.");
        }
    }

    afterAll(() => {
        T.unlinkSync(packageJsonPath);
    });

    it("We should be able to load our configuration from our package.json", async function () {
        const config: IImperativeConfig = {
            definitions: [
                {
                    name: "hello",
                    type: "command",
                    options: [],
                    description: "my command"
                }
            ],
            productDisplayName: "My product (packagejson)",
            defaultHome: "~/.myproduct",
            rootCommandDescription: "My Product CLI"
        };
        T.writeFileSync(packageJsonPath, JSON.stringify({imperative: config, name: "sample"}));
        await Imperative.init();

        // "Display name should have matched our config"
        expect(ImperativeConfig.instance.loadedConfig.productDisplayName).toEqual(config.productDisplayName);
    });
});
