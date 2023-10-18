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

/* eslint-disable jest/expect-expect */
import Mock = jest.Mock;

jest.mock("cross-spawn");
jest.mock("jsonfile");
jest.mock("../../../../src/plugins/utilities/npm-interface/install");
jest.mock("../../../../src/plugins/utilities/runValidatePlugin");
jest.mock("../../../../src/plugins/utilities/PMFConstants");
jest.mock("../../../../../cmd/src/response/CommandResponse");
jest.mock("../../../../../cmd/src/response/HandlerResponse");
jest.mock("../../../../../cmd/src/doc/handler/IHandlerParameters");
jest.mock("../../../../../logger");
jest.mock("../../../../src/Imperative");
jest.mock("../../../../src/plugins/utilities/NpmFunctions");
jest.doMock("path", () => {
    const originalPath = jest.requireActual("path");
    return {
        ...originalPath,
        resolve: (...path: string[]) => {
            if (path[0] == expectedVal) {
                return returnedVal ? returnedVal : expectedVal;
            } else {
                return originalPath.resolve(...path);
            }
        }
    };
});

import { HandlerResponse, IHandlerParameters } from "../../../../../cmd";
import { Console } from "../../../../../console";
import { ImperativeError } from "../../../../../error";
import { install } from "../../../../src/plugins/utilities/npm-interface";
import { runValidatePlugin } from "../../../../src/plugins/utilities/runValidatePlugin";
import InstallHandler from "../../../../src/plugins/cmd/install/install.handler";
import { IPluginJson } from "../../../../src/plugins/doc/IPluginJson";
import { Logger } from "../../../../../logger";
import { readFileSync, writeFileSync } from "jsonfile";
import { PMFConstants } from "../../../../src/plugins/utilities/PMFConstants";
import { TextUtils } from "../../../../../utilities";
import { getRegistry, npmLogin } from "../../../../src/plugins/utilities/NpmFunctions";
import * as spawn from "cross-spawn";
import { HandlerResponse, IHandlerParameters } from "../../../../../cmd";

let expectedVal: unknown;
let returnedVal: unknown;

