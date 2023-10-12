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

import { ISettingsFile } from "../../../../../settings/src/doc/ISettingsFile";

jest.mock("../../../../../settings/src/AppSettings");

import { CommandResponse, IHandlerParameters } from "../../../../../cmd";
import { AppSettings } from "../../../../../settings";

describe("Config management list handler", () => {

    afterEach(() => {
        // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();
    });
    const defaultSettings: ISettingsFile = {
        overrides: {
            CredentialManager: false
        }
    };
    /**
     *  Create object to be passed to process function
     *
     * @returns {IHandlerParameters}
     */
    const getIHandlerParametersObject = (values: boolean): IHandlerParameters => {
        const x: any = {
            response: new (CommandResponse as any)(),
            arguments: {
                values
            },
        };
        return x as IHandlerParameters;
    };

    it("should list all settings", async () => {

        const handlerReq = require("../../../../src/config/cmd/list/list.handler");
        const handler = new handlerReq.default();

        const params = getIHandlerParametersObject(false);

        const appSettings = AppSettings.initialize("foo",defaultSettings);

        await handler.process(params as IHandlerParameters);

        expect(appSettings.getNamespace).toHaveBeenCalledWith("overrides");
        expect(appSettings.getNamespace("overrides")).toBeDefined();
    });
});

