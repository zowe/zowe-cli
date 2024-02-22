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

import { ImperativeError } from "../../../error";
import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { APPLE_PROFILE_TYPE, ONLY_APPLE } from "./TestConstants";
import { CliProfileManager } from "../../src/profiles/CliProfileManager";
import { IProfileTypeConfiguration } from "../../../profiles/src/doc/config/IProfileTypeConfiguration";

describe("Basic Profile Manager Constructor", () => {
    it("should detect no parms when instantiating", () => {
        let error;
        try {
            const prof = new CliProfileManager(undefined as any);
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Expect Error: Profile Manager input parms not supplied");
    });

    it("should detect that no type configuration is supplied", () => {
        let error;
        try {
            const prof = new CliProfileManager({
                typeConfigurations: undefined,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("V1 profiles are no longer read from disk. " +
            "You can supply the profile type configurations to the profile manager constructor"
        );
    });

    it("should detect that the type configuration is an empty array", () => {
        let error;
        try {
            const prof = new CliProfileManager({
                typeConfigurations: [],
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("V1 profiles are no longer read from disk. " +
            "You can supply the profile type configurations to the profile manager constructor"
        );
    });

    it("should detect if the type is undefined", () => {
        let error;
        try {
            const prof = new CliProfileManager({
                typeConfigurations: ONLY_APPLE,
                type: undefined as any,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Expect Error: No profile type supplied on the profile manager parameters");
    });

    it("should detect if the type is blank", () => {
        let error;
        try {
            const prof = new CliProfileManager({
                typeConfigurations: ONLY_APPLE,
                type: " ",
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Expect Error: No profile type supplied on the profile manager parameters");
    });

    it("should detect that a type not found within the configurations", () => {
        let error;
        try {
            const prof = new CliProfileManager({
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
            const prof = new CliProfileManager({
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
            const prof = new CliProfileManager({
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
            const prof = new CliProfileManager({
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
            const prof = new CliProfileManager({
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
    });
});
