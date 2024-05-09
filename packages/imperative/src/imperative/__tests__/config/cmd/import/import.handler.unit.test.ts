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

import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import * as JSONC from "comment-json";
import * as lodash from "lodash";
import ImportHandler from "../../../../src/config/cmd/import/import.handler";
import { IHandlerParameters } from "../../../../../cmd";
import { Config, ConfigConstants, IConfig } from "../../../../../config";
import { ISession, RestClient } from "../../../../../rest";
import { ImperativeConfig } from "../../../../..";
import { expectedConfigObject, expectedSchemaObject } from
    "../../../../../../__tests__/__integration__/imperative/__tests__/__integration__/cli/config/__resources__/expectedObjects";
import { NextVerFeatures } from "../../../../../utilities";

jest.mock("fs");

const expectedConfigText = JSONC.stringify(expectedConfigObject, null, ConfigConstants.INDENT);
const expectedConfigObjectWithoutSchema = lodash.omit(expectedConfigObject, "$schema");
const expectedConfigTextWithoutSchema = JSONC.stringify(expectedConfigObjectWithoutSchema, null, ConfigConstants.INDENT);
const expectedSchemaText = JSONC.stringify(expectedSchemaObject, null, ConfigConstants.INDENT);

const getIHandlerParametersObject = (): IHandlerParameters => {
    const x: any = {
        response: {
            data: {
                setMessage: jest.fn((setMsgArgs) => {
                    // Nothing
                }),
                setObj: jest.fn((setObjArgs) => {
                    // Nothing
                })
            },
            console: {
                log: jest.fn((logs) => {
                    // Nothing
                }),
                error: jest.fn((errors) => {
                    // Nothing
                }),
                errorHeader: jest.fn(() => undefined)
            }
        },
        arguments: {
            globalConfig: false,
            userConfig: false
        },
    };
    return x as IHandlerParameters;
};

