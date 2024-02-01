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

import { BasicProfileManager } from "../../../src/profiles/BasicProfileManager";
import { TestLogger } from "../../../__tests__/src/TestLogger";
import { IProfileValidated } from "../../../src/profiles/doc/response/IProfileValidated";
import {
    APPLE_PROFILE_TYPE,
    ONLY_APPLE,
    STRAWBERRY_PROFILE_TYPE,
    STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
    TEST_PROFILE_ROOT_DIR
} from "./TestConstants";
import { ImperativeError } from "../../../src/error/ImperativeError";
jest.mock("../../../src/profiles/utils/ProfileIO");

describe("Basic Profile Manager Validate", () => {
    it("should detect undefined parms", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            const response = await prof.validate(undefined);
        } catch (e) {
            error = e;
            TestLogger.info(e);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect a type mismatch", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: STRAWBERRY_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            const response = await prof.validate({profile: {}} as any);
        } catch (e) {
            error = e;
            TestLogger.info(e);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain(
            "Expect Error: Could not locate the profile type configuration for \"strawberry\" within the input configuration list passed."
        );
    });

    it("should detect a that we are attempting to use the meta name", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            const copy = JSON.parse(JSON.stringify({
                name: APPLE_PROFILE_TYPE + "_meta",
                profile: {}
            }));
            const response = await prof.validate(copy);
        } catch (e) {
            error = e;
            TestLogger.info(e);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect a missing profile name", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            const response = await prof.validate({profile: {}} as any);
        } catch (e) {
            error = e;
            TestLogger.info(e);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that the dependencies are not an array", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {};
            profile.dependencies = {};
            const response = await prof.validate({name: "bad_apple", profile});
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that the dependencies are present, but name is missing", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {};
            profile.dependencies = [{type: STRAWBERRY_PROFILE_TYPE}];
            const response = await prof.validate({name: "bad_apple", profile});
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should be able to detect that the dependencies are present, but type is missing", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {};
            profile.dependencies = [{name: "bad_strawberry"}];
            const response = await prof.validate({name: "bad_apple", profile});
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should be able to detect that a profile requires a dependency of a certain type", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {description: "A bunch of rotten strawberries", amount: 30};
            const response = await prof.validate({name: "bad_strawberry", profile});
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should be able to detect all missing required fields on the schema", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {

                dependencies: [{type: APPLE_PROFILE_TYPE, name: "bad_apple"}]
            };
            const response = await prof.validate({name: "bad_strawberry", profile});
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should be able to detect a type mismatch from the schema for strings", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {description: true, rotten: true, age: 100};
            const response = await prof.validate({name: "bad_apple", profile});
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should be able to detect a type mismatch from the schema for booleans", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {description: "A nasty apple", rotten: "yes", age: 100};
            const response = await prof.validate({name: "bad_apple", profile});
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should validate a well formed profile successfully", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileValidated;
        try {
            const profile: any = {description: "A tasty apple", rotten: false, age: 1};
            response = await prof.validate({name: "good_apple", profile});
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeUndefined();
        expect(response.message).toMatchSnapshot();
    });

    it("should fail a save request if a profile has more properties than defined on the schema", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileValidated;
        try {
            const profile: any = {
                description: "A tasty apple",
                rotten: false,
                age: 1,
                seedless: false
            };
            response = await prof.validate({name: "good_apple", profile, strict: true});
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });
});
