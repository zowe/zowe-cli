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
import { BasicProfileManager } from "../src/BasicProfileManager";
import { TestLogger } from "../../../__tests__/src/TestLogger";
import { IProfileDeleted } from "../src/doc/response/IProfileDeleted";
import { inspect } from "util";
import {
    APPLE_PROFILE_TYPE,
    ONLY_APPLE,
    STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
    TEST_PROFILE_ROOT_DIR
} from "../__resources__/TestConstants";


describe("Basic Profile Manager Delete", () => {
    it("should detect that no parms are supplied", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileDeleted;
        try {
            response = await prof.delete(undefined);
            TestLogger.error(response.message);
            TestLogger.error("Delete response - should not get here:\n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should detect the parms did not specify a name", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileDeleted;
        try {
            const parms = {name: "mulberry"};
            delete parms.name;
            response = await prof.delete(parms);
            TestLogger.error(response.message);
            TestLogger.error("Delete response - should not get here:\n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should be able to detect the parms specified a blank name", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileDeleted;
        try {
            const parms = {name: " "};

            response = await prof.delete(parms);
            TestLogger.error(response.message);
            TestLogger.error("Delete response - should not get here:\n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should  detect there is no profile of the specified name to delete", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileDeleted;
        try {
            response = await prof.delete({name: "red_delicious"});
            TestLogger.error(response.message);
            TestLogger.error("Delete response - should not get here:\n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should fail a delete where the profile to delete is marked as a dependency of another profile", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileDeleted;
        try {
            response = await prof.delete({name: "good_apple", rejectIfDependency: true});
            TestLogger.error(response.message);
            TestLogger.error("Delete response - should not get here:\n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should be able to handle an error thrown by delete/unlink", async () => {
        const prof: any = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });
        const profile = {
            name: "mackintosh_error_apple"
        };
        prof.loadProfile = jest.fn().mockReturnValue({profile});

        let error;
        let response: IProfileDeleted;
        try {
            response = await prof.delete(profile);
            TestLogger.error(response.message);
            TestLogger.error("Delete response - should not get here:\n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should be able to delete a profile", async () => {
        const prof: any = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });
        const profile = {
            name: "mackintosh_apple"
        };
        prof.loadProfile = jest.fn().mockReturnValue({profile});

        let error;
        let response: IProfileDeleted;
        try {
            response = await prof.delete(profile);
            TestLogger.info("Delete Full Response:\n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.error(error);
        }
        expect(error).toBeUndefined();
        expect(response.message).toMatchSnapshot();
        expect(response.path).toContain("mackintosh_apple.yaml");
    });

    it("should detect that the profile to delete is marked as a dependency of another profile, but allow delete if specified", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileDeleted;
        try {
            response = await prof.delete({name: "good_apple", rejectIfDependency: false});
            TestLogger.error(response.message);
            TestLogger.error("Delete response - should not get here:\n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeUndefined();
        expect(response.message).toMatchSnapshot();
        expect(response.path).toContain("good_apple.yaml");
    });
});
