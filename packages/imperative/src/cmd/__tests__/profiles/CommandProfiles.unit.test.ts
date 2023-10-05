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

import { IProfile, IProfileLoaded } from "../../../profiles";
import { CommandProfiles } from "../../src/profiles/CommandProfiles";
import { ImperativeError } from "../../../error";

const BANANA_PROFILE_TYPE: string = "banana";
const STRAWBERRY_PROFILE_TYPE: string = "strawberry";

describe("Command Profiles", () => {
    it("should should allow us to create an instance", () => {
        let caughtError;
        try {
            const profiles = new CommandProfiles(new Map<string, IProfile[]>());
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
    });

    it("should detect missing parameters", () => {
        let error;
        try {
            const profiles = new CommandProfiles(undefined);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect that the parameters are not a map", () => {
        let error;
        try {
            const map = { not: "a-map" };
            new CommandProfiles(map as any);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should accept a profile map and allow us to retrieve them", () => {
        const map = new Map<string, IProfile[]>();
        map.set(BANANA_PROFILE_TYPE, [{
            name: "tasty",
            type: BANANA_PROFILE_TYPE,
            age: 1
        }]);
        map.set(STRAWBERRY_PROFILE_TYPE, [{
            name: "great",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 1
        }, {
            name: "awesome",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 2
        }]);
        const profiles = new CommandProfiles(map);
        expect(profiles.getAll(BANANA_PROFILE_TYPE)).toMatchSnapshot();
        expect(profiles.getAll(STRAWBERRY_PROFILE_TYPE)).toMatchSnapshot();
        expect(profiles.get(STRAWBERRY_PROFILE_TYPE)).toMatchSnapshot();
        expect(profiles.get(BANANA_PROFILE_TYPE)).toMatchSnapshot();
    });

    it("should throw an error if get does not have the profile type in the map", () => {
        const map = new Map<string, IProfile[]>();
        map.set(BANANA_PROFILE_TYPE, [{
            name: "tasty",
            type: BANANA_PROFILE_TYPE,
            age: 1
        }]);
        let error;
        try {
            const profiles = new CommandProfiles(map);
            profiles.get(STRAWBERRY_PROFILE_TYPE);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
        expect(error.additionalDetails).toMatchSnapshot();
    });

    it("should not throw an error if get does not have the profile type but throw not found is false", () => {
        const map = new Map<string, IProfile[]>();
        map.set(BANANA_PROFILE_TYPE, [{
            name: "tasty",
            type: BANANA_PROFILE_TYPE,
            age: 1
        }]);
        let error;
        let response;
        try {
            const profiles = new CommandProfiles(map);
            response = profiles.get(STRAWBERRY_PROFILE_TYPE, false);
        } catch (e) {
            error = e;
        }
        expect(error).toBeUndefined();
        expect(response).toBeUndefined();
    });

    it("should accept a profile map and allow us to retrieve by name", () => {
        const map = new Map<string, IProfile[]>();
        map.set(STRAWBERRY_PROFILE_TYPE, [{
            name: "great",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 1
        }, {
            name: "awesome",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 2
        }]);
        const profiles = new CommandProfiles(map);
        const awesome = profiles.get(STRAWBERRY_PROFILE_TYPE, true, "awesome");
        expect(awesome).toMatchSnapshot();
    });

    it("should accept a loaded profile map and allow us to retrieve by name", () => {
        const map = new Map<string, IProfile[]>();
        map.set(STRAWBERRY_PROFILE_TYPE, [{
            name: "great",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 1
        }, {
            name: "awesome",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 2
        }]);
        const metaMap = new Map<string, IProfileLoaded[]>();
        metaMap.set(STRAWBERRY_PROFILE_TYPE, [{
            name: "great",
            type: STRAWBERRY_PROFILE_TYPE,
            profile: {
                age: 1
            },
            message: "just right",
            failNotFound: false
        },
        {
            name: "gross",
            type: STRAWBERRY_PROFILE_TYPE,
            profile: {
                age: 3
            },
            message: "too old",
            failNotFound: false
        }]);
        const profiles = new CommandProfiles(map, metaMap);
        const awesome = profiles.getMeta(STRAWBERRY_PROFILE_TYPE, false, "great");
        expect(awesome).toMatchSnapshot();
    });

    it("should accept a loaded profile map and allow us to retrieve without a name", () => {
        const map = new Map<string, IProfile[]>();
        map.set(STRAWBERRY_PROFILE_TYPE, [{
            name: "great",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 1
        }, {
            name: "awesome",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 2
        }]);
        const metaMap = new Map<string, IProfileLoaded[]>();
        metaMap.set(STRAWBERRY_PROFILE_TYPE, [{
            name: "great",
            type: STRAWBERRY_PROFILE_TYPE,
            profile: {
                age: 1
            },
            message: "just right",
            failNotFound: false
        },
        {
            name: "gross",
            type: STRAWBERRY_PROFILE_TYPE,
            profile: {
                age: 3
            },
            message: "too old",
            failNotFound: false
        }]);
        const profiles = new CommandProfiles(map, metaMap);
        const awesome = profiles.getMeta(STRAWBERRY_PROFILE_TYPE, false, null);
        expect(awesome).toMatchSnapshot();
    });

    it("should accept a loaded profile map and allow us to retrieve with a name and fail", () => {
        const map = new Map<string, IProfile[]>();
        map.set(STRAWBERRY_PROFILE_TYPE, [{
            name: "great",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 1
        }, {
            name: "awesome",
            type: STRAWBERRY_PROFILE_TYPE,
            age: 2
        }]);
        const metaMap = new Map<string, IProfileLoaded[]>();
        metaMap.set(STRAWBERRY_PROFILE_TYPE, [{
            name: "great",
            type: STRAWBERRY_PROFILE_TYPE,
            profile: {
                age: 1
            },
            message: "just right",
            failNotFound: true
        },
        {
            name: "gross",
            type: STRAWBERRY_PROFILE_TYPE,
            profile: {
                age: 3
            },
            message: "too old",
            failNotFound: true
        }]);
        const profiles = new CommandProfiles(map, metaMap);

        let err;
        try {
            const awesome = profiles.getMeta("unknown", true, "tasty");
        } catch (thrownError) {
            err = thrownError;
        }
        expect(err.message).toMatchSnapshot();
    });
});
