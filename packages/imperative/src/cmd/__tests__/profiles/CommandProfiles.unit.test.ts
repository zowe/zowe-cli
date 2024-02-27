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

    it("should allow us to create an instance with map values", () => {
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
        expect(profiles).toMatchSnapshot();
    });

    it("should detect missing parameters", () => {
        let error;
        try {
            new CommandProfiles(undefined);
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
});