describe("Plugin Management Facility install handler", () => {

    // Objects created so types are correct.
    const mocks = {
        npmLogin: npmLogin as Mock<typeof npmLogin>,
        getRegistry: getRegistry as unknown as Mock<typeof getRegistry>,
        readFileSync: readFileSync as Mock<typeof readFileSync>,
        writeFileSync: writeFileSync as Mock<typeof writeFileSync>,
        install: install as unknown as Mock<typeof install>,
        runValidatePlugin: runValidatePlugin as unknown as Mock<typeof runValidatePlugin>
    };

    // two plugin set of values
    const packageName = "a";
    const packageVersion = "1.2.3";
    const packageRegistry = "https://registry.npmjs.org/";

    const packageName2 = "b";
    const packageVersion2 = "13.1.2";
    const packageRegistry2 = "https://zowe.jfrog.io/zowe/api/npm/npm-release/";

    const finalValidationMsg = "The final message from runPluginValidation";

    beforeEach(() => {
        // Mocks need cleared after every test for clean test runs
        jest.clearAllMocks();

        // This needs to be mocked before running process function of uninstall handler
        (Logger.getImperativeLogger as unknown as Mock<typeof Logger.getImperativeLogger>).mockReturnValue(new Logger(new Console()) as any);
        mocks.getRegistry.mockReturnValue(packageRegistry as any);
        mocks.readFileSync.mockReturnValue({} as any);
        npmLogin(packageRegistry);
        mocks.runValidatePlugin.mockReturnValue(finalValidationMsg as any);
        expectedVal = undefined;
        returnedVal = undefined;
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    /**
     *  Create object to be passed to process function
     *
     * @returns {IHandlerParameters}
     */
    const getIHandlerParametersObject = (): IHandlerParameters => {
        const x: any = {
            response: new (HandlerResponse as any)(),
            arguments: {
                package: [],
                file: undefined
            },
        };
        return x as IHandlerParameters;
    };

    /**
     * Validates that an getRegistry was called
     * when registry needed based on the parameters passed.
     */
    const wasGetRegistryCalled = () => {
        expect(mocks.getRegistry).toHaveBeenCalled();
    };

    /**
     * Validates that an npmLogin was called
     * when login needed based on the parameters passed.
     */
    const wasNpmLoginCallValid = (registry: string) => {
        wasGetRegistryCalled();
        expect(mocks.npmLogin).toHaveBeenCalledWith(registry);
    };

    /**
     * Validates that an install call was valid based on the parameters passed.
     *
     * @param {string}   packageLocation        expected package location that install was called with.
     * @param {string}   registry               expected registry that install was called with.
     * @param {boolean} [installFromFile=false] was the install expected to have been determined from
     *                                          a file and not passed packages.
     */
    const wasInstallCallValid = (
        packageLocation: string,
        registry: string,
        installFromFile = false
    ) => {
        if (installFromFile) {
            expect(mocks.install).toHaveBeenCalledWith(
                packageLocation, registry, true
            );
        } else {
            expect(mocks.install).toHaveBeenCalledWith(
                packageLocation, registry
            );
        }
    };

    /**
     * Checks that the install successful message was written.
     *
     * @param {IHandlerParameters} params The parameters that were passed to the
     *                                    process function.
     */
    const wasInstallSuccessful = (params: IHandlerParameters) => {
        // get the text of the last message that was displayed
        const outputMsg = (params.response.console.log as Mock).mock.calls[(params.response.console.log as Mock).mock.calls.length - 1][0];
        expect(outputMsg).toContain(finalValidationMsg);
    };

    /**
     * Validates that the readFileSync was called with the proper file name.
     *
     * @param {string} expectedFile The JSON file name
     */
    const wasReadFileSyncCallValid = (expectedFile: string) => {
        expect(mocks.readFileSync).toHaveBeenCalledWith(
            expectedFile
        );
    };

    it("should install from specified JSON file", async () => {
        // plugin definitions mocking file contents
        const fileJson: IPluginJson = {
            a: {
                package: packageName,
                registry: "",
                version: packageVersion
            },
            plugin2: {
                package: packageName2,
                registry: packageRegistry2,
                version: packageVersion2
            }
        };

        // Override the return value for this test only
        mocks.readFileSync.mockReturnValueOnce(fileJson as any);
        mocks.install
            .mockReturnValueOnce("a" as any)
            .mockReturnValueOnce("plugin2" as any);

        const handler = new InstallHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = [];
        params.arguments.file = "prod-plugins.json";

        const resolveVal = `/some/test/directory/${params.arguments.file}`;
        expectedVal = params.arguments.file;
        returnedVal = resolveVal;

        await handler.process(params as IHandlerParameters);

        // Validate the call to get the registry value
        wasGetRegistryCalled();

        // Validate the call to login
        wasNpmLoginCallValid(packageRegistry);

        expect(mocks.install).toHaveBeenCalledTimes(2);
        wasInstallCallValid(`${fileJson.a.package}@${fileJson.a.version}`, packageRegistry, true);
        wasInstallCallValid(fileJson.plugin2.package, packageRegistry2, true);

        expect(mocks.runValidatePlugin).toHaveBeenCalledTimes(2);
        expect(mocks.runValidatePlugin).toHaveBeenCalledWith("a");
        expect(mocks.runValidatePlugin).toHaveBeenCalledWith("plugin2");


        // Validate that the read was correct
        wasReadFileSyncCallValid(resolveVal);

        wasInstallSuccessful(params);
    });

    it("should install single package with file specified which is an error", async () => {
        const handler = new InstallHandler();
        const chalk = TextUtils.chalk;
        const params = getIHandlerParametersObject();
        params.arguments.plugin = ["sample1"];
        params.arguments.file = "plugin.json";
        let expectedError: ImperativeError = new ImperativeError({
            msg: "fake-error-message",
        });

        try {
            await handler.process(params);
        } catch (e) {
            expectedError = e;
        }

        expect(expectedError).toEqual( new ImperativeError({
            msg: `Option ${chalk.yellow.bold("--file")} can not be specified if positional ${chalk.yellow.bold("package...")} is as well. ` +
                `They are mutually exclusive.`
        }));

    });

    it("should install single package", async () => {
        const handler = new InstallHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = ["sample1"];

        await handler.process(params as IHandlerParameters);

        // Validate the call to get the registry value
        wasGetRegistryCalled();

        // Validate the call to login
        wasNpmLoginCallValid(packageRegistry);

        // Check that install worked as expected
        wasInstallCallValid(params.arguments.plugin[0], packageRegistry);

        // Check that success is output
        wasInstallSuccessful(params);
    });

    it("should install single package with registry specified", async () => {
        const handler = new InstallHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = ["sample1"];
        params.arguments.registry = "http://localhost:4873/";

        await handler.process(params as IHandlerParameters);

        // Validate the call to install with specified plugin and registry
        wasInstallCallValid(params.arguments.plugin[0], params.arguments.registry);

        wasInstallSuccessful(params);
    });

    it("should install multiple packages", async () => {
        const handler = new InstallHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = ["sample1", "sample2", "sample3"];

        await handler.process(params as IHandlerParameters);

        // Validate the install
        wasGetRegistryCalled();

        // Validate the call to login
        wasNpmLoginCallValid(packageRegistry);

        // Validate that install was called with each of these values
        expect(mocks.install).toHaveBeenCalledTimes(params.arguments.plugin.length);
        wasInstallCallValid(params.arguments.plugin[0], packageRegistry);
        wasInstallCallValid(params.arguments.plugin[1], packageRegistry);
        wasInstallCallValid(params.arguments.plugin[2], packageRegistry);

        wasInstallSuccessful(params);
    });

    it("should return with proper message when install from empty plugins.json", async () => {
        const handler = new InstallHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = [];

        await handler.process(params as IHandlerParameters);

        // Validate the call to get the registry value
        wasGetRegistryCalled();

        // Validate the call to login
        wasNpmLoginCallValid(packageRegistry);
        wasReadFileSyncCallValid(PMFConstants.instance.PLUGIN_JSON);

        expect(params.response.console.log).toHaveBeenCalledWith("No packages were found in " +
            PMFConstants.instance.PLUGIN_JSON + ", so no plugins were installed.");
    });

    it("should handle an error during the install", async () => {
        const handler = new InstallHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = ["sample1"];

        const installError = new Error("This is a test");

        let expectedError: ImperativeError = new ImperativeError({
            msg: "fake-error-message",
        });

        mocks.install.mockImplementationOnce(() => {
            throw installError;
        });

        try {
            await handler.process(params);
        } catch (e) {
            expectedError = e;
        }

        expect(expectedError).toBeInstanceOf(ImperativeError);
        expect(expectedError.message).toBe("Install Failed");
    });

    it("should handle an error in spawned process", async () => {
        const handler = new InstallHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = ["sample1"];

        let expectedError: ImperativeError = new ImperativeError({
            msg: "fake-error-message",
        });

        jest.spyOn(spawn, "sync").mockReturnValueOnce({ status: 1 } as any);
        mocks.getRegistry.mockImplementationOnce(jest.requireActual("../../../../src/plugins/utilities/NpmFunctions").getRegistry);

        try {
            await handler.process(params);
        } catch (e) {
            expectedError = e;
        }

        expect(expectedError).toBeInstanceOf(ImperativeError);
        expect(expectedError.additionalDetails).toContain("Command failed");
        expect(expectedError.additionalDetails).toContain("npm");
    });
});

