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
import {
    ZosmfRestClient, IImperativeError, NextVerFeatures, RestConstants, SessConstants, Session
} from "@zowe/core-for-zowe-sdk";

describe("ZosmfRestClient tests", () => {

    beforeEach(() => {
        /* This avoids having to mock ImperativeConfig.envVariablePrefix.
         * Unless the choice below is overridden, tests will use our legacy format for errors.
         */
        jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(false);
    });

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

        it("should handle basic auth error with empty string causeErrors using V3_ERR_FORMAT", () => {
            jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(true);
            const zosmfRestClient = new ZosmfRestClient(new Session({
                hostname: "dummy",
                type: SessConstants.AUTH_TYPE_BASIC,
                user: "fakeUser",
                password: "fakePass"
            }));
            (zosmfRestClient as any).mResponse = {
                statusCode: RestConstants.HTTP_STATUS_401
            };
            const error: IImperativeError = {
                msg: "Rest API failure with HTTP(S) status 401",
                causeErrors: "",
                additionalDetails: 'Received HTTP(S) error 401 = Unauthorized.\n\n' +
                    'Host:              some.company.com\n' +
                    'Port:              1234\n' +
                    'Allow Unauth Cert: true' +
                '}'
            };
            const processedError = ((zosmfRestClient as any).processError(error));
            expect(processedError.msg).toContain("Rest API failure with HTTP(S) status 401");
            expect(processedError.msg).toContain("This operation requires authentication.");
            expect(processedError.msg).toContain("Username or password are not valid or expired.");
            expect(processedError.causeErrors).toEqual("{\"Error\": \"Rest API failure with HTTP(S) status 401\"}");
            expect(processedError.additionalDetails).toContain("Received HTTP(S) error 401 = Unauthorized.");
            expect(processedError.additionalDetails).toContain("Host:              some.company.com");
            expect(processedError.additionalDetails).toContain("Port:              1234");
            expect(processedError.additionalDetails).toContain("Allow Unauth Cert: true");
        });

        it("should handle basic auth error with JSON causeErrors using V3_ERR_FORMAT", () => {
            jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(true);
            const zosmfRestClient = new ZosmfRestClient(new Session({
                hostname: "dummy",
                type: SessConstants.AUTH_TYPE_BASIC,
                user: "fakeUser",
                password: "fakePass"
            }));
            (zosmfRestClient as any).mResponse = {
                statusCode: RestConstants.HTTP_STATUS_401
            };
            const error: IImperativeError = {
                msg: "Rest API failure with HTTP(S) status 401",
                causeErrors: JSON.stringify({
                    details: ["details[0]", "details[2]"],
                    messages: ["messages[0]", "messages[2]"]
                }),
                additionalDetails: 'Received HTTP(S) error 401 = Unauthorized.\n\n' +
                    'Host:              some.company.com\n' +
                    'Port:              1234\n' +
                    'Allow Unauth Cert: true' +
                    '}'
            };
            const processedError = ((zosmfRestClient as any).processError(error));
            expect(processedError.msg).toContain("Rest API failure with HTTP(S) status 401");
            expect(processedError.msg).toContain("This operation requires authentication.");
            expect(processedError.msg).toContain("Username or password are not valid or expired.");
            expect(processedError.causeErrors).toContain('"details":["details[0]","details[2]"]');
            expect(processedError.causeErrors).toContain('"messages":["messages[0]","messages[2]"]');
            expect(processedError.additionalDetails).toContain("Received HTTP(S) error 401 = Unauthorized.");
            expect(processedError.additionalDetails).toContain("Host:              some.company.com");
            expect(processedError.additionalDetails).toContain("Port:              1234");
            expect(processedError.additionalDetails).toContain("Allow Unauth Cert: true");
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

        it("should handle error for token auth using V3_ERR_FORMAT", () => {
            jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(true);
            const zosmfRestClient = new ZosmfRestClient(new Session({
                hostname: "dummy",
                type: SessConstants.AUTH_TYPE_TOKEN,
                tokenType: SessConstants.TOKEN_TYPE_JWT,
                tokenValue: "fakeToken"
            }));
            (zosmfRestClient as any).mResponse = {
                statusCode: RestConstants.HTTP_STATUS_401
            };
            const error: IImperativeError = { msg: "Fake token error" };
            const processedError = ((zosmfRestClient as any).processError(error));
            expect(processedError.msg).toContain("Fake token error");
            expect(processedError.msg).toContain("This operation requires authentication.");
            expect(processedError.msg).toContain("Token is not valid or expired");
            expect(processedError.msg).toContain("To obtain a new valid token, use the following command: `zowe config secure`");
            expect(processedError.msg).toContain("For CLI usage, see `zowe config secure --help`");
            expect(processedError.causeErrors).toEqual('{"Error": "Fake token error"}');
            expect(processedError.additionalDetails).not.toBeDefined();
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

        it("should handle error for APIML token auth and missing base path using V3_ERR_FORMAT", () => {
            jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(true);
            const zosmfRestClient = new ZosmfRestClient(new Session({
                hostname: "dummy",
                type: SessConstants.AUTH_TYPE_TOKEN,
                tokenType: SessConstants.TOKEN_TYPE_APIML,
                tokenValue: "fakeToken"
            }));
            (zosmfRestClient as any).mResponse = {
                statusCode: RestConstants.HTTP_STATUS_401
            };
            const error: IImperativeError = { msg: "Fake token error" };
            const processedError = ((zosmfRestClient as any).processError(error));
            expect(processedError.msg).toContain("Fake token error");
            expect(processedError.msg).toContain("This operation requires authentication.");
            expect(processedError.msg).toContain("Token type \"apimlAuthenticationToken\" requires base path to be defined.");
            expect(processedError.msg).toContain("You must either connect with username and password or provide a base path.");
            expect(processedError.causeErrors).toEqual('{"Error": "Fake token error"}');
            expect(processedError.additionalDetails).not.toBeDefined();
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

        it("should handle error for cert auth using V3_ERR_FORMAT", () => {
            jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(true);
            const zosmfRestClient = new ZosmfRestClient(new Session({
                hostname: "dummy",
                type: SessConstants.AUTH_TYPE_CERT_PEM,
                cert: "fakeCert",
                certKey: "fakeKey"
            }));
            (zosmfRestClient as any).mResponse = {
                statusCode: RestConstants.HTTP_STATUS_401
            };
            const error: IImperativeError = { msg: "Bad Cert" };
            const processedError = ((zosmfRestClient as any).processError(error));
            expect(processedError.msg).toContain("Bad Cert");
            expect(processedError.msg).toContain("This operation requires authentication.");
            expect(processedError.msg).toContain("Certificate is not valid or expired.");
            expect(processedError.causeErrors).toEqual('{"Error": "Bad Cert"}');
            expect(processedError.additionalDetails).not.toBeDefined();
        });
    });
});
