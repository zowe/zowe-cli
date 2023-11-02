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
import { ImperativeError } from "../../error/src/ImperativeError";
import { TestLogger } from "../../../__tests__/src/TestLogger";
import { IProfileLoaded } from "../../profiles/src/doc/response/IProfileLoaded";
import {
    APPLE_PROFILE_TYPE,
    APPLE_TWO_REQ_DEP_BANANA_AND_STRAWBERRIES,
    APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
    BLUEBERRY_PROFILE_TYPE,
    FRUIT_BASKET_DIR,
    ONLY_APPLE,
    ONLY_BLUEBERRY,
    STRAWBERRY_AND_APPLE_NO_DEP,
    TEST_PROFILE_ROOT_DIR
} from "../__resources__/TestConstants";
import { BasicProfileManager } from "../src/BasicProfileManager";
// UnitTestUtils.replaceIt();

describe("Basic Profile Manager", () => {
    it("should detect no parms when instantiating", () => {
        let error;
        try {
            const prof = new BasicProfileManager(undefined);
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that the profile directory is undefined", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: undefined,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that the profile directory is blank", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: " ",
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that no type configuration is supplied", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: undefined,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("An error occurred collecting all configurations from the profile root directory");
    });

    it("should detect that the type configuration is an empty array", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: [],
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("An error occurred collecting all configurations from the profile root directory");
    });

    it("should detect if the type is undefined", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: undefined,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect if the type is blank", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: " ",
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that a type not found within the configurations", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: "bad_apple",
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain(
            "Expect Error: Could not locate the profile type configuration for \"bad_apple\" within the input configuration list passed."
        );
    });

    it("should allow us to instantiate the cli profile manager", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            TestLogger.info("Profile Manager Created");
        } catch (e) {
            error = e;
            TestLogger.error(e);
        }
        expect(error).toBeUndefined();
    });

    it("should load all profiles", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_AND_APPLE_NO_DEP,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let responses: IProfileLoaded[];
        try {
            responses = await prof.loadAll();
        } catch (e) {
            error = e;
            TestLogger.error(e);
        }
        expect(error).toBeUndefined();
        expect(responses).toMatchSnapshot();
    });

    it("should detect ill formed profiles during a load all", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: APPLE_TWO_REQ_DEP_BANANA_AND_STRAWBERRIES,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let responses: IProfileLoaded[];
        try {
            responses = await prof.loadAll();
        } catch (e) {
            error = e;
            TestLogger.error(e);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should initialize the environment", async () => {
        const responses = await BasicProfileManager.initialize({
            configuration: APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
            profileRootDirectory: TEST_PROFILE_ROOT_DIR
        });

        expect(responses).toBeDefined();
        expect(responses).toMatchSnapshot();
    });

    it("should detect missing parms on initialize", async () => {
        let error;
        try {
            const responses = await BasicProfileManager.initialize(undefined);
        } catch (e) {
            error = e;
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing configuration on initialize", async () => {
        let error;
        try {
            const parms = {
                configuration: undefined as any,
                profileRootDirectory: TEST_PROFILE_ROOT_DIR
            };
            const responses = await BasicProfileManager.initialize(parms);
        } catch (e) {
            error = e;
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing profile directory on initialize", async () => {
        let error;
        try {
            const parms = {
                configuration: APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
                profileRootDirectory: undefined as any
            };
            const responses = await BasicProfileManager.initialize(parms);
        } catch (e) {
            error = e;
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect blank profile directory on initialize", async () => {
        let error;
        try {
            const parms = {
                configuration: APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
                profileRootDirectory: " "
            };
            const responses = await BasicProfileManager.initialize(parms);
        } catch (e) {
            error = e;
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should create an instance and read all configurations from the meta files", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR + FRUIT_BASKET_DIR,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });
        expect(prof.configurations).toMatchSnapshot();
    });

    it("should fail a create if no configurations and passed and none can be read from disk", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that the configuration passed is not an array", async () => {
        const init: any = {
            configuration: [],
            profileRootDirectory: TEST_PROFILE_ROOT_DIR + FRUIT_BASKET_DIR
        };
        init.configuration = {};
        let error;
        try {
            const responses = await BasicProfileManager.initialize(init);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should only initialize types not already defined in the environment", async () => {
        const responses = await BasicProfileManager.initialize({
            configuration: APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
            profileRootDirectory: TEST_PROFILE_ROOT_DIR + FRUIT_BASKET_DIR
        });
        expect(responses).toBeDefined();
        expect(responses).toMatchSnapshot();
    });

    it("should allow a re-initialize of the environment", async () => {
        const responses = await BasicProfileManager.initialize({
            configuration: APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE,
            profileRootDirectory: TEST_PROFILE_ROOT_DIR + FRUIT_BASKET_DIR,
            reinitialize: true
        });
        expect(responses).toBeDefined();
        expect(responses).toMatchSnapshot();
    });

    it("should allow us to set the default in the meta profile", () => {
        let error;
        let response;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_BLUEBERRY,
                type: BLUEBERRY_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });

            response = prof.setDefault("tart_blueberry");
        } catch (e) {
            error = e;
            TestLogger.error(e);
        }
        expect(error).toBeUndefined();
        expect(response).toMatchSnapshot();
    });

    it("should fail a request to set the default if the profile is not found", () => {
        let error;
        let response;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_BLUEBERRY,
                type: BLUEBERRY_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            response = prof.setDefault("bad_blueberry");
        } catch (e) {
            error = e;
            TestLogger.info(e);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
        expect(response).toBeUndefined();
    });
});
