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

import { ZosmfRestClient } from "../../../src/rest/ZosmfRestClient";
import { IImperativeError, Session } from "@zowe/imperative";

describe("ZosmfRestClient tests", () => {
    it("should append the csrf header to all requests", () => {
        const zosmfRestClient = new ZosmfRestClient(new Session({hostname: "dummy"}));
        expect((zosmfRestClient as any).appendHeaders([])).toMatchSnapshot();
    });

    it("should delete stack from any zosmf errors before presenting them to users", () => {
        const zosmfRestClient = new ZosmfRestClient(new Session({hostname: "dummy"}));
        const shouldNotDeleteMessage = "This should not be deleted";
        const shouldDeleteMessage = "This should be deleted";
        const error: IImperativeError = {
            msg: "hello",
            causeErrors: JSON.stringify({
                stack: shouldDeleteMessage,
                shouldNotDelete: shouldNotDeleteMessage
            })
        };
        const processedError = ((zosmfRestClient as any).processError(error));
        expect(processedError.msg).toContain(shouldNotDeleteMessage);
        expect(processedError.msg.indexOf()).toEqual(-1);

    });
});
