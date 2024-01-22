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
import { TestLogger } from "../../../__tests__/src/TestLogger";
import { ISaveProfile } from "../../../src/profiles/doc/parms/ISaveProfile";
import { inspect } from "util";
import { IProfileSaved } from "../../../src/profiles/doc/response/IProfileSaved";

import {
    APPLE_BAN_UNKNOWN,
    APPLE_PROFILE_TYPE,
    APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE_ONE_REQ_DEP,
    BANANA_PROFILE_TYPE,
    MANGO_PROFILE_TYPE,
    ONLY_APPLE,
    ONLY_MANGO,
    STRAWBERRY_PROFILE_TYPE,
    STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
    TEST_PROFILE_ROOT_DIR
} from "./TestConstants";
import { BasicProfileManager } from "../../../src/profiles/BasicProfileManager";

const BAD_SAMPLE_SAVE_PARMS: ISaveProfile = {
    name: "bad_apple",
    type: "bad_apple",
    profile: {}
};

const GOOD_SAMPLE_SAVE_PARMS: ISaveProfile = {
    name: "apple",
    type: STRAWBERRY_PROFILE_TYPE,
    profile: {}
};

describe("Basic Profile Manager Save", () => {
    it("should detect missing parameters", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            const response = await prof.save(undefined);
        } catch (e) {
            error = e;
            TestLogger.info(e);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing profile", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            const parms = {name: "bad_apple", profile: {}};
            delete parms.profile;
            const response = await prof.save(parms as any);
        } catch (e) {
            error = e;
            TestLogger.info(e);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect a type mismatch when saving a profile", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: STRAWBERRY_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            const response = await prof.save(BAD_SAMPLE_SAVE_PARMS);
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

    it("should detect a blank name when creating a profile", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            const copy = JSON.parse(JSON.stringify({
                name: " ",
                profile: {}
            }));
            const response = await prof.save(copy);
        } catch (e) {
            error = e;
            TestLogger.info(e);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect a missing name when creating a profile", async () => {
        let error;
        try {
            const prof = new BasicProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_APPLE,
                type: APPLE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });
            const copy = JSON.parse(JSON.stringify({
                profile: {}
            }));
            const response = await prof.save(copy);
        } catch (e) {
            error = e;
            TestLogger.info(e);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect if the meta name was specified as the profile name", async () => {
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
            const response = await prof.save(copy);
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
        let response: IProfileSaved;
        try {
            const profile: any = {};
            profile.dependencies = {};
            response = await prof.save({name: "bad_apple", profile} as any);
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
        let response: IProfileSaved;
        try {
            const profile: any = {};
            profile.dependencies = [{type: STRAWBERRY_PROFILE_TYPE}];
            response = await prof.save({name: "bad_apple", profile} as any);
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that the dependencies are present, but type is missing", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileSaved;
        try {
            const profile: any = {};
            profile.dependencies = [{name: "bad_strawberry"}];
            response = await prof.save({name: "bad_apple", profile} as any);
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that a profile requires a dependency of a certain type", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileSaved;
        try {
            const profile: any = {description: "A bunch of rotten strawberries", amount: 30};
            response = await prof.save({name: "bad_strawberry", profile} as any);
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect all missing required fields on the schema", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileSaved;
        try {
            const profile: any = {
                dependencies: [{type: APPLE_PROFILE_TYPE, name: "bad_apple"}]
            };
            response = await prof.save({name: "bad_strawberry", profile} as any);
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect a type mismatch from the schema for strings", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileSaved;
        try {
            const profile: any = {description: true, rotten: true, age: 100};
            response = await prof.save({name: "bad_apple", profile} as any);
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect a type mismatch from the schema for booleans", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileSaved;
        try {
            const profile: any = {description: "A nasty apple", rotten: "yes", age: 100};
            response = await prof.save({name: "bad_apple", profile} as any);
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should fail a save request if the file already exists and overwrite is false", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {description: "A nasty apple", rotten: true, age: 100};
            const saveResponse = await prof.save({
                name: "old_apple",
                profile,
                overwrite: false
            } as any);
        } catch (e) {
            error = e;
            TestLogger.info(e.message);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should fail a save request if an error is thrown by write file", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {description: "A nasty apple", rotten: true, age: 100};
            const saveResponse = await prof.save({
                name: "throw_the_apple",
                profile,
                overwrite: true
            } as any);
        } catch (e) {
            error = e;
            TestLogger.info(e.message);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should fail a save request if there is an error writing the meta file", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_MANGO,
            type: MANGO_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        try {
            const profile: any = {description: "A nasty mango", peeled: true};
            const saveResponse = await prof.save({
                name: "bad_mango",
                profile,
                overwrite: true,
                updateDefault: true
            } as any);
        } catch (e) {
            error = e;
            TestLogger.info(e.message);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });

    it("should allow us to save a well-formed profile", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let saveResponse: IProfileSaved;
        try {
            const profile: any = {description: "A tasty apple", rotten: false, age: 1};
            saveResponse = await prof.save({
                name: "good_apple",
                profile,
                overwrite: true
            } as any);
        } catch (e) {
            error = e;
            TestLogger.info(e.message);
        }
        expect(error).toBeUndefined();
        expect(saveResponse.message).toContain('Profile ("good_apple" of type "apple") successfully written:');
        expect(saveResponse.profile).toMatchSnapshot();
    });

    it("should allow us to save a profile with a dependency", async () => {
        const copy = JSON.parse(JSON.stringify(STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY));
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: copy,
            type: STRAWBERRY_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let saveResponse: IProfileSaved;
        try {
            const strawberry: any = {
                type: STRAWBERRY_PROFILE_TYPE,
                amount: 10000,
                description: "Strawberries covered in chocolate.",
                dependencies: [
                    {
                        type: APPLE_PROFILE_TYPE,
                        name: "tasty_apples"
                    }
                ]
            };
            saveResponse = await prof.save({
                name: "chocolate_covered",
                profile: strawberry,
                overwrite: true
            } as any);
        } catch (e) {
            error = e;
        }
        expect(error).toBeUndefined();
        expect(saveResponse.message).toContain('Profile ("chocolate_covered" of type "strawberry") successfully written:');
        expect(saveResponse.profile).toMatchSnapshot();
    });

    it("should not allow us to overwrite a profile if overwrite false (or not specified)", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let saveResponse: IProfileSaved;
        try {
            const profile: any = {description: "A tasty apple", rotten: false, age: 1};
            saveResponse = await prof.save({
                name: "good_apple",
                profile,
            } as any);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow a save with a circular dependency", async () => {
        const copy = JSON.parse(JSON.stringify(APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE_ONE_REQ_DEP));
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: copy,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileSaved;
        try {
            response = await prof.save({
                name: "apple_with_two_req_dep_circular",
                type: APPLE_PROFILE_TYPE,
                profile: {
                    age: 1000,
                    description: "An old apple",
                    rotten: true,
                    dependencies: [
                        {
                            type: STRAWBERRY_PROFILE_TYPE,
                            name: "chocolate_covered"
                        },
                        {
                            type: BANANA_PROFILE_TYPE,
                            name: "banana_with_grape_dep"
                        }
                    ]
                },
                overwrite: true
            });
            TestLogger.error(response.message);
            TestLogger.error("Save response: \n" + inspect(response, {depth: null}));
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow a save with no contents", async () => {
        const copy = JSON.parse(JSON.stringify(ONLY_APPLE));
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: copy,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let response: IProfileSaved;
        try {
            response = await prof.save({
                name: "no_apple_core",
                profile: {},
                overwrite: true
            } as any);
        } catch (e) {
            error = e;
            TestLogger.info(error);
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow us to save a profile that lists dependencies of types that were not defined", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: ONLY_APPLE,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let saveResponse: IProfileSaved;
        try {
            const profile: any = {
                description: "A tasty apple",
                rotten: false,
                age: 1,
                dependencies: [{name: "bad_pear", type: "pear"}]
            };
            saveResponse = await prof.save({
                name: "good_apple",
                profile,
                overwrite: true
            } as any);
        } catch (e) {
            error = e;
            TestLogger.info(e.message);
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("Could not save the profile, because one or more dependencies is invalid or does not exist.");
        expect(error.message).toContain(
            "Load Error Details: Expect Error: Could not locate the profile type " +
      "configuration for \"pear\" within the input configuration list passed."
        );
    });

    it("should fail a save request if a profile has more properties than defined on the schema", async () => {
        const prof = new BasicProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: APPLE_BAN_UNKNOWN,
            type: APPLE_PROFILE_TYPE,
            logger: TestLogger.getTestLogger()
        });

        let error;
        let saveResponse: IProfileSaved;
        try {
            const profile: any = {
                description: "A tasty apple",
                rotten: false,
                age: 1,
                seedless: false
            };
            saveResponse = await prof.save({
                name: "tasty_apple",
                profile,
                overwrite: true
            } as any);
        } catch (e) {
            error = e;
            TestLogger.info(e.message);
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
    });
});
