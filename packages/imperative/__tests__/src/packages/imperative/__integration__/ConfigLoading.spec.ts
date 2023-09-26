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
import { IImperativeConfig, Imperative } from "../../../../../packages/imperative";
import { ImperativeConfig } from "../../../../../packages/utilities";

describe("Imperative should validate config provided by the consumer", function () {
    const packageJsonPath = __dirname + "/package.json";
    const mainModule = process.mainModule;

    beforeAll(() => {
        // Temporarily change the main module filename so that the test can work.
        (process.mainModule as any) = {
            filename: __filename
        };
    });

    afterAll(() => {
        process.mainModule = mainModule;
        T.unlinkSync(packageJsonPath);
    });

    it("We should be able to load our configuration from our package.json", function () {
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
        return Imperative.init().then(() => {
            // "Display name should have matched our config"
            expect(ImperativeConfig.instance.loadedConfig.productDisplayName)
                .toEqual(config.productDisplayName);
        });
    });
});
