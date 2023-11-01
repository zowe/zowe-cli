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

import { ImperativeConfig } from "../src/ImperativeConfig";
import { NextVerFeatures } from "../src/NextVerFeatures";

describe("NextVerFeatures", () => {
    const impCfg: ImperativeConfig = ImperativeConfig.instance;

    beforeAll(() => {
        // impCfg.getCliCmdName is a getter of a property, so mock the property
        Object.defineProperty(impCfg, "envVariablePrefix", {
            configurable: true,
            get: jest.fn(() => {
                return "ZOWE";
            })
        });
    });

    describe("useV3ErrFormat", () => {

        it("should return false when environment variable is not set", () => {
            delete process.env.ZOWE_V3_ERR_FORMAT;
            expect(NextVerFeatures.useV3ErrFormat()).toBe(false);
        });

        it("should return true when environment variable is set to lowercase true", () => {
            process.env.ZOWE_V3_ERR_FORMAT = "true";
            expect(NextVerFeatures.useV3ErrFormat()).toBe(true);
        });

        it("should return true when environment variable is set to uppercase TRUE", () => {
            process.env.ZOWE_V3_ERR_FORMAT = "TRUE";
            expect(NextVerFeatures.useV3ErrFormat()).toBe(true);
        });

        it("should return false when environment variable is set to a non-true value", () => {
            process.env.ZOWE_V3_ERR_FORMAT = "someGoofyValue";
            expect(NextVerFeatures.useV3ErrFormat()).toBe(false);
        });
    });
});
