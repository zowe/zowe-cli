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

jest.mock("child_process");
jest.mock("jsonfile");
jest.mock("../../../../src/plugins/utilities/npm-interface/uninstall");
jest.mock("../../../../src/plugins/utilities/PMFConstants");
jest.mock("../../../../../cmd/src/response/CommandResponse");
jest.mock("../../../../../cmd/src/doc/handler/IHandlerParameters");
jest.mock("../../../../../logger");

import { CommandResponse, IHandlerParameters } from "../../../../../cmd";
import { Console } from "../../../../../console";
import { execSync } from "child_process";
import { IPluginJson } from "../../../../src/plugins/doc/IPluginJson";
import { ImperativeError } from "../../../../../error";
import { Logger } from "../../../../../logger";
import { readFileSync, writeFileSync } from "jsonfile";
import { TextUtils } from "../../../../../utilities";
import { uninstall } from "../../../../src/plugins/utilities/npm-interface";
import UninstallHandler from "../../../../src/plugins/cmd/uninstall/uninstall.handler";

describe("Plugin Management Facility uninstall handler", () => {

    // Objects created so types are correct.
    const mocks = {
        execSync: execSync as any as Mock<typeof execSync>,
        readFileSync: readFileSync as Mock<typeof readFileSync>,
        writeFileSync: writeFileSync as Mock<typeof writeFileSync>,
        uninstall: uninstall as Mock<typeof uninstall>
    };

    // two plugin set of values
    const packageName = "a";
    const packageVersion = "22.1.0";
    const packageRegistry = "http://imperative-npm-registry:4873/";

    const packageName2 = "plugin1";
    const packageVersion2 = "2.0.3";
    const packageRegistry2 = "http://imperative-npm-registry:4873/";

    beforeEach(() => {
    // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();

        // This needs to be mocked before running process function of uninstall handler
        (Logger.getImperativeLogger as any as Mock<typeof Logger.getImperativeLogger>).mockReturnValue(new Logger(new Console()) as any);
        mocks.execSync.mockReturnValue(packageRegistry as any);
        mocks.readFileSync.mockReturnValue({} as any);
    });

    /**
   *  Create object to be passed to process function
   *
   * @returns {IHandlerParameters}
   */
    const getIHandlerParametersObject = (): IHandlerParameters => {
        const x: any = {
            response: new (CommandResponse as any)(),
            arguments: {
                package: undefined
            },
        };
        return x as IHandlerParameters;
    };

    afterAll(() => {
        jest.restoreAllMocks();
    });

    /**
   * Validates that an uninstall call was valid based on the parameters passed.
   *
   * @param {string}   packageNameParm  expected package location that uninstall was called with.
   */
    const wasUninstallCallValid = (
        packageNameParm: string
    ) => {
        expect(mocks.uninstall).toHaveBeenCalledWith(
            packageNameParm
        );
    };

    /**
   * Checks that the successful message was written.
   *
   * @param {IHandlerParameters} params The parameters that were passed to the
   *                                    process function.
   */
    const wasUninstallSuccessful = (params: IHandlerParameters) => {
        expect(params.response.console.log).toHaveBeenCalledWith("Removal of the npm package(s) was successful.\n");
    };

    test("uninstall specified package", async () => {
    // plugin definitions mocking file contents
        const fileJson: IPluginJson | any = {
            a: {
                package: packageName,
                registry: undefined,
                version: packageVersion
            },
            plugin1: {
                package: packageName2,
                registry: packageRegistry2,
                version: packageVersion2
            }
        };

        // Override the return value for this test only
        mocks.readFileSync.mockReturnValueOnce(fileJson);

        const handler = new UninstallHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = ["a"];

        await handler.process(params as IHandlerParameters);

        wasUninstallCallValid(`${fileJson.a.package}`);

        wasUninstallSuccessful(params);
    });

    it("should handle an error during the uninstall", async () => {
        const chalk = TextUtils.chalk;

        const handler = new UninstallHandler();
        let expectedError: ImperativeError;
        const params = getIHandlerParametersObject();
        params.arguments.plugin = [];

        try {
            await handler.process(params as IHandlerParameters);
        } catch (e) {
            expectedError = e;
        }

        expect(expectedError.message).toBe(`${chalk.yellow.bold("Package name")} is required.`);

    // const installError = new Error("This is a test");
    // let expectedError: ImperativeError;
    //
    // mocks.install.mockImplementationOnce(() => {
    //   throw installError;
    // });
    //
    // try {
    //   await handler.process(params);
    // } catch (e) {
    //   expectedError = e;
    // }
    //
    // expect(expectedError.message).toBe("Install Failed");
    });


});

