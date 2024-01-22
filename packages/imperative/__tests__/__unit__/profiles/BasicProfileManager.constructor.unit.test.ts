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
import { ImperativeError } from "../../../src/error/ImperativeError";
import { TestLogger } from "../../../src/../__tests__/src/TestLogger";
import { APPLE_PROFILE_TYPE, FRUIT_BASKET_BAD_DIR, FRUIT_BASKET_WORSE, MANGO_PROFILE_TYPE, ONLY_APPLE, TEST_PROFILE_ROOT_DIR } from "./TestConstants";
import { BasicProfileManager } from "../../../src/profiles/BasicProfileManager";
import { IProfileTypeConfiguration } from "../../../src/profiles/doc/config/IProfileTypeConfiguration";

// UnitTestUtils.replaceIt();

describe("Basic Profile Manager Constructor", () => {
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

    it("should detect that a schema definition document is attempting to overload 'type'", () => {
        const copy: IProfileTypeConfiguration[] = JSON.parse(JSON.stringify(ONLY_APPLE));
        copy[0].schema.properties.type = {type: "boolean"};
        let caughtError;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
    });

    it("should detect that a schema definition document is attempting to overload 'name'", () => {
        const copy: IProfileTypeConfiguration[] = JSON.parse(JSON.stringify(ONLY_APPLE));
        copy[0].schema.properties.name = {type: "boolean"};
        let caughtError;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
    });

    it("should detect that a schema definition document is attempting to overload 'dependencies'", () => {
        const copy: IProfileTypeConfiguration[] = JSON.parse(JSON.stringify(ONLY_APPLE));
        copy[0].schema.properties.dependencies = {type: "boolean"};
        let caughtError;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
    });

    it("should allow instantiation if the meta doesn't have a default", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR + FRUIT_BASKET_WORSE,
                type: MANGO_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeUndefined();
    });

    it("should detect ill-formed meta profile configurations", () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR + FRUIT_BASKET_BAD_DIR,
                type: MANGO_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
