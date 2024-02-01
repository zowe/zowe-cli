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

import { TestLogger } from "../../../__tests__/src/TestLogger";
import { inspect } from "util";
import { IProfileLoaded } from "../../../src/profiles/doc/response/IProfileLoaded";
import {
    APPLE_PROFILE_TYPE,
    APPLE_TWO_REQ_DEP_BANANA_AND_STRAWBERRIES,
    APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
    APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE_ONE_REQ_DEP,
    BLUEBERRY_PROFILE_TYPE,
    ONLY_APPLE,
    ONLY_BLUEBERRY,
    ONLY_ORANGE,
    ORANGE_PROFILE_TYPE,
    STRAWBERRY_AND_APPLE_NO_DEP,
    STRAWBERRY_PROFILE_TYPE,
    STRAWBERRY_WITH_OPTIONAL_APPLE_DEPENDENCY,
    STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
    TEST_PROFILE_ROOT_DIR
} from "./TestConstants";
import { BasicProfileManager } from "../../../src/profiles/BasicProfileManager";

jest.mock("../../../src/utils/ProfileIO");

describe("Basic Profile Manager Load", () => {
    it("should detect missing parms", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const response = await prof.load(undefined);
            TestLogger.error(response.message);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should detect parms with a missing profile name", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const response = await prof.load({});
            TestLogger.error(response.message);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should fail a load request if the profile is not found", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const response = await prof.load({name: "missing_apple"});
        } catch (e) {
            error = e;
            TestLogger.info(error.message);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should fail a load request if the profile loaded does not conform to the schema", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const response = await prof.load({name: "misshapen_apple"});
        } catch (e) {
            error = e;
            TestLogger.info(error.message);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should handle a read error", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const response = await prof.load({name: "throw_the_apple"});
            TestLogger.error(response.message);
        } catch (e) {
            error = e;
            TestLogger.info(error.message);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should allow the load of a well formed profile", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "good_apple"});
            TestLogger.info(response.message);
        } catch (e) {
            error = e;
            TestLogger.error(error.message);
        }
        expect(error).toBeUndefined();
        expect(response.message).toMatchSnapshot();
        expect(response.profile).toMatchSnapshot();
        expect(response.dependenciesLoaded).toBe(false);
        expect(response.dependencyLoadResponses).toEqual([]);
        expect(response.name).toBe("good_apple");
        expect(response.type).toBe(APPLE_PROFILE_TYPE);
    });

    it("should load the default if requested", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_BLUEBERRY,
            type: BLUEBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({loadDefault: true});
            TestLogger.info(response.message);
        } catch (e) {
            error = e;
            TestLogger.info(error.message);
        }
        expect(error).toBeUndefined();
        expect(response.message).toMatchSnapshot();
        expect(response.profile).toMatchSnapshot();
        expect(response.dependenciesLoaded).toBe(false);
        expect(response.dependencyLoadResponses).toEqual([]);
        expect(response.name).toBe("sweet_blueberry");
        expect(response.type).toBe(BLUEBERRY_PROFILE_TYPE);
    });

    it("should fail if the default doesn't exist", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_ORANGE,
            type: ORANGE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({loadDefault: true});
            TestLogger.info(response.message);
        } catch (e) {
            error = e;
            TestLogger.info(error.message);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should fail the request if no profile name is specified and default profile is set but not found", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_ORANGE,
            type: ORANGE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        // Mock having a default profile set
        prof.getDefaultProfileName = jest.fn(() => {
            return "missing_orange";
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({loadDefault: true, failNotFound: false});
            TestLogger.info(response.message);
        } catch (e) {
            error = e;
            TestLogger.info(error.message);
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("does not exist");
        expect(error.message).toMatchSnapshot();
    });

    it("should not fail the request if 'fail not found' is false and the profile was not found", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_ORANGE,
            type: ORANGE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({loadDefault: true, failNotFound: false});
            TestLogger.info(response.message);
        } catch (e) {
            error = e;
            TestLogger.info(error.message);
        }
        expect(error).toBeUndefined();
        expect(response.message).toMatchSnapshot();
        expect(response.profile).toBeUndefined();
    });

    it("should load a profile with one dependency", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "sweet_strawberry"});
            TestLogger.info(response.message);
        } catch (e) {
            error = e;
            TestLogger.error(error.message);
        }
        expect(error).toBeUndefined();
        expect(response).toMatchSnapshot();
    });

    it("should load a profile with two dependencies", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: APPLE_TWO_REQ_DEP_BANANA_AND_STRAWBERRIES,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "apples_and_strawberries_and_bananas"});
            TestLogger.info(response.message);
        } catch (e) {
            error = e;
            TestLogger.error(error.message);
        }
        expect(error).toBeUndefined();
        expect(response).toMatchSnapshot();
    });

    it("should load a profile with two dependencies, one of which has it's own dependency", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "apples_and_grapes_and_strawberries_and_bananas"});
            TestLogger.info(response.message);
            TestLogger.info("Load response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.error(error);
        }
        expect(error).toBeUndefined();
        expect(response).toMatchSnapshot();
    });

    it("should fail a profile load with two dependencies, one of which has it's own dependency with an error", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "apples_and_grapes_with_error_and_strawberries_and_bananas"});
            TestLogger.info(response.message);
            TestLogger.info("Load response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.error(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should fail a profile load with two dependencies, one of which has it's own dependency which is not found", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "apples_and_grapes_not_found_and_strawberries_and_bananas"});
            TestLogger.info(response.message);
            TestLogger.info("Load response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.error(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should fail a profile load with two dependencies, one of which has it's own dependency that is circular", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE_ONE_REQ_DEP,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "apple_has_circular"});
            TestLogger.error(response.message);
            TestLogger.error("Load response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should allow us to load all profiles for all types", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_AND_APPLE_NO_DEP,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded[];
        try {
            response = await prof.loadAll();
            TestLogger.info("Load response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.error(error);
        }
        expect(error).toBeUndefined();
        expect(response).toMatchSnapshot();
    });

    it("should allow us to load a profile with an optional dependency that is not specified", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_OPTIONAL_APPLE_DEPENDENCY,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "strawberry_no_apple"});
            TestLogger.info("Load response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.error(error);
        }
        expect(error).toBeUndefined();
        expect(response).toMatchSnapshot();
    });

    it("should not allow us to load a profile with an optional dependency and the optional dependency doesn't exist", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_OPTIONAL_APPLE_DEPENDENCY,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "strawberry_not_found_apple"});
            TestLogger.info("Load response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.error(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should allow us to load a profile where an optional dependency doesn't exist (but fail not found is false)", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_OPTIONAL_APPLE_DEPENDENCY,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "strawberry_not_found_apple", failNotFound: false});
            TestLogger.info("Load response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.error(error);
        }
        expect(error).toBeUndefined();
        expect(response).toMatchSnapshot();
    });

    it("should fail a load if the profile doesn't have the required dependencies listed when loaded", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileLoaded;
        try {
            response = await prof.load({name: "strawberry_no_apple"});
            TestLogger.info("Load response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.error(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });
});