describe("Configuration Import command handler", () => {
    beforeEach(() => {
        /* This avoids having to mock ImperativeConfig.envVariablePrefix.
         * Unless overridden, tests will use our legacy format for errors.
         */
        jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(false);
    });

    describe("handler", () => {
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync");
        const writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        const downloadSchemaSpy = jest.spyOn(ImportHandler.prototype as any, "downloadSchema");
        const fetchConfigSpy = jest.spyOn(ImportHandler.prototype as any, "fetchConfig");
        let teamConfig: Config;

        beforeAll(() => {
            jest.spyOn(ImperativeConfig.instance, "config", "get").mockImplementation(() => teamConfig);
        });

        beforeEach(async () => {
            teamConfig = await Config.load("fakeapp");
            jest.spyOn(process, "cwd").mockReturnValueOnce(undefined);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        afterAll(() => {
            jest.restoreAllMocks();
        });

        it("should import config from local file", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            readFileSyncSpy.mockReturnValueOnce(expectedConfigTextWithoutSchema);
            writeFileSyncSpy.mockReturnValueOnce();

            const params: IHandlerParameters = getIHandlerParametersObject();
            params.arguments.location = __dirname + "/fakeapp.config.json";
            await new ImportHandler().process(params);

            expect(readFileSyncSpy).toHaveBeenCalled();
            expect(fetchConfigSpy).not.toHaveBeenCalled();
            expect(downloadSchemaSpy).not.toHaveBeenCalled();
            expect(writeFileSyncSpy).toHaveBeenCalledWith(path.join(process.cwd(), "fakeapp.config.json"),
                expectedConfigTextWithoutSchema);
        });

        it("should import config with schema from local file", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            readFileSyncSpy.mockReturnValueOnce(expectedConfigText);
            writeFileSyncSpy.mockReturnValueOnce();

            const params: IHandlerParameters = getIHandlerParametersObject();
            params.arguments.location = __dirname + "/fakeapp.config.json";
            await new ImportHandler().process(params);

            expect(readFileSyncSpy).toHaveBeenCalled();
            expect(fetchConfigSpy).not.toHaveBeenCalled();
            expect(downloadSchemaSpy).toHaveBeenCalled();
            expect(writeFileSyncSpy).toHaveBeenCalledWith(path.join(process.cwd(), "fakeapp.config.json"),
                expectedConfigText);
        });

        it("should import config from web address", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
            writeFileSyncSpy.mockReturnValueOnce();
            fetchConfigSpy.mockResolvedValueOnce(expectedConfigObjectWithoutSchema);

            const params: IHandlerParameters = getIHandlerParametersObject();
            params.arguments.location = "http://example.com/downloads/fakeapp.config.json";
            await new ImportHandler().process(params);

            expect(fetchConfigSpy).toHaveBeenCalled();
            expect(downloadSchemaSpy).not.toHaveBeenCalled();
            expect(writeFileSyncSpy).toHaveBeenCalledWith(path.join(process.cwd(), "fakeapp.config.json"),
                expectedConfigTextWithoutSchema);
        });

        it("should import config with schema from web address", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
            writeFileSyncSpy.mockReturnValueOnce();
            fetchConfigSpy.mockResolvedValueOnce(expectedConfigObject);

            const params: IHandlerParameters = getIHandlerParametersObject();
            params.arguments.location = "http://example.com/downloads/fakeapp.config.json";
            await new ImportHandler().process(params);

            expect(fetchConfigSpy).toHaveBeenCalled();
            expect(downloadSchemaSpy).toHaveBeenCalled();
            expect(writeFileSyncSpy).toHaveBeenCalledWith(path.join(process.cwd(), "fakeapp.config.json"),
                expectedConfigText);
        });

        it("should import config from web address and override session properties", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
            writeFileSyncSpy.mockReturnValueOnce();
            const restClientSpy = jest.spyOn(RestClient, "getExpectString").mockResolvedValueOnce("{}");

            const params: IHandlerParameters = getIHandlerParametersObject();
            params.arguments = {
                ...params.arguments,
                location: "http://example.com/downloads/fakeapp.config.json",
                user: "fakeUser",
                password: "fakePass",
                rejectUnauthorized: false
            };
            await new ImportHandler().process(params);

            const expectedSession: ISession = {
                hostname: "example.com",
                rejectUnauthorized: false,
                type: "basic",
                user: "fakeUser",
                password: "fakePass",
                base64EncodedAuth: Buffer.from("fakeUser:fakePass").toString("base64")
            };
            expect(restClientSpy.mock.calls[0][0].ISession).toMatchObject(expectedSession);
            expect(downloadSchemaSpy).not.toHaveBeenCalled();
            expect(writeFileSyncSpy).toHaveBeenCalled();
        });

        it("should not import config that already exists", async () => {
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

            const params: IHandlerParameters = getIHandlerParametersObject();
            params.arguments.location = __dirname + "/fakeapp.config.json";
            teamConfig.layerActive().exists = true;
            await new ImportHandler().process(params);

            expect(readFileSyncSpy).not.toHaveBeenCalled();
            expect(writeFileSyncSpy).not.toHaveBeenCalled();
        });
    });

    describe("fetch config", () => {
        const configUrl = "http://example.com/downloads/fakeapp.config.json";
        const fetchConfig = (ImportHandler.prototype as any).fetchConfig.bind({
            buildSession: jest.fn()
        });

        it("should successfully fetch config file that is valid JSON", async () => {
            jest.spyOn(RestClient, "getExpectString").mockResolvedValueOnce(expectedConfigText);
            const config: IConfig = await fetchConfig(new URL(configUrl));

            expect(config.profiles).toBeDefined();
            expect(config.defaults).toBeDefined();
            expect(config).toMatchObject(expectedConfigObject);
        });

        it("should throw error when config file is not valid JSON", async () => {
            jest.spyOn(RestClient, "getExpectString").mockResolvedValueOnce("invalid JSON");
            let config: IConfig;
            let error: any;
            try {
                config = await fetchConfig(new URL(configUrl));
            } catch (err) {
                error = err;
            }

            expect(config).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain("URL must point to a valid JSON file");
            expect(error.message).toContain("Unexpected token");
        });

        it("should throw error when REST client fails to fetch config file", async () => {
            jest.spyOn(RestClient, "getExpectString").mockRejectedValueOnce(new Error("invalid URL"));
            let config: IConfig;
            let error: any;
            try {
                config = await fetchConfig(new URL(configUrl));
            } catch (err) {
                error = err;
            }

            expect(config).toBeUndefined();
            expect(error).toBeDefined();
            expect(error.message).toContain("invalid URL");
        });
    });

    describe("download schema", () => {
        const schemaSrcPath = __dirname + "/fakeapp.schema1.json";
        const schemaDestPath = __dirname + "/fakeapp.schema2.json";
        const schemaUrl = "http://example.com/downloads/fakeapp.schema.json";
        const downloadSchema = (ImportHandler.prototype as any).downloadSchema.bind({
            buildSession: jest.fn()
        });

        it("should be able to copy the schema file from a local file", async () => {
            jest.spyOn(fs, "copyFileSync").mockReturnValueOnce();
            await downloadSchema(url.pathToFileURL(schemaSrcPath), schemaDestPath);

            expect(fs.copyFileSync).toHaveBeenCalledTimes(1);
        });

        it("should be able to download the schema file from a web address", async () => {
            jest.spyOn(RestClient, "getExpectString").mockResolvedValueOnce(expectedSchemaText);
            jest.spyOn(fs, "writeFileSync").mockReturnValueOnce();
            await downloadSchema(new URL(schemaUrl), schemaDestPath);

            expect(fs.writeFileSync).toHaveBeenCalledWith(schemaDestPath, expectedSchemaText);
        });

        it("should throw error when schema file is not valid JSON", async () => {
            jest.spyOn(RestClient, "getExpectString").mockResolvedValueOnce("invalid JSON");
            let error: any;
            try {
                await downloadSchema(new URL(schemaUrl), schemaDestPath);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain("URL must point to a valid JSON file");
            expect(error.message).toContain("Unexpected token");
        });

        it("should throw error when REST client fails to fetch schema file", async () => {
            jest.spyOn(RestClient, "getExpectString").mockRejectedValueOnce(new Error("invalid URL"));
            let error;
            try {
                await downloadSchema(new URL(schemaUrl), schemaDestPath);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain("invalid URL");
        });
    });
});
