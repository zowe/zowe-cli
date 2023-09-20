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

import { ConfigurationLoader } from "..";
import { IImperativeOverrides } from "../src/doc/IImperativeOverrides";

describe("ConfigurationLoader", () => {
    describe("overrides", () => {
        it("should return a config with an empty overrides", () => {
            const result = ConfigurationLoader.load(
                {
                    name: "some-name"
                },
                {},
                () => undefined
            );

            expect(result.overrides).toEqual({});
        });

        it("should return a config with the passed overrides", () => {
            const overrides: IImperativeOverrides = {
                CredentialManager: "./ABCD.ts"
            };

            const result = ConfigurationLoader.load(
                {
                    name: "some-name",
                    overrides
                },
                {},
                () => undefined
            );

            expect(result.overrides).toEqual(overrides);
        });
    });
});
