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

import { IProfile } from "../../doc/definition/IProfile";
import { IMetaProfile } from "../../doc/definition/IMetaProfile";
import {
    APPLE_PROFILE_TYPE,
    APPLE_TYPE_SCHEMA,
    BANANA_PROFILE_TYPE,
    BANANA_TYPE_SCHEMA,
    BLUEBERRY_PROFILE_TYPE,
    BLUEBERRY_TYPE_SCHEMA,
    FRUIT_BASKET,
    FRUIT_BASKET_BAD,
    FRUIT_BASKET_WORSE,
    GRAPE_PROFILE_TYPE,
    GRAPE_TYPE_SCHEMA,
    MANGO_PROFILE_TYPE,
    MANGO_TYPE_SCHEMA,
    ORANGE_PROFILE_TYPE,
    STRAWBERRY_PROFILE_TYPE,
    STRAWBERRY_TYPE_SCHEMA
} from "../../../../cmd/__tests__/profiles/TestConstants";
import { IProfileTypeConfiguration } from "../../doc/config/IProfileTypeConfiguration";

/**
 * Mocked V1ProfileRead class - for the most part, just reacts differently based on the profile name/path specified
 * to simulate certain profile conditions for testing the manager.
 *
 * @export
 * @class V1ProfileRead
 */
export class V1ProfileRead {
    /**
     * Mocks the get all profile directores - for the most part, if a certain string is found within the path
     * input, a certain list will be responded.
     * @static
     * @param {string} profileRootDirectory
     * @returns {string[]}
     * @memberof V1ProfileRead
     */
    public static getAllProfileDirectories(profileRootDirectory: string): string[] {
        if (profileRootDirectory.indexOf(FRUIT_BASKET_BAD) >= 0 || profileRootDirectory.indexOf(FRUIT_BASKET_WORSE) >= 0) {
            return [MANGO_PROFILE_TYPE];
        }
        if (profileRootDirectory.indexOf(FRUIT_BASKET) >= 0) {
            return [APPLE_PROFILE_TYPE, STRAWBERRY_PROFILE_TYPE, BANANA_PROFILE_TYPE, GRAPE_PROFILE_TYPE];
        }
        return [];
    }

    /**
     * Mocked read meta, either throwns an error depending on the type OR returns defaults.
     * @static
     * @param {string} path
     * @returns {IMetaProfile}
     * @memberof V1ProfileRead
     */
    public static readMetaFile(path: string): IMetaProfile<IProfileTypeConfiguration> {

        // Return an ill formed meta configuration
        if (path.indexOf(MANGO_PROFILE_TYPE) >= 0 && path.indexOf(FRUIT_BASKET_BAD) >= 0) {
            return {
                defaultProfile: "bad_mango",
                configuration: undefined
            };
        }

        // Return an ill formed meta default
        if (path.indexOf(MANGO_PROFILE_TYPE) >= 0 && path.indexOf(FRUIT_BASKET_WORSE) >= 0) {
            return {
                defaultProfile: undefined,
                configuration: {
                    type: MANGO_PROFILE_TYPE,
                    schema: MANGO_TYPE_SCHEMA
                }
            };
        }

        // Mango type causes a throw error from the meta file read
        if (path.indexOf(MANGO_PROFILE_TYPE) >= 0) {
            throw new Error("Unexpected read meta file thrown");
        }

        // Blueberry type causes a default profile to be read and configuration to be
        // "read" from the meta file
        if (path.indexOf(BLUEBERRY_PROFILE_TYPE) >= 0) {
            return {
                defaultProfile: "sweet_blueberry",
                configuration: {
                    type: BLUEBERRY_PROFILE_TYPE,
                    schema: BLUEBERRY_TYPE_SCHEMA
                }
            };
        }

        // Orange type causes a default attempt, but should not find the "missing_orange"
        // profile
        if (path.indexOf(ORANGE_PROFILE_TYPE) >= 0) {
            return {
                defaultProfile: "missing_orange",
                configuration: {
                    type: BLUEBERRY_PROFILE_TYPE,
                    schema: BLUEBERRY_TYPE_SCHEMA
                }
            };
        }

        // The following meta files are "loaded" in the tests that grab the configuration and
        // Types from the existing meta files
        if (path.indexOf(FRUIT_BASKET) >= 0 && path.indexOf(APPLE_PROFILE_TYPE) >= 0) {
            return {
                defaultProfile: "good_apple",
                configuration: {
                    type: APPLE_PROFILE_TYPE,
                    schema: APPLE_TYPE_SCHEMA
                }
            };
        }
        if (path.indexOf(FRUIT_BASKET) >= 0 && path.indexOf(STRAWBERRY_PROFILE_TYPE) >= 0) {
            return {
                defaultProfile: "chocolate_strawberries",
                configuration: {
                    type: STRAWBERRY_PROFILE_TYPE,
                    schema: STRAWBERRY_TYPE_SCHEMA
                }
            };
        }
        if (path.indexOf(FRUIT_BASKET) >= 0 && path.indexOf(BANANA_PROFILE_TYPE) >= 0) {
            return {
                defaultProfile: "bundle_of_bananas",
                configuration: {
                    type: BANANA_PROFILE_TYPE,
                    schema: BANANA_TYPE_SCHEMA
                }
            };
        }
        if (path.indexOf(FRUIT_BASKET) >= 0 && path.indexOf(GRAPE_PROFILE_TYPE) >= 0) {
            return {
                defaultProfile: "green_grapes",
                configuration: {
                    type: GRAPE_PROFILE_TYPE,
                    schema: GRAPE_TYPE_SCHEMA
                }
            };
        }

        return null;
    }

