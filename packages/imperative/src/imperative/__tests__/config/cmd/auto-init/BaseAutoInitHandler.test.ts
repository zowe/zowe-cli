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

import { IHandlerParameters } from "../../../../../cmd";
import { ImperativeConfig, ProcessUtils } from "../../../../../utilities";
import { FakeAutoInitHandler } from "./__data__/FakeAutoInitHandler";
import * as lodash from "lodash";
import * as jestDiff from "jest-diff";
import stripAnsi = require("strip-ansi");
import { ConfigSchema } from "../../../../../config";
import { CredentialManagerFactory } from "../../../../../security";
import { SessConstants, Session } from "../../../../../rest";
import { OverridesLoader } from "../../../../src/OverridesLoader";

jest.mock("strip-ansi");

const mockParams: IHandlerParameters = {
    response: {
        console: {
            log: jest.fn()
        },
        data: {
            setObj: jest.fn()
        }
    },
    arguments: {},  // To be defined by individual tests
    positionals: ["config", "auto-init"],
    profiles: {
        getMeta: jest.fn(() => ({
            name: "fakeName"
        }))
    }
} as any;

describe("BaseAutoInitHandler", () => {
    const ensureCredMgrSpy = jest.spyOn(OverridesLoader, "ensureCredentialManagerLoaded");
    let mockConfigApi: any;
    let stripAnsiSpy: any;

    beforeEach( async () => {
        jest.resetAllMocks();
        Object.defineProperty(CredentialManagerFactory, "initialized", { get: () => true });
        mockConfigApi = {
            layers: {
                activate: jest.fn(),
                merge: jest.fn(),
                write: jest.fn(),
                get: jest.fn().mockReturnValue({
                    exists: true,
                    properties: {}
                }),
                set: jest.fn()
            }
        };
        stripAnsiSpy = (stripAnsi as any).mockImplementation(() => jest.requireActual("strip-ansi"));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call init with basic authentication", async () => {
        const handler = new FakeAutoInitHandler();
        const params: IHandlerParameters = {
            ...mockParams,
            arguments: {
                user: "fakeUser",
                password: "fakePass"
            },
        } as any;

        const doInitSpy = jest.spyOn(handler as any, "doAutoInit").mockImplementation(() => {
            expect(mockConfigApi.layers.activate).toHaveBeenCalledTimes(1);
        });
        const processAutoInitSpy = jest.spyOn(handler as any, "processAutoInit");
        const createSessCfgFromArgsSpy = jest.spyOn(handler as any, "createSessCfgFromArgs");
        const mockSave = jest.fn();
        const mockSetSchema = jest.fn();
        const buildSchemaSpy = jest.spyOn(ConfigSchema, "buildSchema").mockImplementation();
        const displayAutoInitChangesSpy = jest.spyOn(handler as any, "displayAutoInitChanges");
        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                api: mockConfigApi,
                save: mockSave,
                setSchema: mockSetSchema
            },
            loadedConfig: {
                profiles: []
            }
        } as any);

        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doInitSpy).toBeCalledTimes(1);
        expect(processAutoInitSpy).toBeCalledTimes(1);
        expect(createSessCfgFromArgsSpy).toBeCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.write).toHaveBeenCalledTimes(0);
        expect(mockConfigApi.layers.get).toHaveBeenCalledTimes(1);
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(buildSchemaSpy).toHaveBeenCalledTimes(1);
        expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
        expect(mockSetSchema).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledWith(undefined);
        expect(displayAutoInitChangesSpy).toHaveBeenCalledTimes(1);
    });

    it("should call init with token", async () => {
        const handler = new FakeAutoInitHandler();
        handler.createSessCfgFromArgs = jest.fn().mockReturnValue({
            hostname: "fakeHost", port: 3000, tokenValue: "fake"
        });
        const params: IHandlerParameters = {
            ...mockParams,
            arguments: {
                tokenType: "fake",
                tokenValue: "fake",
                user: "toBeDeleted",
                password: "toBeDeleted",
                cert: "toBeDeleted",
                certKey: "toBeDeleted"
            }
        } as any;

        const doInitSpy = jest.spyOn(handler as any, "doAutoInit").mockImplementation(() => {
            expect(mockConfigApi.layers.activate).toHaveBeenCalledTimes(1);
        });
        const processAutoInitSpy = jest.spyOn(handler as any, "processAutoInit");
        const createSessCfgFromArgsSpy = jest.spyOn(handler as any, "createSessCfgFromArgs");
        const mockSave = jest.fn();
        const mockSetSchema = jest.fn();
        const buildSchemaSpy = jest.spyOn(ConfigSchema, "buildSchema").mockImplementation();
        const displayAutoInitChangesSpy = jest.spyOn(handler as any, "displayAutoInitChanges");

        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                api: mockConfigApi,
                save: mockSave,
                setSchema: mockSetSchema
            },
            loadedConfig: {
                profiles: []
            }
        } as any);
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        const mSession: Session = doInitSpy.mock.calls[0][0] as any;

        expect(caughtError).toBeUndefined();
        expect(doInitSpy).toBeCalledTimes(1);
        expect(mSession.ISession.user).toBeUndefined();
        expect(mSession.ISession.password).toBeUndefined();
        expect(mSession.ISession.base64EncodedAuth).toBeUndefined();
        expect(mSession.ISession.cert).toBeUndefined();
        expect(mSession.ISession.certKey).toBeUndefined();
        expect(processAutoInitSpy).toBeCalledTimes(1);
        expect(createSessCfgFromArgsSpy).toBeCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.write).toHaveBeenCalledTimes(0);
        expect(mockConfigApi.layers.get).toHaveBeenCalledTimes(1);
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(buildSchemaSpy).toHaveBeenCalledTimes(1);
        expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
        expect(mockSetSchema).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledWith(undefined);
        expect(displayAutoInitChangesSpy).toHaveBeenCalledTimes(1);
    });

    it("should process login successfully without creating profile on timeout", async () => {
        const handler = new FakeAutoInitHandler();
        const promptFunction = jest.fn().mockReturnValue("fake");

        const params: IHandlerParameters = { ...mockParams };
        params.response.console.prompt = promptFunction;

        const doInitSpy = jest.spyOn(handler as any, "doAutoInit").mockImplementation(() => {
            expect(mockConfigApi.layers.activate).toHaveBeenCalledTimes(1);
        });
        const processAutoInitSpy = jest.spyOn(handler as any, "processAutoInit");
        const createSessCfgFromArgsSpy = jest.spyOn(handler as any, "createSessCfgFromArgs");
        const mockSave = jest.fn();
        const mockSetSchema = jest.fn();
        const buildSchemaSpy = jest.spyOn(ConfigSchema, "buildSchema").mockImplementation();
        const displayAutoInitChangesSpy = jest.spyOn(handler as any, "displayAutoInitChanges");

        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                api: mockConfigApi,
                save: mockSave,
                setSchema: mockSetSchema
            },
            loadedConfig: {
                profiles: []
            }
        } as any);

        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doInitSpy).toBeCalledTimes(1);
        expect(processAutoInitSpy).toBeCalledTimes(1);
        expect(createSessCfgFromArgsSpy).toBeCalledTimes(1);
        expect(promptFunction).toHaveBeenCalledTimes(2);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.write).toHaveBeenCalledTimes(0);
        expect(mockConfigApi.layers.get).toHaveBeenCalledTimes(1);
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(buildSchemaSpy).toHaveBeenCalledTimes(1);
        expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
        expect(mockSetSchema).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledWith(undefined);
        expect(displayAutoInitChangesSpy).toHaveBeenCalledTimes(1);
    });

    it("should call init and do a dry run with output", async () => {
        const handler = new FakeAutoInitHandler();
        const params: IHandlerParameters = {
            ...mockParams,
            arguments: {
                user: "fakeUser",
                password: "fakePass",
                dryRun: true
            }
        } as any;

        const doInitSpy = jest.spyOn(handler as any, "doAutoInit").mockImplementation(() => {
            expect(mockConfigApi.layers.activate).toHaveBeenCalledTimes(1);
        });
        const processAutoInitSpy = jest.spyOn(handler as any, "processAutoInit");
        const createSessCfgFromArgsSpy = jest.spyOn(handler as any, "createSessCfgFromArgs");
        mockConfigApi.layers.merge.mockReturnValue({
            exists: true,
            properties: {}
        });
        const mockSave = jest.fn();
        const mockSecureFields = jest.fn().mockReturnValue([]);
        const mockFindSecure = jest.fn().mockReturnValue([]);
        const displayAutoInitChangesSpy = jest.spyOn(handler as any, "displayAutoInitChanges");
        const mockImperativeConfigApi = {
            ...mockConfigApi,
            secure: {
                secureFields: mockSecureFields,
                findSecure: mockFindSecure
            }
        };
        const diffSpy = jest.spyOn(jestDiff, "diff");
        const editFileSpy = jest.spyOn(ProcessUtils, "openInEditor");

        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                api: mockImperativeConfigApi,
                save: mockSave
            }
        } as any);
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doInitSpy).toBeCalledTimes(1);
        expect(processAutoInitSpy).toBeCalledTimes(1);
        expect(createSessCfgFromArgsSpy).toBeCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.write).toHaveBeenCalledTimes(0);
        expect(mockSave).toHaveBeenCalledTimes(0);
        expect(mockSecureFields).toHaveBeenCalledTimes(1);
        expect(mockFindSecure).toHaveBeenCalledTimes(1);
        expect(diffSpy).toHaveBeenCalledTimes(1);
        expect(stripAnsiSpy).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledWith(undefined, true);
        expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
        expect(editFileSpy).toHaveBeenCalledTimes(0);
        expect(displayAutoInitChangesSpy).toHaveBeenCalledTimes(0);
    });

    it("should call init and do edit", async () => {
        const handler = new FakeAutoInitHandler();
        const params: IHandlerParameters = {
            ...mockParams,
            arguments: {
                user: "fakeUser",
                password: "fakePass",
                edit: true
            }
        } as any;

        const doInitSpy = jest.spyOn(handler as any, "doAutoInit").mockImplementation(() => {
            expect(mockConfigApi.layers.activate).toHaveBeenCalledTimes(1);
        });
        const processAutoInitSpy = jest.spyOn(handler as any, "processAutoInit");
        const createSessCfgFromArgsSpy = jest.spyOn(handler as any, "createSessCfgFromArgs");
        const mockSave = jest.fn();
        const mockSetSchema = jest.fn();
        const displayAutoInitChangesSpy = jest.spyOn(handler as any, "displayAutoInitChanges");
        const editFileSpy = jest.spyOn(ProcessUtils, "openInEditor").mockResolvedValueOnce();

        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                api: mockConfigApi,
                save: mockSave,
                setSchema: mockSetSchema
            },
            loadedConfig: {
                profiles: []
            }
        } as any);

        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doInitSpy).toBeCalledTimes(1);
        expect(processAutoInitSpy).toBeCalledTimes(1);
        expect(createSessCfgFromArgsSpy).toBeCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.write).toHaveBeenCalledTimes(0);
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.get).toHaveBeenCalledTimes(2);
        expect(mockSetSchema).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.set).toHaveBeenCalledTimes(0);
        expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
        expect(editFileSpy).toHaveBeenCalledTimes(1);
        expect(displayAutoInitChangesSpy).toHaveBeenCalledTimes(1);
    });

    it("should call init and do overwrite", async () => {
        const handler = new FakeAutoInitHandler();
        const params: IHandlerParameters = {
            ...mockParams,
            arguments: {
                user: "fakeUser",
                password: "fakePass",
                overwrite: true,
                forSure: true
            }
        } as any;

        const doInitSpy = jest.spyOn(handler as any, "doAutoInit").mockImplementation(() => {
            expect(mockConfigApi.layers.activate).toHaveBeenCalledTimes(1);
        });
        const processAutoInitSpy = jest.spyOn(handler as any, "processAutoInit");
        const createSessCfgFromArgsSpy = jest.spyOn(handler as any, "createSessCfgFromArgs");
        const mockSave = jest.fn();
        const mockSetSchema = jest.fn();
        const displayAutoInitChangesSpy = jest.spyOn(handler as any, "displayAutoInitChanges");

        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                api: mockConfigApi,
                save: mockSave,
                setSchema: mockSetSchema
            },
            loadedConfig: {
                profiles: []
            }
        } as any);

        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doInitSpy).toBeCalledTimes(1);
        expect(processAutoInitSpy).toBeCalledTimes(1);
        expect(createSessCfgFromArgsSpy).toBeCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledTimes(0);
        expect(mockConfigApi.layers.write).toHaveBeenCalledTimes(0);
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.get).toHaveBeenCalledTimes(0);
        expect(mockSetSchema).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.set).toHaveBeenCalledTimes(1);
        expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
        expect(displayAutoInitChangesSpy).toHaveBeenCalledTimes(1);
    });

    it("should call init and do a dry run and hide output", async () => {
        const handler = new FakeAutoInitHandler();
        const params: IHandlerParameters = {
            ...mockParams,
            arguments: {
                user: "fakeUser",
                password: "fakePass",
                dryRun: true
            }
        } as any;

        const doInitSpy = jest.spyOn(handler as any, "doAutoInit").mockImplementation(() => {
            expect(mockConfigApi.layers.activate).toHaveBeenCalledTimes(1);
        });
        const processAutoInitSpy = jest.spyOn(handler as any, "processAutoInit");
        const createSessCfgFromArgsSpy = jest.spyOn(handler as any, "createSessCfgFromArgs");
        mockConfigApi.layers.merge.mockReturnValue({
            exists: true,
            properties: {}
        });
        mockConfigApi.layers.get.mockReturnValue({
            exists: true,
            properties: {
                profiles: {
                    "base": {
                        properties: {
                            tokenType: SessConstants.TOKEN_TYPE_JWT,
                            tokenValue: "fakeToken"
                        },
                        secure: ["tokenValue"]
                    }
                }
            }
        });
        const mockSave = jest.fn();
        const mockSecureFields = jest.fn().mockReturnValue(["profiles.base.properties.tokenValue"]);
        const mockFindSecure = jest.fn().mockReturnValue([]);
        const displayAutoInitChangesSpy = jest.spyOn(handler as any, "displayAutoInitChanges");
        const mockImperativeConfigApi = {
            ...mockConfigApi,
            secure: {
                secureFields: mockSecureFields,
                findSecure: mockFindSecure
            }
        };
        const diffSpy = jest.spyOn(jestDiff, "diff");
        const unsetSpy = jest.spyOn(lodash, "unset");

        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                api: mockImperativeConfigApi,
                save: mockSave
            }
        } as any);
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doInitSpy).toBeCalledTimes(1);
        expect(processAutoInitSpy).toBeCalledTimes(1);
        expect(createSessCfgFromArgsSpy).toBeCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.write).toHaveBeenCalledTimes(0);
        expect(mockSave).toHaveBeenCalledTimes(0);
        expect(mockSecureFields).toHaveBeenCalledTimes(1);
        expect(mockFindSecure).toHaveBeenCalledTimes(1);
        expect(diffSpy).toHaveBeenCalledTimes(1);
        expect(stripAnsiSpy).toHaveBeenCalledTimes(1);
        expect(unsetSpy).toHaveBeenCalledTimes(1);
        expect(mockConfigApi.layers.merge).toHaveBeenCalledWith(undefined, true);
        expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
        expect(displayAutoInitChangesSpy).toHaveBeenCalledTimes(0);
    });
});
