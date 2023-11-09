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

jest.mock("jsonfile");
jest.mock("../../../../../../src/imperative/plugins/utilities/PMFConstants");
jest.mock("../../../../../../src/cmd/response/CommandResponse");
jest.mock("../../../../../../src/cmd/response/HandlerResponse");
jest.mock("../../../../../../src/logger");

import { readFileSync } from "jsonfile";
import {
    HandlerResponse, IHandlerParameters, Console,IPluginJson, Logger
} from "../../../../../../src";
import ListHandler from "../../../../../../src/imperative/plugins/cmd/list/list.handler";

const stripAnsi = require("strip-ansi");

describe("Plugin Management Facility list handler", () => {

    // (PluginIssues as any).mInstance = new PluginIssues();
    // Objects created so types are correct.
    const mocks = {
        readFileSync: readFileSync as Mock<typeof readFileSync>
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

        // This needs to be mocked before running process function of install handler
        (Logger.getImperativeLogger as unknown as Mock<typeof Logger.getImperativeLogger>).mockReturnValue(new Logger(new Console()) as any);

    });

    /**
     * Checks that the "Install Successful" message was written.
     *
     * @param {IHandlerParameters} params The parameters that were passed to the
     *                                    process function.
     */
    const wasListSuccessful = (params: IHandlerParameters) => {
        expect(params.response.console.log).toHaveBeenCalled();
        expect(stripAnsi((params.response.console.log as any).mock.calls[0][0])).toMatchSnapshot();
    };

    /**
     *  Create object to be passed to process function
     *
     * @returns {IHandlerParameters}
     */
    const getIHandlerParametersObject = (): IHandlerParameters => {
        const x: any = {
            response: new (HandlerResponse as any)(),
            arguments: {
                package: undefined
            },
        };
        x.response.data = {setObj: jest.fn()};
        return x as IHandlerParameters;
    };

    beforeEach(() => {
        mocks.readFileSync.mockReturnValue({} as any);
    });

    test("list packages", async () => {

        // plugin definitions mocking unsorted file contents
        const fileJson: IPluginJson = {
            plugin1: {
                package: packageName2,
                registry: packageRegistry2,
                version: packageVersion2
            },
            a: {
                package: packageName,
                registry: packageRegistry,
                version: packageVersion
            }
        };

        // Override the return value for this test only
        mocks.readFileSync.mockReturnValueOnce(fileJson as any);

        const handler = new ListHandler();

        const params = getIHandlerParametersObject();

        await handler.process(params as IHandlerParameters);

        wasListSuccessful(params);

    });

    test("list packages short", async () => {

        // plugin definitions mocking unsorted file contents
        const fileJson: IPluginJson = {
            plugin1: {
                package: packageName2,
                registry: packageRegistry2,
                version: packageVersion2
            },
            a: {
                package: packageName,
                registry: packageRegistry,
                version: packageVersion
            }
        };

        // Override the return value for this test only
        mocks.readFileSync.mockReturnValueOnce(fileJson as any);

        const handler = new ListHandler();

        const params = getIHandlerParametersObject();
        params.arguments.short = true;

        await handler.process(params as IHandlerParameters);

        wasListSuccessful(params);

    });
});
