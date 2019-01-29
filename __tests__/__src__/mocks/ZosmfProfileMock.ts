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

import { IProfile, CommandProfiles, IHandlerResponseApi } from "@brightside/imperative";
// Some test constants that are needed by multiple packages for unit tests

// Mocked profile options to be added to args
export const UNIT_TEST_ZOSMF_PROF_OPTS = {
    host: "somewhere.com",
    port: "43443",
    user: "someone",
    password: "somesecret"
};

export const UNIT_TEST_TSO_PROF_OPTS = {
    password: "fake",
    account: "fake"
};

// A mocked profile map with zosmf profile
export const UNIT_TEST_PROFILE_MAP = new Map<string, IProfile[]>();
UNIT_TEST_PROFILE_MAP.set(
    "zosmf", [{
        name: "zosmf",
        type: "zosmf",
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    }]
);
export const UNIT_TEST_PROFILES_ZOSMF: CommandProfiles = new CommandProfiles(UNIT_TEST_PROFILE_MAP);

// A mocked profile map with both
export const UNIT_TEST_PROFILE_MAP_ZOSMF_TSO = new Map<string, IProfile[]>();
UNIT_TEST_PROFILE_MAP_ZOSMF_TSO.set(
    "zosmf", [{
        name: "zosmf",
        type: "zosmf",
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    }]
);
UNIT_TEST_PROFILE_MAP_ZOSMF_TSO.set(
    "tso", [{
        name: "tso",
        type: "tso",
        ...UNIT_TEST_TSO_PROF_OPTS
    }]
);
export const UNIT_TEST_PROFILES_ZOSMF_TSO: CommandProfiles = new CommandProfiles(UNIT_TEST_PROFILE_MAP_ZOSMF_TSO);

/**
 * Returns a jest.fn mocked version of the handler arguments
 * @returns {IHandlerResponseApi}
 */
export function getMockedResponse(): IHandlerResponseApi {
    return {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                expect(setMsgArgs).toMatchSnapshot();
            }),
            setObj: jest.fn((setObjArgs) => {
                expect(setObjArgs).toMatchSnapshot();
            })
        },
        console: {
            log: jest.fn((logs) => {
                expect(logs.toString()).toMatchSnapshot();
            }),
            error: jest.fn((errors) => {
                expect(errors.toString()).toMatchSnapshot();
            }),
            errorHeader: jest.fn(() => undefined)
        },
        progress: {
            startBar: jest.fn((parms) => undefined),
            endBar: jest.fn(() => undefined)
        },
        format: {
            output: jest.fn((parms) => {
                expect(parms).toMatchSnapshot();
            })
        }
    };
}