    /**
     * Returns "all" mocked profile names. Used in delete and other tests to check for dependencies, etc.
     * @static
     * @param {string} profileTypeDir
     * @param {string} ext
     * @param {string} metaNameForType
     * @returns {string[]}
     * @memberof V1ProfileRead
     */
    public static getAllProfileNames(profileTypeDir: string, ext: string, metaNameForType: string): string[] {
        if (profileTypeDir.indexOf("apple") >= 0) {
            return ["good_apple", "tasty_apples"];
        }
        if (profileTypeDir.indexOf("strawberry") >= 0) {
            return ["strawberry_and_apple"];
        }
        return [];
    }

    /**
     * Read profile file checks the filepath specified and if a string (usually the profile name from the test) is found,
     * then "something" is returned - a well formed profile, an ill-formed profile, etc. Allows you to key off the
     * profile name in your test to control what is "loaded" here.
     * @static
     * @param {string} filePath
     * @param {string} type
     * @returns {IProfile}
     * @memberof V1ProfileRead
     */
    public static readProfileFile(filePath: string, type: string): IProfile {

        if (filePath.indexOf("prof_banana") >= 0) {
            return {
                sum: 1
            };
        }

        if (filePath.indexOf("throw_the_apple") >= 0) {
            throw new Error("Read error!");
        }

        if (filePath.indexOf("green_apple") >= 0) {
            return {
                property1: "baked",
                property2: true
            };
        }

        if (filePath.indexOf("red_apple") >= 0) {
            return {
                property1: "baked",
                property2: true
            };
        }

        // Profile with one dependency for multi-dependency load
        if (filePath.indexOf("sweet_strawberry") >= 0) {
            return {
                description: "Super sweet strawberries",
                amount: 1000,
                dependencies: [
                    {
                        type: APPLE_PROFILE_TYPE,
                        name: "good_apple"
                    }
                ]
            };
        }

        // Another simple well formed apple profile
        if (filePath.indexOf("tasty_apples") >= 0) {
            return {
                description: "tasty",
                rotten: false,
                age: 1
            };
        }

        // The following is used to test load detection of circular dependencies.
        if (filePath.indexOf("apple_has_circular") >= 0) {
            return {
                name: "apple_has_circular",
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
            };
        }

        // Following two profiles form a circular chain which will cause saves and loads to fail
        if (filePath.indexOf("banana_with_grape_dep") >= 0) {
            return {
                description: "A bundle of ripe Bananas",
                bundle: true,
                dependencies: [
                    {
                        type: GRAPE_PROFILE_TYPE,
                        name: "grape_with_banana_circular_dep"
                    }
                ]
            };
        }
        if (filePath.indexOf("grape_with_banana_circular_dep") >= 0) {
            return {
                description: "A real bad grape",
                color: "purple",
                dependencies: [
                    {
                        type: BANANA_PROFILE_TYPE,
                        name: "banana_with_grape_dep"
                    }
                ]
            };
        }

        // Simple "well-formed" strawberry profile
        if (filePath.indexOf("chocolate_covered") >= 0) {
            return {
                description: "chocolate covered",
                amount: 1000
            };
        }

        // Generic "ill-formed" profile for an apple type - causes schema validation to fail
        if (filePath.indexOf("misshapen_apple") >= 0) {
            return {
                description: "Disfigured Apple.",
            };
        }

        // A simple "well-formed" apple type
        if (filePath.indexOf("good_apple") >= 0) {
            return {
                description: "A tasty apple",
                age: 1,
                rotten: false
            };
        }

        // A simple "well-formed" blueberry profile
        if (filePath.indexOf("sweet_blueberry") >= 0) {
            return {
                tart: false
            };
        }

        // Another simple "well-formed" blueberry profile - used to "change the default"
        if (filePath.indexOf("tart_blueberry") >= 0) {
            return {
                tart: true
            };
        }

        // Mutli-dependency load profile - all should be well formed
        if (filePath.indexOf("apples_and_strawberries_and_bananas") >= 0) {
            return {
                description: "A tasty apple",
                age: 1,
                rotten: false,
                dependencies: [
                    {
                        type: STRAWBERRY_PROFILE_TYPE,
                        name: "chocolate_strawberries"
                    },
                    {
                        type: BANANA_PROFILE_TYPE,
                        name: "bundle_of_bananas"
                    }
                ]
            };
        }

        // A simple "well-formed" banana profile
        if (filePath.indexOf("bundle_of_bananas") >= 0) {
            return {
                bundle: true
            };
        }

        // A simple well formed strawberry profile
        if (filePath.indexOf("chocolate_strawberries") >= 0) {
            return {
                description: "chocolate covered",
                amount: 1000
            };
        }

        // Mutli-dependency load - where a dependency has a dependency
        if (filePath.indexOf("apples_and_grapes_and_strawberries_and_bananas") >= 0) {
            return {
                description: "A tasty apple",
                age: 1,
                rotten: false,
                dependencies: [
                    {
                        type: STRAWBERRY_PROFILE_TYPE,
                        name: "chocolate_strawberries"
                    },
                    {
                        type: BANANA_PROFILE_TYPE,
                        name: "bananas_and_grapes"
                    }
                ]
            };
        }

        // A banana profile with a grape dependency
        if (filePath.indexOf("bananas_and_grapes") >= 0) {
            return {
                bundle: true,
                dependencies: [
                    {
                        type: GRAPE_PROFILE_TYPE,
                        name: "green_grapes"
                    }
                ]
            };
        }

        // A simple "well-formed" grape profile
        if (filePath.indexOf("green_grapes") >= 0) {
            return {
                color: "green",
                description: "Super tasty grapes"
            };
        }

        // This is for a multi dependency load, where the lowest level dependency causes a validation error
        if (filePath.indexOf("apples_and_grapes_with_error_and_strawberries_and_bananas") >= 0) {
            return {
                description: "A tasty apple",
                age: 1,
                rotten: false,
                dependencies: [
                    {
                        type: STRAWBERRY_PROFILE_TYPE,
                        name: "chocolate_strawberries"
                    },
                    {
                        type: BANANA_PROFILE_TYPE,
                        name: "bananas_and_error_grapes"
                    }
                ]
            };
        }

        // This is a "well-formed" banana profile which points to an "ill-formed" grape profile
        if (filePath.indexOf("bananas_and_error_grapes") >= 0) {
            return {
                bundle: true,
                dependencies: [
                    {
                        type: GRAPE_PROFILE_TYPE,
                        name: "bad_grapes"
                    }
                ]
            };
        }

        // An "ill-formed" grape profile
        if (filePath.indexOf("bad_grapes") >= 0) {
            return {
                bundle: true,
            };
        }

        // This is for multi dependency load, where the lowest dependency is "not found"
        if (filePath.indexOf("apples_and_grapes_not_found_and_strawberries_and_bananas") >= 0) {
            return {
                description: "A tasty apple",
                age: 1,
                rotten: false,
                dependencies: [
                    {
                        type: STRAWBERRY_PROFILE_TYPE,
                        name: "chocolate_strawberries"
                    },
                    {
                        type: BANANA_PROFILE_TYPE,
                        name: "bananas_error_and_grapes"
                    }
                ]
            };
        }

        // A banana profile that points to a profile that doesn't exist
        if (filePath.indexOf("bananas_error_and_grapes") >= 0) {
            return {
                bundle: true,
                dependencies: [
                    {
                        type: GRAPE_PROFILE_TYPE,
                        name: "no_grapes"
                    }
                ]
            };
        }

        // Strawberry profile with apple dependency - for delete with reject if dependency. The good apple
        // is indicated in the "getAllProfileNames" method
        if (filePath.indexOf("strawberry_and_apple") >= 0) {
            return {
                description: "Tasty",
                amount: 1000,
                dependencies: [
                    {
                        type: APPLE_PROFILE_TYPE,
                        name: "good_apple"
                    }
                ]
            };
        }

        // Returns a strawberry profile with no dependency - definition marks as optional
        if (filePath.indexOf("strawberry_no_apple") >= 0) {
            return {
                description: "Tasty",
                amount: 1000
            };
        }

        // Returns a strawberry profile with a missing dependency - definition marks as optional
        if (filePath.indexOf("strawberry_not_found_apple") >= 0) {
            return {
                description: "Tasty",
                amount: 1000,
                dependencies: [
                    {
                        type: APPLE_PROFILE_TYPE,
                        name: "missing_apple"
                    }
                ]
            };
        }

        throw new Error("V1ProfileRead Mock did NOT have a profile for: " + filePath);
    }
}
