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

import { RestClientError } from "../../../../src/rest/client/RestClientError";
import { ImperativeError } from "../../../../src/error";

describe("RestClientError tests", () => {
    it("should be an instance of ImperativeError", async () => {
        const err = new RestClientError({
            msg: "This is a rest client error",
            additionalDetails: "This is an error message",
            source: "client"
        });
        try {
            throw err;
        } catch (restErr) {
            expect(restErr).toBeInstanceOf(ImperativeError);
        }
    });

    it("should have connection details available", async () => {
        const err = new RestClientError({
            msg: "This is a rest client error",
            additionalDetails: "This is an error message",
            source: "client",
            host: "blah",
            port: 1234,
            resource: "/the/resource",
            request: "GET",
            basePath: "base/path",
            headers: ["header"],
            payload: "the payload",
            httpStatus: 200
        });
        try {
            throw err;
        } catch (restErr) {
            expect(restErr.details).toMatchSnapshot();
        }
    });
});
