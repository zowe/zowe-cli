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

import { BasicProfileManager } from "../src/BasicProfileManager";
import { APPLE_PROFILE_TYPE, ONLY_APPLE, TEST_PROFILE_ROOT_DIR } from "./TestConstants";
import { TestLogger } from "../../../__tests__/TestLogger";
import { IProfileUpdated } from "../src/doc/response/IProfileUpdated";

jest.mock("../src/utils/ProfileIO");


describe("Basic Profile Manager Update", () => {
    it("should detect missing parameters", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileUpdated;
        try {
            response = await prof.update(undefined);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing name parameter", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileUpdated;
        try {
            response = await prof.update({});
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should allow us to update a profile", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileUpdated;
        try {
            response = await prof.update({
                name: "good_apple",
                profile: {
                    rotten: false,
                    description: "Getting older, but still good.", age: 2
                }
            } as any);
        } catch (e) {
            error = e;
        }
        expect(error).toBeUndefined();
        expect(response.message).toMatchSnapshot();
    });
});
