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

import { IHandlerParameters, ImperativeConfig, ImperativeError } from "@zowe/imperative";
import TargetProfileHandler from "../../../../../src/zosfiles/copy/dsclp/TargetProfile.handler";
import { DsclpDefinition } from "../../../../../src/zosfiles/copy/dsclp/Dsclp.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["files", "copy", "data-set-cross-lpar"],
    definition: DsclpDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("TargetProfileHandler", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should merge properties from v2 profiles and command arguments", async () => {
        const commandParameters = {
            ...DEFAULT_PARAMETERS,
            arguments: {
                ...DEFAULT_PARAMETERS.arguments,
                host: "example1.com",
                user: "user1",
                password: "password1",
                targetUser: "user2",
                targetPassword: "password3",
                targetZosmfProfile: "target_zosmf"
            }
        };

        commandParameters.response.data.setObj = jest.fn();
        const getProfileMock = jest.fn().mockReturnValue({
            password: "password2",
            port: 123
        });
        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                api: {
                    layers: { get: jest.fn() },
                    profiles: { get: getProfileMock },
                    secure: { secureFields: jest.fn().mockReturnValue([]) }
                },
                exists: true
            },
            envVariablePrefix: "ZOWE",
            loadedConfig: {}
        } as any);

        const handler = new TargetProfileHandler();
        await handler.process(commandParameters);

        expect(getProfileMock).toHaveBeenCalledTimes(1);
        expect(commandParameters.response.data.setObj).toHaveBeenCalledWith({
            apiResponse: {
                sessCfg: expect.objectContaining({
                    hostname: "example1.com",
                    port: 123,
                    user: "user2",
                    password: "password3"
                })
            },
            success: true
        });
    });

    it("should merge properties from v1 profiles and command arguments", async () => {
        const commandParameters = {
            ...DEFAULT_PARAMETERS,
            arguments: {
                ...DEFAULT_PARAMETERS.arguments,
                host: "example1.com",
                user: "user1",
                password: "password1",
                targetUser: "user2",
                targetPassword: "password3",
                targetZosmfProfile: "target_zosmf"
            }
        };

        commandParameters.response.data.setObj = jest.fn();
        const getProfileMock = jest.fn().mockReturnValue({
            password: "password2",
            port: 123
        });
        commandParameters.profiles.get = getProfileMock;
        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: { exists: false }
        } as any);

        const handler = new TargetProfileHandler();
        await handler.process(commandParameters);

        expect(getProfileMock).toHaveBeenCalledTimes(1);
        expect(commandParameters.response.data.setObj).toHaveBeenCalledWith({
            apiResponse: {
                sessCfg: expect.objectContaining({
                    hostname: "example1.com",
                    port: 123,
                    user: "user2",
                    password: "password3"
                })
            },
            success: true
        });
    });

    it("should handle error loading target z/OSMF profile", async () => {
        const commandParameters = {
            ...DEFAULT_PARAMETERS,
            arguments: {
                ...DEFAULT_PARAMETERS.arguments,
                targetZosmfProfile: "target_zosmf"
            }
        };
        const testError = new Error("ConfigProfiles.get failed");

        const getProfileMock = jest.fn().mockImplementation(() => {
            throw testError;
        });
        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                api: {
                    profiles: { get: getProfileMock }
                },
                exists: true
            }
        } as any);

        const handler = new TargetProfileHandler();
        let caughtError: any;
        try {
            await handler.process(commandParameters);
        } catch (error) {
            caughtError = error;
        }

        expect(getProfileMock).toHaveBeenCalledTimes(1);
        expect(caughtError).toBeInstanceOf(ImperativeError);
        expect(caughtError.message).toContain(testError.message);
    });
});
