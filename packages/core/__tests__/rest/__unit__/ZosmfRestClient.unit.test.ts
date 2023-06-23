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

import { ZosmfHeaders } from "../../../src/rest/ZosmfHeaders";
import { ZosmfRestClient } from "../../../src/rest/ZosmfRestClient";
import { IImperativeError, RestConstants, SessConstants, Session } from "@zowe/imperative";

describe("ZosmfRestClient tests", () => {
    it("should append the csrf header to all requests", () => {
        const zosmfRestClient = new ZosmfRestClient(new Session({ hostname: "dummy" }));
        expect((zosmfRestClient as any).appendHeaders([])).toMatchObject([
            ZosmfHeaders.X_CSRF_ZOSMF_HEADER
        ]);
    });

    it("should delete stack from any zosmf errors before presenting them to users", () => {
        const zosmfRestClient = new ZosmfRestClient(new Session({ hostname: "dummy" }));
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

    describe("Authentication errors", () => {
        it("should handle error for basic auth", () => {
            const zosmfRestClient = new ZosmfRestClient(new Session({
                hostname: "dummy",
                type: SessConstants.AUTH_TYPE_BASIC,
                user: "fakeUser",
                password: "fakePass"
            }));
            (zosmfRestClient as any).mResponse = {
                statusCode: RestConstants.HTTP_STATUS_401
            };
            const error: IImperativeError = { msg: "hello" };
            const processedError = ((zosmfRestClient as any).processError(error));
            expect(processedError.msg).toContain("This operation requires authentication.");
            expect(processedError.additionalDetails).toContain("Username or password are not valid or expired.");
        });

        it("should handle error for token auth", () => {
            const zosmfRestClient = new ZosmfRestClient(new Session({
                hostname: "dummy",
                type: SessConstants.AUTH_TYPE_TOKEN,
                tokenType: SessConstants.TOKEN_TYPE_JWT,
                tokenValue: "fakeToken"
            }));
            (zosmfRestClient as any).mResponse = {
                statusCode: RestConstants.HTTP_STATUS_401
            };
            const error: IImperativeError = { msg: "hello" };
            const processedError = ((zosmfRestClient as any).processError(error));
            expect(processedError.msg).toContain("This operation requires authentication.");
            expect(processedError.additionalDetails).toContain("Token is not valid or expired.");
        });

        it("should handle error for APIML token auth and missing base path", () => {
            const zosmfRestClient = new ZosmfRestClient(new Session({
                hostname: "dummy",
                type: SessConstants.AUTH_TYPE_TOKEN,
                tokenType: SessConstants.TOKEN_TYPE_APIML,
                tokenValue: "fakeToken"
            }));
            (zosmfRestClient as any).mResponse = {
                statusCode: RestConstants.HTTP_STATUS_401
            };
            const error: IImperativeError = { msg: "hello" };
            const processedError = ((zosmfRestClient as any).processError(error));
            expect(processedError.msg).toContain("This operation requires authentication.");
            expect(processedError.additionalDetails).not.toContain("Token is not valid or expired.");
        });

        it("should handle error for cert auth", () => {
            const zosmfRestClient = new ZosmfRestClient(new Session({
                hostname: "dummy",
                type: SessConstants.AUTH_TYPE_CERT_PEM,
                cert: "fakeCert",
                certKey: "fakeKey"
            }));
            (zosmfRestClient as any).mResponse = {
                statusCode: RestConstants.HTTP_STATUS_401
            };
            const error: IImperativeError = { msg: "hello" };
            const processedError = ((zosmfRestClient as any).processError(error));
            expect(processedError.msg).toContain("This operation requires authentication.");
            expect(processedError.additionalDetails).toContain("Certificate is not valid or expired.");
        });
    });
});
