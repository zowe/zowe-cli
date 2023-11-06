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

import { IHandlerResponseApi, HandlerResponse, CommandResponse } from "../../../../src";

describe("Handler Response", () => {
    it("Handler Response", () => {
        let caughtError;
        try {
            const response: IHandlerResponseApi = new HandlerResponse(new CommandResponse({
                silent: false,
                responseFormat: "default"
            }));

            response.console.log("Hello from handler");
            response.console.errorHeader("Problem");
            response.console.error("A problem occurred!");

            response.data.setMessage("The command has produced the required data.");
            response.data.setObj({command: "data"});
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
    });
});
