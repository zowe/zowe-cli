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

jest.mock("../../../../../src/utilities/src/ImperativeConfig");

import * as TestUtil from "../../../TestUtil";
import { BasicProfileManager } from "../../../../../src/index";
import { TestLogger } from "../../../../src/TestLogger";
import { bananaProfile, PROFILE_TYPE } from "../src/constants/BasicProfileManagerTestConstants";

const profileDirectory = TestUtil.createUniqueTestDataDir("profile-manager-initialize");

describe("Basic Profile Manager Constructor", () => {
    it("Should create a profile manager", async () => {
        let caughtError: Error = new Error("");
        let newProfMgr;

        try {
            // Create a manager instance
            newProfMgr = new BasicProfileManager({
                profileRootDirectory: profileDirectory,
                logger: TestLogger.getTestLogger(),
                type: PROFILE_TYPE.BANANA,
                typeConfigurations: [bananaProfile]
            });
        } catch (e) {
            caughtError = e;
            TestLogger.error(caughtError.message);
        }

        expect(newProfMgr).not.toBeNull();
        expect(caughtError.message).toEqual("");
    });
});
