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

import Mock = jest.Mock;
jest.mock("path");
import { ProfileUtils } from "../ProfileUtils";
import * as path from "path";
import { IProfileLoaded } from "../../../../index";
import {
    APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE_ONE_REQ_DEP, BLUEBERRY_PROFILE_TYPE
} from "../../../../cmd/__tests__/profiles/TestConstants";

const mocks = {
    normalize: path.normalize as unknown as Mock<typeof path.normalize>
};

const TEST_DIR_PATH: string = "/__tests__/__results__/data/.testHomeDir";

describe("Profile Utils", () => {
    it("should construct the profile root directory", () => {
        mocks.normalize.mockImplementation((thePath) => {
            return thePath;
        });
        const root = ProfileUtils.constructProfilesRootDirectory(TEST_DIR_PATH);
        expect(root).toEqual(TEST_DIR_PATH + "/profiles/");
    });

    it("should flatten dependencies", () => {
        const responses: IProfileLoaded[] = [
            {
                message: "",
                type: "apple",
                failNotFound: true,
                profile: { name: "tasty_apple", type: "apple", rotten: false },
                dependenciesLoaded: true,
                name: "tasty_apple",
                dependencyLoadResponses: [
                    {
                        message: "",
                        type: "apple",
                        failNotFound: true,
                        profile: { name: "bad_apple", type: "apple", rotten: true },
                        dependenciesLoaded: true,
                        name: "bad_apple",
                    }
                ]
            }
        ];
        const flat = ProfileUtils.flattenDependencies(responses);
        expect(flat).toMatchSnapshot();
    });

    it("should get all type names", () => {
        const names: string[] = ProfileUtils.getAllTypeNames(APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE_ONE_REQ_DEP);
        expect(names).toMatchSnapshot();
    });

    it("should construct the profile option name", () => {
        const opt = ProfileUtils.getProfileOption(BLUEBERRY_PROFILE_TYPE);
        expect(opt).toMatchSnapshot();
    });

    it("should construct the profile option alias", () => {
        const alias = ProfileUtils.getProfileOptionAlias(BLUEBERRY_PROFILE_TYPE);
        expect(alias).toMatchSnapshot();
    });

    it("should construct the option and alias", () => {
        const [opt, alias] = ProfileUtils.getProfileOptionAndAlias(BLUEBERRY_PROFILE_TYPE);
        expect(opt).toMatchSnapshot();
        expect(alias).toMatchSnapshot();
    });
});
