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

jest.mock("../src/utils/ProfileIO");

import { PROFILE_TYPE } from "../../../__tests__/src/packages/profiles/src/constants/BasicProfileManagerTestConstants";
import { BasicProfileManager } from "../src/BasicProfileManager";
import {
    APPLE_PROFILE_TYPE,
    GRAPE_PROFILE_TYPE,
    ONLY_APPLE,
    STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
    TEST_PROFILE_ROOT_DIR
} from "./TestConstants";
import { TestLogger } from "../../../__tests__/src/TestLogger";
import { IProfile, ProfileIO } from "../";
import { inspect } from "util";

// UnitTestUtils.replaceIt();
const testLogger = TestLogger.getTestLogger();
describe("Basic Profile Manager - Merge", () => {
    it("Should be able to merge two simple profiles together, " +
        "with the new profile taking precedence for same-name fields", () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        const profileA: IProfile = {type: APPLE_PROFILE_TYPE, name: "first", description: "first apple", age: 5};
        const profileB: IProfile = {type: APPLE_PROFILE_TYPE, name: "second", rotten: true};
        const merged = prof.mergeProfiles(profileA, profileB);
        testLogger.info("Merged profile result: " + inspect(merged, {depth: null}));
        expect(merged.name).toEqual(profileB.name);
        expect(merged.rotten).toEqual(profileB.rotten);
        expect(merged.description).toEqual(profileA.description);
        expect(merged.age).toEqual(profileA.age);
    });

    it("should merge dependencies on profiles, while deleting duplicates", () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: PROFILE_TYPE.STRAWBERRY,
            logger: TestLogger.getTestLogger()
        });

        const profileA: IProfile = {
            type: PROFILE_TYPE.STRAWBERRY, name: "first",
            dependencies: [{type: APPLE_PROFILE_TYPE, name: "old_apple"}, {type: GRAPE_PROFILE_TYPE, name: "old_grape"}]
        };
        const profileB: IProfile = {
            type: PROFILE_TYPE.STRAWBERRY,
            name: "second",
            dependencies: [{type: APPLE_PROFILE_TYPE, name: "new_apple"}]
        };
        const merged = prof.mergeProfiles(profileA, profileB);
        testLogger.info("Merged profile result: " + inspect(merged, {depth: null}));
        expect(merged.dependencies.length).toEqual(2); // should still have two dependencies
        let appleDependency: any;
        let grapeDependency: any;
        for (const dependency of merged.dependencies) {
            if (dependency.type === APPLE_PROFILE_TYPE) {
                appleDependency = dependency;
            }
            else if (dependency.type === GRAPE_PROFILE_TYPE) {
                grapeDependency = dependency;
            }
        }
        expect(appleDependency).toBeDefined();
        expect(grapeDependency).toBeDefined();
        expect(appleDependency.name).toEqual(profileB.dependencies[0].name);
        expect(grapeDependency.name).toEqual(profileA.dependencies[1].name);
    });

    it("should replace array type profile fields (other than dependencies) with newer versions of the array" +
        "rather than merging them (merging them makes it impossible to specify new values when" +
        "updating profiles via CLI) ", () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: PROFILE_TYPE.STRAWBERRY,
            logger: TestLogger.getTestLogger()
        });
        const oldProfile: IProfile = {
            type: PROFILE_TYPE.STRAWBERRY, name: "first",
            myArrayVariable: ["old_value1", "oldValue2"],
            // test that the array replacement still works on deeply nested fields
            hasNestedArray: {hasNestedArray: {hasNestedArray: ["old_value1", "old_value2"]}}
        };
        const newProfile: IProfile = {
            type: PROFILE_TYPE.STRAWBERRY,
            name: "first",
            myArrayVariable: ["new_value1", "new_value2", "new_value3"],
            hasNestedArray: {hasNestedArray: {hasNestedArray: ["new_value1", "new_value2", "new_value3", "new_value4"]}}
        };
        const merged = prof.mergeProfiles(oldProfile, newProfile);
        testLogger.info("Merged profile result: " + inspect(merged, {depth: null}));
        expect(merged.myArrayVariable.length).toEqual(newProfile.myArrayVariable.length);
        for (const oldValue of oldProfile.myArrayVariable) {
            expect(merged.myArrayVariable.indexOf(oldValue)).toEqual(-1);
        }

        for (const oldValue of oldProfile.hasNestedArray.hasNestedArray.hasNestedArray) {
            expect(merged.hasNestedArray.hasNestedArray.hasNestedArray.indexOf(oldValue)).toEqual(-1);
        }
        expect(merged.hasNestedArray.hasNestedArray.hasNestedArray.length).toEqual(newProfile.hasNestedArray.hasNestedArray.hasNestedArray.length);
        expect(merged.hasNestedArray).toEqual(newProfile.hasNestedArray);
    });

    it("should merge on update if \"merge\" is specified on the parms", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: [{
                type: PROFILE_TYPE.STRAWBERRY,
                schema: {
                    type: "object",
                    title: "test profile for updating on merging",
                    description: "ditto",
                    properties: {
                        myArrayVariable: {
                            type: "array"
                        },
                        hasNestedArray: {
                            type: "object"
                        }
                    }
                }
            }],
            type: PROFILE_TYPE.STRAWBERRY,
            logger: TestLogger.getTestLogger()
        });
        const profileA = {
            type: PROFILE_TYPE.STRAWBERRY, name: "first",
            myArrayVariable: ["old_value1", "oldValue2"],
            // test that the array replacement still works on deeply nested fields
            hasNestedArray: {hasNestedArray: {hasNestedArray: ["old_value1", "old_value2"]}},
        };
        ProfileIO.writeProfile = jest.fn((path: string, profile: any) => {
            // do nothing
        });
        ProfileIO.exists = jest.fn((path: string) => {
            return path.indexOf("meta") === -1 ? path : undefined;
        });
        ProfileIO.readProfileFile = jest.fn((filePath: string, type: string) => {
            if (type === PROFILE_TYPE.STRAWBERRY) {
                return profileA;
            }
            else {
                return {
                    type: "apple",
                    name: "thing"
                };
            }
        });
        const profileB: IProfile = {
            myArrayVariable: ["new_value1", "new_value2", "new_value3"],
            hasNestedArray: {hasNestedArray: {hasNestedArray: ["new_value1", "new_value2", "new_value3", "new_value4"]}},
        };
        const updateResult = await prof.update({name: "first", profile: profileB, merge: true});
        const merged = updateResult.profile;
        testLogger.info("Merged profile result: " + inspect(merged, {depth: null}));
        expect(merged.myArrayVariable.length).toEqual(profileB.myArrayVariable.length);
        for (const oldValue of profileA.myArrayVariable) {
            expect(merged.myArrayVariable.indexOf(oldValue)).toEqual(-1);
        }

        for (const oldValue of profileA.hasNestedArray.hasNestedArray.hasNestedArray) {
            expect(merged.hasNestedArray.hasNestedArray.hasNestedArray.indexOf(oldValue)).toEqual(-1);
        }
        expect(merged.hasNestedArray.hasNestedArray.hasNestedArray.length).toEqual(profileB.hasNestedArray.hasNestedArray.hasNestedArray.length);
        expect(merged.hasNestedArray).toEqual(profileB.hasNestedArray);
    });
});
