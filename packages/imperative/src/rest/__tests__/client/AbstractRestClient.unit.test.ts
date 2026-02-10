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
import * as https from "https";
import * as http from "http";
import { Session } from "../../src/session/Session";
import { AuthOrder } from "../../src/session/AuthOrder";
import {
    AUTH_TYPE_BASIC, AUTH_TYPE_BEARER, AUTH_TYPE_CERT_PEM, AUTH_TYPE_NONE, AUTH_TYPE_TOKEN
} from "../../src/session/SessConstants";
import { RestClient } from "../../src/client/RestClient";
import { Headers } from "../../src/client/Headers";
import { ProcessUtils } from "../../../utilities/src/ProcessUtils";
import { MockHttpRequestResponse } from "./__model__/MockHttpRequestResponse";
import { EventEmitter } from "events";
import { ImperativeError } from "../../../error/src/ImperativeError";
import { IOptionsFullResponse } from "../../src/client/doc/IOptionsFullResponse";
import { CLIENT_PROPERTY } from "../../src/client/types/AbstractRestClientProperties";
import { PassThrough } from "stream";
import * as zlib from "zlib";
import * as streamToString from "stream-to-string";
import { AbstractRestClient } from "../../src/client/AbstractRestClient";
import * as os from "os";
import { join } from "path";
import { IO } from "../../../io";
import { ProxySettings } from "../../src/client/ProxySettings";
import { HttpsProxyAgent } from "https-proxy-agent";
import { completionTimeoutErrorMessage } from "../../src/client/doc/IRestClientError";
import { EnvironmentalVariableSettings } from "../../../imperative";
import { Logger } from "../../../logger";
import { Censor } from "../../../censor";
import { IHTTPSOptions } from "../../src/client/doc/IHTTPSOptions";
import { cloneDeep } from "lodash";

/**
 * To test the AbstractRestClient, we use the existing default RestClient which
 * extends AbstractRestClient to use as a __model__.
 */

describe("AbstractRestClient tests", () => {
    let setPasswordAuthSpy: any;

    // never run putTopAuthInSession. It has its own unit test.
    AuthOrder.putTopAuthInSession = jest.fn();

    beforeEach(() => {
        jest.restoreAllMocks();
        // pretend that basic auth was successfully set
        setPasswordAuthSpy = jest.spyOn(AbstractRestClient.prototype as any, "setPasswordAuth");
        setPasswordAuthSpy.mockReturnValue(true);
    });

    it("should not append any headers to a request by default", () => {
        const client = new RestClient(new Session({hostname: "test"}));
        expect((client as any).appendHeaders(["Test"])).toMatchSnapshot();
        expect((client as any).appendHeaders(undefined)).toMatchSnapshot();
    });

    it("should sanitize header values before they are logged 1", () => {
        const zoweLogger = Logger.getImperativeLogger();
        jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(zoweLogger);
        const zoweTraceLoggerSpy = jest.spyOn(zoweLogger, "trace");
        const censorObjectDataSpy = jest.spyOn(Censor, "censorObject");
        const client = new RestClient(new Session({hostname: "test"}));

        const httpsOptions: IHTTPSOptions = {
            headers: {
                Authorization: "Basic testdata"
            },
            hostname: "test",
            method: "GET",
            path: "/",
            port: "443",
            rejectUnauthorized: false
        };
        const expectedHttpsOptions = cloneDeep(httpsOptions);
        expectedHttpsOptions.headers.Authorization = Censor.CENSOR_RESPONSE;

        (client as any).appendInputHeaders(httpsOptions);

        expect(zoweTraceLoggerSpy).toHaveBeenCalledTimes(1);
        expect(censorObjectDataSpy).toHaveBeenCalledTimes(1);
        expect(censorObjectDataSpy).toHaveBeenCalledWith(httpsOptions);
        expect(censorObjectDataSpy).toHaveReturnedWith(expectedHttpsOptions);
        expect(zoweTraceLoggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("appendInputHeaders"),
            JSON.stringify(expectedHttpsOptions),
            "RestClient"
        );
    });

    it("should sanitize header values before they are logged 2", () => {
        const zoweLogger = Logger.getImperativeLogger();
        jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(zoweLogger);
        const zoweTraceLoggerSpy = jest.spyOn(zoweLogger, "trace");
        const censorObjectDataSpy = jest.spyOn(Censor, "censorObject");
        const client = new RestClient(new Session({hostname: "test"}));

        const httpsOptions: IHTTPSOptions = {
            headers: {
                Cookie: "fakeCookie"
            },
            hostname: "test",
            method: "GET",
            path: "/",
            port: "443",
            rejectUnauthorized: false
        };
        const expectedHttpsOptions = cloneDeep(httpsOptions);
        expectedHttpsOptions.headers.Cookie = Censor.CENSOR_RESPONSE;

        (client as any).appendInputHeaders(httpsOptions);

        expect(zoweTraceLoggerSpy).toHaveBeenCalledTimes(1);
        expect(censorObjectDataSpy).toHaveBeenCalledTimes(1);
        expect(censorObjectDataSpy).toHaveBeenCalledWith(httpsOptions);
        expect(censorObjectDataSpy).toHaveReturnedWith(expectedHttpsOptions);
        expect(zoweTraceLoggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("appendInputHeaders"),
            JSON.stringify(expectedHttpsOptions),
            "RestClient"
        );
    });

    it("should sanitize header values before they are logged 3", () => {
        const zoweLogger = Logger.getImperativeLogger();
        jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(zoweLogger);
        const zoweTraceLoggerSpy = jest.spyOn(zoweLogger, "trace");
        const censorObjectDataSpy = jest.spyOn(Censor, "censorObject");
        const client = new RestClient(new Session({hostname: "test"}));

        const httpsOptions: IHTTPSOptions = {
            headers: {
                Authorization: "Basic testdata",
                "Proxy-Authorization": "Basic proxytestdata"
            },
            hostname: "test",
            method: "GET",
            path: "/",
            port: "443",
            rejectUnauthorized: false
        };
        const expectedHttpsOptions = cloneDeep(httpsOptions);
        expectedHttpsOptions.headers.Authorization = Censor.CENSOR_RESPONSE;
        expectedHttpsOptions.headers["Proxy-Authorization"] = Censor.CENSOR_RESPONSE;

        (client as any).appendInputHeaders(httpsOptions);

        expect(zoweTraceLoggerSpy).toHaveBeenCalledTimes(1);
        expect(censorObjectDataSpy).toHaveBeenCalledTimes(1);
        expect(censorObjectDataSpy).toHaveBeenCalledWith(httpsOptions);
        expect(censorObjectDataSpy).toHaveReturnedWith(expectedHttpsOptions);
        expect(zoweTraceLoggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("appendInputHeaders"),
            JSON.stringify(expectedHttpsOptions),
            "RestClient"
        );
    });

    it("should give an error when no session is provided", async () => {
        let error;

        try {
            await RestClient.getExpectString(undefined, "/resource");
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error.message).toMatchSnapshot();
    });

    it("should give an error when no resource URI is provided", async () => {
        let error;

        try {
            await RestClient.getExpectString(new Session({hostname: "test"}), "  ");
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error.message).toMatchSnapshot();
    });

    it("should throw an error when session type is basic and no creds are in the session", async () => {
        // restore setPasswordAuth spy to its original implementation
        setPasswordAuthSpy.mockRestore();

        let caughtError;
        try {
            const sessWithoutCreds = new Session({
                hostname: "test",
                type: AUTH_TYPE_BASIC,
                base64EncodedAuth: "FakeBase64EncodedCred"
            });
            delete sessWithoutCreds.ISession.base64EncodedAuth;
            await RestClient.getExpectString(sessWithoutCreds, "/resource");
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError instanceof ImperativeError).toBe(true);
        expect(caughtError.message).toContain("No credentials for a BASIC or TOKEN type of session");
    });

    it("should not error when session type is none and no creds are in the session", async () => {
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("{\"newData\":", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("\"response data\"}", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;

        let caughtError;
        try {
            await RestClient.getExpectString(new Session({
                hostname: "test",
                type: AUTH_TYPE_NONE
            }), "/resource");
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(requestFnc).toHaveBeenCalledTimes(1);
    });

    it("should not error when chunking data and payload data are present in outgoing request", async () => {

        interface IPayload {
            data: string;
        }

        interface IResponseload {
            newData: string;
        }

        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("{\"newData\":", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("\"response data\"}", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;

        const payload: IPayload = {
            data: "input data",
        };

        const data = await RestClient.putExpectJSON<IResponseload>(new Session({
            hostname: "test",
        }), "/resource", [Headers.APPLICATION_JSON], payload);
        expect(data).toMatchSnapshot();
    });

    it("should error with request rejection when status code is not in 200 range", async () => {
        interface IResponseload {
            newData: string;
        }

        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                newEmit.statusCode = "400";
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("{\"newData\":", "utf8"));
                });

                // missing closing bracket
                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("\"response data\"}", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;
        const headers: any = [{"My-Header": "value is here"}];
        const payload: any = {"my payload object": "hello"};
        let error;
        try {
            await RestClient.putExpectJSON<IResponseload>(new Session({hostname: "test"}), "/resource", headers, payload);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.errorCode).toBe("400");
        expect(error.causeErrors).toBe("{\"newData\":\"response data\"}");
        for (const header of headers) {
            // make sure the error contains the headers that were appended to the request
            for (const key of Object.keys(header)) {
                expect(error.additionalDetails).toContain(key);
                expect(error.additionalDetails).toContain(header[key]);
            }
        }
        expect(error.message).toBe("Rest API failure with HTTP(S) status 400");
        expect(error.additionalDetails).toContain("Received HTTP(S) error 400 = Bad Request.");
        expect(error.additionalDetails).toContain("Allow Unauth Cert: false");
    });

    it("should error when chunking JSON data that does not parse", async () => {

        interface IResponseload {
            newData: string;
        }

        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("{\"newData\":", "utf8"));
                });

                // missing closing bracket
                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("\"response data\"", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;
        try {
            await RestClient.getExpectJSON<IResponseload>(new Session({hostname: "test"}), "/resource");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error instanceof ImperativeError).toBe(true);
        const regex = /(Unexpected end of JSON input)|(Expected ',' or '}' after property value in JSON at position 26)/;
        expect(error.message).toMatch(regex);
    });

    it("should error when chunking JSON data that does not parse and allow post payload", async () => {

        interface IPayload {
            data: string;
        }

        interface IResponseload {
            newData: string;
        }

        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("{\"newData\":", "utf8"));
                });

                // missing closing bracket
                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("\"response data\"", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;

        const payload: IPayload = {
            data: "input data",
        };

        let error;
        try {
            await RestClient.postExpectJSON<IResponseload>(new Session({hostname: "test"}),
                "/resource", [Headers.APPLICATION_JSON], payload);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error instanceof ImperativeError).toBe(true);
        const regex = /(Unexpected end of JSON input)|(Expected ',' or '}' after property value in JSON at position 26)/;
        expect(error.message).toMatch(regex);
        expect(error.errorCode).toBeUndefined();
    });

    it("should not error when headers and payload data are present in outgoing request", async () => {

        interface IPayload {
            data: string;
        }

        interface IResponseload {
            newData: string;
        }

        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("{\"newData\": \"response data\"}", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;

        const payload: IPayload = {
            data: "input data",
        };

        const data = await RestClient.putExpectJSON<IResponseload>(new Session({
            hostname: "test",
        }), "/resource", [Headers.APPLICATION_JSON], payload);
        expect(data).toMatchSnapshot();
    });

    it("should not error when data and end events are sent", async () => {
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("Sample data", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;

        const data = await RestClient.getExpectString(new Session({hostname: "test"}), "/resource");
        expect(data).toMatchSnapshot();
    });

    // called IRL when no connectivity
    it("should give an error message when error event is called", async () => {
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    emitter.emit("error", "value");
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;

        try {
            await RestClient.getExpectString(new Session({hostname: "test"}), "/resource");
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error.message).toMatchSnapshot();
    });

    // called IRL when socket is reused and HTTP 1.1 race condition is hit
    it("should handle a socket reuse error", async () => {
        const errorObject: any = {
            name: "socket hang up",
            message: "socket hang up",
            code: "ECONNRESET"
        };

        let reusedSocket = true;
        const requestFnc = jest.fn((options, callback) => {
            const emitter = new MockHttpRequestResponse();

            ProcessUtils.nextTick(() => {
                callback(emitter);

                if (reusedSocket) {
                    emitter.reusedSocket = true;
                    ProcessUtils.nextTick(() => {
                        emitter.emit("error", errorObject);
                        reusedSocket = false;
                    });
                } else {
                    ProcessUtils.nextTick(() => {
                        emitter.emit("data", Buffer.from("\"response data\"", "utf8"));
                    });

                    ProcessUtils.nextTick(() => {
                        emitter.emit("end");
                    });
                }
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;
        let response: string = "";

        try {
            response = await RestClient.getExpectString(new Session({hostname: "test"}), "/resource");
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error).not.toBeDefined();
        expect(response).toEqual("\"response data\"");
    });

    it("should handle a socket connection timeout", async () => {
        let destroySpy: jest.SpyInstance;
        const requestFnc = jest.fn((options, callback) => {
            const emitter = new MockHttpRequestResponse();
            destroySpy = jest.spyOn(emitter, "destroy");
            emitter.socket = {connecting: true};

            ProcessUtils.nextTick(() => {
                callback(emitter);

                ProcessUtils.nextTick(() => {
                    emitter.emit("timeout");
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;

        try {
            const session = new Session({hostname: "test"});
            session.ISession.socketConnectTimeout = 1;
            await RestClient.getExpectString(session, "/resource");
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("Failed to send an HTTP request");
        expect(error.causeErrors.message).toContain("Connection timed out");
        expect(requestFnc).toHaveBeenCalledTimes(1);
        expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    it("should handle a socket connection timeout - good env variable", async () => {
        let destroySpy: jest.SpyInstance;
        const readEnvSpy = jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValue({
            socketConnectTimeout: {key: "test", value: "1"},
            requestCompletionTimeout: {key: "test", value: undefined}
        });
        const requestFnc = jest.fn((options, callback) => {
            const emitter = new MockHttpRequestResponse();
            destroySpy = jest.spyOn(emitter, "destroy");
            emitter.socket = {connecting: true};

            ProcessUtils.nextTick(() => {
                callback(emitter);

                ProcessUtils.nextTick(() => {
                    emitter.emit("timeout");
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;
        let session: Session;

        try {
            session = new Session({hostname: "test"});
            await RestClient.getExpectString(session, "/resource");
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("Failed to send an HTTP request");
        expect(error.causeErrors.message).toContain("Connection timed out");
        expect(requestFnc).toHaveBeenCalledTimes(1);
        expect(destroySpy).toHaveBeenCalledTimes(1);
        expect(readEnvSpy).toHaveBeenCalledTimes(1);
        expect(session.ISession.socketConnectTimeout).toEqual(1);
    });

    it("should handle a socket connection timeout - bad env variable", async () => {
        const readEnvSpy = jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValue({
            socketConnectTimeout: {key: "test", value: "garbage"},
            requestCompletionTimeout: {key: "test", value: undefined}
        });
        const requestFnc = jest.fn((options, callback) => {
            const emitter = new MockHttpRequestResponse();
            emitter.socket = {connecting: true};

            ProcessUtils.nextTick(() => {
                callback(emitter);
                ProcessUtils.nextTick(() => {
                    emitter.emit("end");
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        const session = new Session({hostname: "test"});
        await RestClient.getExpectString(session, "/resource");


        expect(requestFnc).toHaveBeenCalledTimes(1);
        expect(readEnvSpy).toHaveBeenCalledTimes(1);
        expect(session.ISession.socketConnectTimeout).toBeUndefined();
    });

    it("should handle a request completion timeout", async () => {
        let destroySpy: jest.SpyInstance;
        const requestFnc = jest.fn((options, callback) => {
            const emitter = new MockHttpRequestResponse();
            destroySpy = jest.spyOn(emitter, "destroy");
            emitter.socket = {connnecting: false};

            ProcessUtils.nextTick(() => {
                callback(emitter);

                ProcessUtils.nextTick(() => {
                    emitter.emit("timeout", new ImperativeError({msg: completionTimeoutErrorMessage}));
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;

        try {
            const session = new Session({hostname: "test"});
            session.ISession.requestCompletionTimeout = 1;
            await RestClient.getExpectString(session, "/resource");
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("HTTP request timed out after connecting.");
        expect(error.causeErrors.message).toContain("The request exceeded the specified request completion timeout.");
        expect(requestFnc).toHaveBeenCalledTimes(1);
        expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    it("should handle a request completion timeout - good env variable", async () => {
        let destroySpy: jest.SpyInstance;
        const readEnvSpy = jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValue({
            socketConnectTimeout: {key: "test", value: "60000"},
            requestCompletionTimeout: {key: "test", value: "1"}
        });
        const requestFnc = jest.fn((options, callback) => {
            const emitter = new MockHttpRequestResponse();
            destroySpy = jest.spyOn(emitter, "destroy");
            emitter.socket = {connnecting: false};

            ProcessUtils.nextTick(() => {
                callback(emitter);

                ProcessUtils.nextTick(() => {
                    emitter.emit("timeout", new ImperativeError({msg: completionTimeoutErrorMessage}));
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;
        let session: Session;

        try {
            session = new Session({hostname: "test"});
            await RestClient.getExpectString(session, "/resource");
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("HTTP request timed out after connecting.");
        expect(error.causeErrors.message).toContain("The request exceeded the specified request completion timeout.");
        expect(requestFnc).toHaveBeenCalledTimes(1);
        expect(destroySpy).toHaveBeenCalledTimes(1);
        expect(readEnvSpy).toHaveBeenCalledTimes(1);
        expect(session.ISession.requestCompletionTimeout).toEqual(1);
    });

    it("should handle a request completion timeout - bad env variable", async () => {
        const readEnvSpy = jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValue({
            socketConnectTimeout: {key: "test", value: "60000"},
            requestCompletionTimeout: {key: "test", value: "garbage"}
        });
        const requestFnc = jest.fn((options, callback) => {
            const emitter = new MockHttpRequestResponse();
            emitter.socket = {connnecting: false};

            ProcessUtils.nextTick(() => {
                callback(emitter);
                ProcessUtils.nextTick(() => {
                    emitter.emit("end");
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        const session = new Session({hostname: "test"});
        await RestClient.getExpectString(session, "/resource");

        expect(requestFnc).toHaveBeenCalledTimes(1);
        expect(readEnvSpy).toHaveBeenCalledTimes(1);
        expect(session.ISession.requestCompletionTimeout).toBeUndefined();
    });

    it("should handle a request completion timeout and use the provided callback", async () => {
        let destroySpy: jest.SpyInstance;
        const requestFnc = jest.fn((options, callback) => {
            const emitter = new MockHttpRequestResponse();
            destroySpy = jest.spyOn(emitter, "destroy");
            emitter.socket = {connnecting: false};

            ProcessUtils.nextTick(() => {
                callback(emitter);

                ProcessUtils.nextTick(() => {
                    emitter.emit("timeout", new ImperativeError({msg: completionTimeoutErrorMessage}));
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;
        let callback;

        try {
            const session = new Session({hostname: "test"});
            session.ISession.requestCompletionTimeout = 1;
            callback = session.ISession.requestCompletionTimeoutCallback = jest.fn();
            await RestClient.getExpectString(session, "/resource");
        } catch (thrownError) {
            error = thrownError;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("HTTP request timed out after connecting.");
        expect(error.causeErrors.message).toContain("The request exceeded the specified request completion timeout.");
        expect(requestFnc).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    it("should call http request for http requests", async () => {
        const requestEmitter = new MockHttpRequestResponse();
        const httpRequestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    requestEmitter.emit("error", "value");
                });
            });

            return requestEmitter;
        });

        const emitter = new MockHttpRequestResponse();
        const httpsRequestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    emitter.emit("error", "value");
                });
            });

            return emitter;
        });

        (https.request as any) = httpsRequestFnc;
        (http.request as any) = httpRequestFnc;

        try {
            await RestClient.getExpectString(new Session({hostname: "test", protocol: "http"}), "/resource");
        } catch (err) {
            // Do nothing
        }

        expect(httpRequestFnc).toHaveBeenCalled();
        expect(httpsRequestFnc).not.toHaveBeenCalled();
    });

    it("should call https request for https requests", async () => {
        const requestEmitter = new MockHttpRequestResponse();
        const httpRequestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    requestEmitter.emit("error", "value");
                });
            });
            return requestEmitter;
        });
        const httpsRequestFnc = jest.fn((options, callback) => {
            const emitter = new MockHttpRequestResponse();
            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    emitter.emit("error", "value");
                });
            });
            return emitter;
        });

        (https.request as any) = httpsRequestFnc;
        (http.request as any) = httpRequestFnc;

        try {
            await RestClient.getExpectString(new Session({hostname: "test"}), "/resource");
        } catch (err) {
            // Do nothing
        }

        expect(httpsRequestFnc).toHaveBeenCalled();
        expect(httpRequestFnc).not.toHaveBeenCalled();
    });

    it("should not error when streaming data", async () => {

        const fakeResponseStream: any = {
            write: jest.fn(),
            on: jest.fn((eventName: string, callback: any) => {
                if (eventName === "finish") callback();
            }),
            end: jest.fn(),
        };
        const fakeRequestStream: any = {
            on: jest.fn((_eventName: string, _callback: any) => {
                // do nothing
            }),
        };
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("{\"newData\":", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("\"response data\"}", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;
        let caughtError;

        try {
            await RestClient.putStreamed(new Session({
                hostname: "test",
            }), "/resource", [Headers.APPLICATION_JSON], fakeResponseStream, fakeRequestStream);

            await RestClient.postStreamed(new Session({
                hostname: "test",
            }), "/resource", [Headers.APPLICATION_JSON], fakeResponseStream, fakeRequestStream);

            await RestClient.putStreamedRequestOnly(new Session({
                hostname: "test",
            }), "/resource", [Headers.APPLICATION_JSON], fakeRequestStream);

            await RestClient.postStreamedRequestOnly(new Session({
                hostname: "test",
            }), "/resource", [Headers.APPLICATION_JSON], fakeRequestStream);

            await RestClient.getStreamed(new Session({
                hostname: "test",
            }), "/resource", [Headers.APPLICATION_JSON], fakeResponseStream);

            await RestClient.deleteStreamed(new Session({
                hostname: "test",
            }), "/resource", [Headers.APPLICATION_JSON], fakeResponseStream);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
    });

    it("should not error when streaming normalized data", async () => {
        jest.spyOn(os, "platform").mockReturnValue("win32");

        const fakeRequestStream = new PassThrough();
        const emitter = new MockHttpRequestResponse();
        const receivedArray: string[] = [];
        jest.spyOn(emitter, "write").mockImplementation((data) => {
            receivedArray.push(data.toString());
        });
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {
                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);
                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });
            return emitter;
        });
        (https.request as any) = requestFnc;
        let caughtError;
        try {
            await ProcessUtils.nextTick(() => {
                fakeRequestStream.write(Buffer.from("ChunkOne\r", "utf8"));
            });
            await ProcessUtils.nextTick(() => {
                fakeRequestStream.write(Buffer.from("\nChunkTwo\r", "utf8"));
            });
            await ProcessUtils.nextTick(() => {
                fakeRequestStream.end();
            });
            await RestClient.putStreamed(new Session({
                hostname: "test",
            }), "/resource", [Headers.APPLICATION_JSON], null, fakeRequestStream, false, true);
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
        // With CR holdback logic: "ChunkOne" (CR held), "\nChunkTwo" (CR+LF stripped to LF, then CR held), "\r" (final holdback)
        expect(receivedArray.length).toEqual(3);
        expect(receivedArray).toEqual(["ChunkOne", "\nChunkTwo", "\r"]);
    });

    it("should return full response when requested", async () => {
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("Sample data", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;

        const restOptions: IOptionsFullResponse = {
            resource: "/resource",
        };

        // create list of all properties
        const listOfClientProperties = Object.keys(CLIENT_PROPERTY);

        const data = await RestClient.getExpectFullResponse(new Session({hostname: "test"}), restOptions);
        listOfClientProperties.forEach((property) => expect((data as any)[`${property}`]).toBeDefined());
    });

    it("should return one part of response when requested", async () => {
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("Sample data", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;

        // asking only to return Response property
        const restOptions: IOptionsFullResponse = {
            resource: "/resource",
            dataToReturn: [CLIENT_PROPERTY.response]
        };

        // create list of all properties except the one requested
        const listOfClientProperties = Object.keys(CLIENT_PROPERTY);
        listOfClientProperties.splice(listOfClientProperties.indexOf(CLIENT_PROPERTY.response), 1);

        const data = await RestClient.getExpectFullResponse(new Session({hostname: "test"}), restOptions);

        expect(data.response).toBeDefined();
        listOfClientProperties.forEach((property) => expect((data as any)[`${property}`]).not.toBeDefined());
    });

    it("should return several parts of response when requested", async () => {
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("Sample data", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;

        // asking to return random properties
        const restOptions: IOptionsFullResponse = {
            resource: "/resource",
            dataToReturn: [CLIENT_PROPERTY.response, CLIENT_PROPERTY.data, CLIENT_PROPERTY.requestSuccess]
        };

        // create list of all properties except the requested ones
        const listOfClientProperties = Object.keys(CLIENT_PROPERTY);
        restOptions.dataToReturn.forEach((element) => {
            listOfClientProperties.splice(listOfClientProperties.indexOf(element), 1);
        });

        const data = await RestClient.getExpectFullResponse(new Session({hostname: "test"}), restOptions);
        restOptions.dataToReturn.forEach((property) => expect((data as any)[`${property}`]).toBeDefined());
        listOfClientProperties.forEach((property) => expect((data as any)[`${property}`]).not.toBeDefined());
    });

    it("should create buildOptions according to input parameter options 1", async () => {

        const httpsRequestFnc = jest.fn((options, callback) => {
            expect(options).toMatchSnapshot();
            const emitter = new MockHttpRequestResponse();
            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    emitter.emit("error", "value");
                });
            });
            return emitter;
        });

        (https.request as any) = httpsRequestFnc;

        // restore setPasswordAuth spy to its original implementation
        setPasswordAuthSpy.mockRestore();

        try {
            await RestClient.getExpectString(
                new Session({
                    hostname: "test",
                    port: 8080,
                    protocol: "https",
                    basePath: "baseURL",
                    type: "bearer",
                    tokenValue: "someToken"
                }),
                "/resource");
        } catch (err) {
            // Do nothing
        }
        expect(httpsRequestFnc).toHaveBeenCalled();
    });

    it("should create buildOptions according to input parameter options 2", async () => {

        const httpsRequestFnc = jest.fn((options, callback) => {
            expect(options).toMatchSnapshot();
            const emitter = new MockHttpRequestResponse();
            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    emitter.emit("error", "value");
                });
            });
            return emitter;
        });

        (https.request as any) = httpsRequestFnc;

        // restore setPasswordAuth spy to its original implementation
        setPasswordAuthSpy.mockRestore();

        let error;
        try {
            await RestClient.getExpectString(
                new Session({
                    hostname: "test",
                    port: 8080,
                    protocol: "https",
                    basePath: "baseURL",
                    type: "cert-pem",
                    cert: join(__dirname, "..", "..", "..", "..", "__tests__", "__integration__",
                        "cmd", "__tests__", "integration", "cli", "auth", "__resources__", "fakeCert.cert"),
                    certKey: join(__dirname, "..", "..", "..", "..", "__tests__", "__integration__",
                        "cmd", "__tests__", "integration", "cli", "auth", "__resources__", "fakeKey.key"),
                }),
                "/resource");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(httpsRequestFnc).toHaveBeenCalled();
        expect(error).toBeDefined();
    });

    it("Should error when trying to open an invalid certificate file path", async () => {
        const httpsRequestFnc = jest.fn((options, callback) => {
            expect(options).toMatchSnapshot();
            const emitter = new MockHttpRequestResponse();
            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    emitter.emit("error", "value");
                });
            });
            return emitter;
        });

        (https.request as any) = httpsRequestFnc;

        // restore setPasswordAuth spy to its original implementation
        setPasswordAuthSpy.mockRestore();

        let error;
        try {
            await RestClient.getExpectString(
                new Session({
                    hostname: "test",
                    port: 8080,
                    protocol: "https",
                    basePath: "baseURL",
                    type: "cert-pem",
                    cert: join(__dirname, "fakeCert.cert"),
                    certKey: join(__dirname, "fakeKey.key"),
                }),
                "/resource");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(httpsRequestFnc).not.toHaveBeenCalled();
        expect(error.message).toContain("Failed to open one or more PEM certificate files");
    });

    it("should convert line endings from LF to CRLF for streamed request on Windows", async () => {
        const fakeData = Buffer.from("\nabc\ndef\n");
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", fakeData);
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end");
                });
            });

            return emitter;
        });

        (https.request as any) = requestFnc;
        jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_WIN32);

        const responseStream = new PassThrough();
        await RestClient.getStreamed(new Session({
            hostname: "test"
        }), "/resource", [], responseStream, true);
        const result = await streamToString(responseStream);
        expect(result).toBe("\r\nabc\r\ndef\r\n");
    });

    describe("content encoding", () => {
        const responseText = "Request failed successfully";
        const rawBuffer = Buffer.from(responseText);
        const gzipBuffer = zlib.gzipSync(rawBuffer);
        afterEach(() => {
            (AbstractRestClient.prototype as any).mDecode = false;
        });

        it("should not error when decompressing gzip buffer", async () => {
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "Content-Encoding": "gzip" };
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", gzipBuffer);
                    });

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("end");
                    });
                });

                return emitter;
            });

            (https.request as any) = requestFnc;
            (AbstractRestClient.prototype as any).mDecode = true;

            const result = await RestClient.getExpectString(new Session({
                hostname: "test"
            }), "/resource");
            expect(result).toBe(responseText);
        });

        it("should not error when decompressing gzip buffer with lowercase header", async () => {
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "content-encoding": "gzip" };
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", gzipBuffer);
                    });

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("end");
                    });
                });

                return emitter;
            });

            (https.request as any) = requestFnc;
            (AbstractRestClient.prototype as any).mDecode = true;

            const result = await RestClient.getExpectString(new Session({
                hostname: "test"
            }), "/resource");
            expect(result).toBe(responseText);
        });

        it("should not error when decompressing gzip stream", async () => {
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "Content-Encoding": "gzip" };
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", gzipBuffer);
                    });

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("end");
                    });
                });

                return emitter;
            });

            (https.request as any) = requestFnc;
            (AbstractRestClient.prototype as any).mDecode = true;

            let responseStream = new PassThrough();
            await RestClient.getStreamed(new Session({
                hostname: "test"
            }), "/resource", [], responseStream, false);
            let result = await streamToString(responseStream);
            expect(result).toBe(responseText);

            responseStream = new PassThrough();
            await RestClient.getStreamed(new Session({
                hostname: "test"
            }), "/resource", [], responseStream, true);
            result = await streamToString(responseStream);
            expect(result).toBe(responseText);
        });

        it("should not error when decompressing truncated gzip stream with binary content", async () => {
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "Content-Encoding": "gzip" };
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", gzipBuffer.subarray(0, -10));
                    });

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("end");
                    });
                });

                return emitter;
            });

            (https.request as any) = requestFnc;
            (AbstractRestClient.prototype as any).mDecode = true;

            const responseStream = new PassThrough();
            await RestClient.getStreamed(new Session({
                hostname: "test"
            }), "/resource", [], responseStream, false);
            const result = await streamToString(responseStream);
            expect(result.length).toBeGreaterThan(0);
        });

        it("should error when decompressing invalid gzip buffer", async () => {
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "Content-Encoding": "gzip" };
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", rawBuffer);
                    });

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("end");
                    });
                });

                return emitter;
            });

            (https.request as any) = requestFnc;
            (AbstractRestClient.prototype as any).mDecode = true;
            let caughtError;

            try {
                await RestClient.getExpectString(new Session({
                    hostname: "test"
                }), "/resource");
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError instanceof ImperativeError).toBe(true);
            expect(caughtError.message).toContain("Failed to decompress response buffer");
        });

        it("should error when decompressing invalid gzip stream", async () => {
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "Content-Encoding": "gzip" };
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", rawBuffer);
                    });

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("end");
                    });
                });

                return emitter;
            });

            (https.request as any) = requestFnc;
            (AbstractRestClient.prototype as any).mDecode = true;
            const responseStream = new PassThrough();
            let caughtError;

            try {
                await RestClient.getStreamed(new Session({
                    hostname: "test"
                }), "/resource", [], responseStream);
                await streamToString(responseStream);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError instanceof ImperativeError).toBe(true);
            expect(caughtError.message).toContain("Failed to decompress response stream");
        });

        it("should error when decompressing truncated gzip stream with text content", async () => {
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "Content-Encoding": "gzip" };
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", gzipBuffer.subarray(0, -10));
                    });

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("end");
                    });
                });

                return emitter;
            });

            (https.request as any) = requestFnc;
            (AbstractRestClient.prototype as any).mDecode = true;
            const responseStream = new PassThrough();
            let caughtError;

            try {
                await RestClient.getStreamed(new Session({
                    hostname: "test"
                }), "/resource", [], responseStream, true);
                await streamToString(responseStream);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError instanceof ImperativeError).toBe(true);
            expect(caughtError.message).toContain("Failed to decompress response stream");
        });

        it("should decompress error message for streamed request", async () => {
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "Content-Encoding": "gzip" };
                    newEmit.statusCode = "400";
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", gzipBuffer);
                    });

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("end");
                    });
                });

                return emitter;
            });

            (https.request as any) = requestFnc;
            (AbstractRestClient.prototype as any).mDecode = true;
            const responseStream = new PassThrough();
            let caughtError;

            try {
                await RestClient.getStreamed(new Session({
                    hostname: "test"
                }), "/resource", [], responseStream);
                await streamToString(responseStream);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError instanceof ImperativeError).toBe(true);
            expect(caughtError.causeErrors).toContain(responseText);
        });

        it("should convert line endings from LF to CRLF for streamed request on Windows", async () => {
            const fakeData = zlib.gzipSync(Buffer.from("\nabc\ndef\n"));
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "Content-Encoding": "gzip" };
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", fakeData);
                    });

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("end");
                    });
                });

                return emitter;
            });

            (https.request as any) = requestFnc;
            (AbstractRestClient.prototype as any).mDecode = true;
            jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_WIN32);

            const responseStream = new PassThrough();
            await RestClient.getStreamed(new Session({
                hostname: "test"
            }), "/resource", [], responseStream, true);
            const result = await streamToString(responseStream);
            expect(result).toBe("\r\nabc\r\ndef\r\n");
        });
    });

    describe("private functions", () => {
        beforeEach(() => {
            // restore setPasswordAuth spy to its original implementation
            if (setPasswordAuthSpy) {
                setPasswordAuthSpy.mockRestore();
            }
            if ((Censor as any).mCensoredOptions.has("tokenType")) { (Censor as any).mCensoredOptions.delete("tokenType"); }
        });

        describe("setTokenAuth", () => {
            it("should return true when a session specifies a token", () => {
                // pretend that the session was created for a token
                const restClient: any = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_TOKEN,
                        tokenType: "FakeTokenType",
                        tokenValue: "FakeTokenValue"
                    })
                );

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const tokenWasSet: boolean = restClient["setTokenAuth"](restOptions);
                expect(tokenWasSet).toEqual(true);
                expect(restOptions.headers["Cookie"]).toBeDefined();
            });

            it("should log the token type when it is not a secure value", () => {
                // Create a logger, then feed that to anything that wants it
                const zoweLogger = Logger.getImperativeLogger();
                jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(zoweLogger);
                const zoweTraceLoggerSpy = jest.spyOn(zoweLogger, "trace");

                const restClient = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_TOKEN,
                        tokenType: "FakeTokenType",
                        tokenValue: "FakeTokenValue"
                    })
                );

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const tokenWasSet: boolean = (restClient as any).setTokenAuth(restOptions);
                expect(tokenWasSet).toEqual(true);
                expect(restOptions.headers["Cookie"]).toBeDefined();
                expect(zoweTraceLoggerSpy).toHaveBeenCalledWith("Using cookie authentication with token type FakeTokenType");
            });

            it("should log the token type when it is a secure value", () => {
                // Create a logger, then feed that to anything that wants it
                (Censor as any).mCensoredOptions.add("tokenType");
                const zoweLogger = Logger.getImperativeLogger();
                jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(zoweLogger);
                const zoweTraceLoggerSpy = jest.spyOn(zoweLogger, "trace");

                const restClient = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_TOKEN,
                        tokenType: "FakeTokenType",
                        tokenValue: "FakeTokenValue"
                    })
                );

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const tokenWasSet: boolean = (restClient as any).setTokenAuth(restOptions);
                expect(tokenWasSet).toEqual(true);
                expect(restOptions.headers["Cookie"]).toBeDefined();
                expect(zoweTraceLoggerSpy).toHaveBeenCalledWith("Using cookie authentication with token");
                expect(zoweTraceLoggerSpy).not.toHaveBeenCalledWith("Using cookie authentication with token type FakeTokenType");
            });

            it("should return false when a token session has no token value", () => {
                // pretend that the session was created for a token, but with no value
                const restClient: any = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_TOKEN,
                        tokenType: "FakeTokenType",
                        tokenValue: "FakeTokenValue"
                    })
                );
                delete restClient["mSession"]["mISession"].tokenValue;

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const tokenWasSet: boolean = restClient["setTokenAuth"](restOptions);
                expect(tokenWasSet).toEqual(false);
                expect(restOptions.headers["Cookie"]).not.toBeDefined();
            });
        });

        describe("setPasswordAuth", () => {
            it("should return true when a session specifies user and password", () => {
                // pretend that the session was created with a user and password
                const restClient: any = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_BASIC,
                        user: "FakeUser",
                        password: "FakePassword"
                    })
                );

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const passwordWasSet: boolean = restClient["setPasswordAuth"](restOptions);
                expect(passwordWasSet).toEqual(true);
                expect(restOptions.headers["Authorization"]).toBeDefined();
            });

            it("should return true when a session specifies base64EncodedAuth", () => {
                // pretend that the session was created with a base64 cred
                const restClient: any = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_BASIC,
                        base64EncodedAuth: "FakeBase64EncodedCred"
                    })
                );

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const passwordWasSet: boolean = restClient["setPasswordAuth"](restOptions);
                expect(passwordWasSet).toEqual(true);
                expect(restOptions.headers["Authorization"]).toBeDefined();
            });

            it("should return false when a basic auth session has no user, password, or Base64Cred", () => {
                // pretend that the session was created for basic auth, but has no creds
                const restClient: any = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_BASIC,
                        user: "FakeUser",
                        password: "FakePassword"
                    })
                );
                delete restClient["mSession"]["mISession"].user;
                delete restClient["mSession"]["mISession"].password;
                delete restClient["mSession"]["mISession"].base64EncodedAuth;

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const passwordWasSet: boolean = restClient["setPasswordAuth"](restOptions);
                expect(passwordWasSet).toEqual(false);
                expect(restOptions.headers["Authorization"]).not.toBeDefined();
            });
        });

        describe("setBearerAuth", () => {
            it("should return true when a session has a bearer token", () => {
                // pretend that the session was created for a bearer token
                const restClient: any = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_BEARER,
                        tokenValue: "FakeBearerTokenValue"
                    })
                );

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const bearerWasSet: boolean = restClient["setBearerAuth"](restOptions);
                expect(bearerWasSet).toEqual(true);
                expect(restOptions.headers["Authorization"]).toBeDefined();
            });

            it("should return false when a bearer token session has no token value", () => {
                // pretend that the session was created for a bearer token, but with no value
                const restClient: any = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_BEARER,
                        tokenValue: "FakeBearerTokenValue"
                    })
                );
                delete restClient["mSession"]["mISession"].tokenValue;

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const bearerWasSet: boolean = restClient["setBearerAuth"](restOptions);
                expect(bearerWasSet).toEqual(false);
                expect(restOptions.headers["Authorization"]).not.toBeDefined();
            });
        });

        describe("setCertPemAuth", () => {
            let readFileSyncSpy: any;

            beforeEach(() => {
                // pretend that readFileSync can read the cert and the cert key
                readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValue(
                    "Some fake data from ReadFileSync"
                );
            });

            afterEach(() => {
                // restore readFileSync to its original implementation
                readFileSyncSpy.mockRestore();
            });

            it("should return true when a session has a PEM cert", () => {
                // pretend that the session was created for a PEM cert
                const restClient: any = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_CERT_PEM,
                        cert: "FakePemCert",
                        certKey: "FakePemCertKey"
                    })
                );


                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const pemCertWasSet: boolean = restClient["setCertPemAuth"](restOptions);

                expect(readFileSyncSpy).toHaveBeenCalledWith(restClient["mSession"]["mISession"].cert);
                expect(readFileSyncSpy).toHaveBeenCalledWith(restClient["mSession"]["mISession"].certKey);
                expect(pemCertWasSet).toEqual(true);
            });

            it("should return false when a PEM cert session has no type", () => {
                // pretend that the session was created for a PEM cert, but with no type
                const restClient: any = new RestClient(
                    new Session({
                        hostname: "FakeHostName",
                        type: AUTH_TYPE_CERT_PEM,
                        cert: "FakePemCert",
                        certKey: "FakePemCertKey"
                    })
                );
                delete restClient["mSession"]["mISession"].type;

                // call the function that we want to test
                const restOptions: any = {
                    headers: {}
                };
                const pemCertWasSet: boolean = restClient["setCertPemAuth"](restOptions);

                expect(pemCertWasSet).toEqual(false);
                expect(readFileSyncSpy).not.toHaveBeenCalledWith(restClient["mSession"]["mISession"].cert);
                expect(readFileSyncSpy).not.toHaveBeenCalledWith(restClient["mSession"]["mISession"].certKey);
            });
        });

        describe('buildOptions', () => {
            const restSession = new Session({
                hostname: "FakeHostName",
                type: AUTH_TYPE_CERT_PEM,
                cert: "FakePemCert",
                certKey: "FakePemCertKey"
            });
            const privateRestClient = new RestClient(restSession) as any;
            let getSystemProxyUrlSpy: jest.SpyInstance;
            let getProxyAgentSpy: jest.SpyInstance;
            let setCertPemAuthSpy: jest.SpyInstance;

            beforeEach(() => {
                jest.clearAllMocks();
                getSystemProxyUrlSpy = jest.spyOn(ProxySettings, "getSystemProxyUrl");
                getProxyAgentSpy = jest.spyOn(ProxySettings, "getProxyAgent");
                setCertPemAuthSpy = jest.spyOn(privateRestClient, "setCertPemAuth");
            });

            it('Should add to options the proxy agent if proxy URL is in use', () => {
                const resource = '/resource';
                const request = '';
                const reqHeaders: any[] = [];
                const url = new URL('https://www.zowe.com');
                const proxyAgent = new HttpsProxyAgent(url, { rejectUnauthorized: true });
                getSystemProxyUrlSpy.mockReturnValue(url);
                getProxyAgentSpy.mockReturnValue(proxyAgent);
                setCertPemAuthSpy.mockReturnValue(true);
                const result = privateRestClient.buildOptions(resource, request, reqHeaders);
                expect(Object.keys(result)).toContain('agent');
            });

            it('Should add to options if a connection timeout is in use', () => {
                const resource = '/resource';
                const request = '';
                const reqHeaders: any[] = [];
                getSystemProxyUrlSpy.mockReturnValue(undefined);
                getProxyAgentSpy.mockReturnValue(undefined);
                setCertPemAuthSpy.mockReturnValue(true);
                privateRestClient["mSession"]["mISession"].socketConnectTimeout = 15000;

                const result = privateRestClient.buildOptions(resource, request, reqHeaders);
                expect(Object.keys(result)).toContain('timeout');
                expect(result.timeout).toEqual(15000);
            });
        });

        describe('validateRestHostname', () => {
            const restSession = new Session({
                hostname: "FakeHostName",
                type: AUTH_TYPE_CERT_PEM,
                cert: "FakePemCert",
                certKey: "FakePemCertKey"
            });
            const privateRestClient = new RestClient(restSession) as any;

            it('Should validate a hostname is not undefined', () => {
                let error: Error;
                const hostname: any = undefined;
                try {
                    privateRestClient.validateRestHostname(hostname);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error.message).toEqual("The hostname is required.");
            });

            it('Should validate a hostname should not contain a protocol', () => {
                let error: Error;
                const hostname = "http://www.example.com";
                try {
                    privateRestClient.validateRestHostname(hostname);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error.message).toEqual("The hostname should not contain the protocol.");
            });

            it('Should validate a hostname is okay without a protocol', () => {
                let error: Error;
                const hostname = "www.example.com";
                try {
                    privateRestClient.validateRestHostname(hostname);
                } catch (e) {
                    error = e;
                }
                expect(error).not.toBeDefined();
            });
        });

        describe("addScrtHeader", () => {
            const restSession = new Session({
                hostname: "FakeHostName",
                scrtData: {
                    "featureName": "FakeFeatureName",
                    "productId": "fakeProductId",
                    "productVersion": "fakeProductVersion"
                }
            });
            const restReqOpts = {
                "resource": "/NotZosmf/url",
                "reqHeaders": [] as any
            };
            const privateRestClient = new RestClient(restSession) as any;
            const impLogger = Logger.getImperativeLogger();
            let impErrorLoggerSpy: jest.SpyInstance;

            beforeEach(() => {
                jest.clearAllMocks();
                (restReqOpts as any).resource = "/NotZosmf/url";
                (restReqOpts as any).reqHeaders = [];
                jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(impLogger);
                impErrorLoggerSpy = jest.spyOn(impLogger, "error");
            });

            it("should NOT add a header for a zosmf request", () => {
                (restReqOpts as any).resource = "/zosmf/url";
                const impDebugLoggerSpy = jest.spyOn(impLogger, "debug");

                privateRestClient.addScrtHeader(restReqOpts);

                expect(restReqOpts.reqHeaders.length).toBe(0);
                expect(impDebugLoggerSpy).toHaveBeenCalledWith(
                    "addScrtHeader: SCRT headers are NOT sent to z/OSMF."
                );
            });

            it("should log an error if it fails to create a header", () => {
                const isScrtValidSpy = jest.spyOn(privateRestClient, "isScrtValid").mockReturnValue(false);
                const formScrtHeaderValSpy = jest.spyOn(privateRestClient, "formScrtHeaderVal");

                privateRestClient.addScrtHeader(restReqOpts);

                expect(restReqOpts.reqHeaders.length).toBe(0);
                expect(formScrtHeaderValSpy).toHaveBeenCalled();
                expect(isScrtValidSpy).toHaveBeenCalled();
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    "formScrtHeaderVal: No SCRT header is created when SCRT data is invalid."
                );
            });

            it("should add a header when when SCRT properties are available", () => {
                privateRestClient["mSession"]["mISession"].scrtData = {
                    featureName: "Fake Feature name",
                    productId: 'FkProdId',
                    productVersion: '12.34.56'
                };
                const formScrtHeaderValSpy = jest.spyOn(privateRestClient, "formScrtHeaderVal");

                privateRestClient.addScrtHeader(restReqOpts);

                expect(formScrtHeaderValSpy).toHaveBeenCalled();
                expect(restReqOpts.reqHeaders.length).toBe(1);
                expect(restReqOpts.reqHeaders[0]).toEqual(
                    { "Zowe-SCRT-client-feature":   "featureName='Fake Feature name', " +
                                                    "productId='FkProdId', productVersion='12.34.56'"
                    }
                );
            });

            it("should NOT included non SCRT properties in the header", () => {
                privateRestClient["mSession"]["mISession"].scrtData = {
                    featureName: "Valid SCRT property of Feature name",
                    productId: 'ValPrdId',
                    productVersion: '11.22.33',
                    nonScrtProp1: "nonScrtVal1",
                    nonScrtProp2: "nonScrtVal2",
                    nonScrtProp3: "nonScrtVal3",
                };
                const formScrtHeaderValSpy = jest.spyOn(privateRestClient, "formScrtHeaderVal");

                privateRestClient.addScrtHeader(restReqOpts);

                expect(formScrtHeaderValSpy).toHaveBeenCalled();
                expect(restReqOpts.reqHeaders.length).toBe(1);
                expect(restReqOpts.reqHeaders[0]).toEqual(
                    {
                        "Zowe-SCRT-client-feature":
                            "featureName='Valid SCRT property of Feature name', " +
                            "productId='ValPrdId', productVersion='11.22.33'"
                    }
                );
                expect(impErrorLoggerSpy).toHaveBeenCalledTimes(3);
                const nonScrtPropNms = ["nonScrtProp1", "nonScrtProp2", "nonScrtProp3"];
                for (const propNm of nonScrtPropNms) {
                    expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                        `isScrtValid: The non-SCRT property = '${propNm}' ` +
                        `will not be placed in an SCRT header.`
                    );
                }
            });
        });

        describe("getScrtFromEnv", () => {
            const scrtEnvVarName = "ZOWE_SCRT_CLIENT_FEATURE";
            const restSession = new Session({
                hostname: "FakeHostName"
            });
            const privateRestClient = new RestClient(restSession) as any;

            afterEach(() => {
                jest.clearAllMocks();
                delete process.env[scrtEnvVarName];
            });

            it("should return null when scrt is not set in environment", () => {
                const scrtVal = privateRestClient.getScrtFromEnv();
                expect(scrtVal).toBe(null);
            });

            it("should return null when featureName is not supplied", () => {
                process.env[scrtEnvVarName] = "Env value does not contain featureName";
                const impLogger = Logger.getImperativeLogger();
                jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(impLogger);
                const impErrorLoggerSpy = jest.spyOn(impLogger, "error");

                const scrtVal = privateRestClient.getScrtFromEnv();

                expect(scrtVal).toBe(null);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    "getScrtFromEnv: Required property = 'featureName' was not supplied in environment variable " +
                    "'ZOWE_SCRT_CLIENT_FEATURE'. Value: Env value does not contain featureName"
                );
            });

            it("should return scrtData with only featureName", () => {
                process.env[scrtEnvVarName] = "featureName = 'Environment Feature Name'";
                const expectedScrt = {
                    featureName: 'Environment Feature Name'
                };
                const scrtVal = privateRestClient.getScrtFromEnv();
                expect(scrtVal).toEqual(expectedScrt);
            });

            it("should return scrtData with featureName and productId", () => {
                process.env[scrtEnvVarName] = "featureName = 'Environment Feature Name', " +
                    "productId='envPrdId'";
                const expectedScrt = {
                    featureName: 'Environment Feature Name',
                    productId: 'envPrdId'
                };
                const scrtVal = privateRestClient.getScrtFromEnv();
                expect(scrtVal).toEqual(expectedScrt);
            });

            it("should return scrtData with featureName, productId, and productVersion", () => {
                process.env[scrtEnvVarName] = "featureName = 'Environment Feature Name', " +
                    "productId='envPrdId'   productVersion = \"11.22.33\"";
                const expectedScrt = {
                    featureName: 'Environment Feature Name',
                    productId: 'envPrdId',
                    productVersion: '11.22.33',
                };
                const scrtVal = privateRestClient.getScrtFromEnv();
                expect(scrtVal).toEqual(expectedScrt);
            });
        });

        describe("formScrtHeaderVal", () => {
            it("should return null when no SCRT data is supplied", () => {
                const restSession = new Session({
                    hostname: "FakeHostName"
                });
                const privateRestClient = new RestClient(restSession) as any;

                const impLogger = Logger.getImperativeLogger();
                const impErrorLoggerSpy = jest.spyOn(impLogger, "error");
                jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(impLogger);

                const scrtData = null as any;
                const scrtHeaderVal = privateRestClient.formScrtHeaderVal(scrtData);

                expect(scrtHeaderVal).toBe(null);
                expect(impErrorLoggerSpy).toHaveBeenCalledTimes(2);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    "isScrtValid: The supplied scrtData is null or undefined."
                );
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    "formScrtHeaderVal: No SCRT header is created when SCRT data is invalid."
                );
            });

            it("should return scrtData with featureName, productId, and productVersion", () => {
                const restSession = new Session({
                    hostname: "FakeHostName"
                });
                const privateRestClient = new RestClient(restSession) as any;

                const scrtData = {
                    featureName: 'Fake Feature Name',
                    productId: 'FkProdId',
                    productVersion: '11.22.33',
                };

                const scrtHeaderVal = privateRestClient.formScrtHeaderVal(scrtData);
                expect(scrtHeaderVal).toEqual("featureName='Fake Feature Name', "+
                    "productId='FkProdId', productVersion='11.22.33'"
                );
            });

            it("should replace unescaped quotes in SCRT values", () => {
                const restSession = new Session({
                    hostname: "FakeHostName"
                });
                const privateRestClient = new RestClient(restSession) as any;

                const scrtData = {
                    featureName: "Fake 'Feature' Name",
                    productId: 'Fk"Pr"Id'
                };

                const scrtHeaderVal = privateRestClient.formScrtHeaderVal(scrtData);
                // In the actual header there are only single backslash escape characters.
                // Jest must use use JSON.stringify, which adds extra backslashes.
                expect(scrtHeaderVal).toEqual("featureName='Fake \\'Feature\\' Name', " +
                    "productId='Fk\\\"Pr\\\"Id'"
                );
            });
        });

        describe("isScrtValid", () => {
            const restSession = new Session({
                hostname: "FakeHostName"
            });
            const privateRestClient = new RestClient(restSession) as any;

            const impLogger = Logger.getImperativeLogger();
            let impErrorLoggerSpy: jest.SpyInstance;

            beforeEach(() => {
                jest.clearAllMocks();
                jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(impLogger);
                impErrorLoggerSpy = jest.spyOn(impLogger, "error");
            });

            it("should return false when scrtData is null", () => {
                const isValid = privateRestClient.isScrtValid(null);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    "isScrtValid: The supplied scrtData is null or undefined."
                );
            });

            it("should return false if featureName is missing", () => {
                const scrtData = {
                    productId: 'FakeProductId',
                    productVersion: 'FakeVersion',
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    "isScrtValid: featureName is null or undefined."
                );
            });

            it("should return false if featureName is blank", () => {
                const scrtData = {
                    featureName: "   ",
                    productId: 'FakeProductId',
                    productVersion: 'FakeVersion',
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    "isScrtValid: 'featureName' is blank."
                );
            });

            it("should return true if only featureName is supplied", () => {
                const scrtData = {
                    featureName: "Fake Feature name"
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(true);
            });

            it("should return true if all SCRT properties are valid", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productId: 'FkProdId',
                    productVersion: '12.34.56',
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(true);
            });

            it("should return false if featureName is longer than 48", () => {
                const featNameVal = "This feature name is definitely longer than 48 characters";
                const scrtData = {
                    featureName: featNameVal,
                    productId: 'FakeProductId',
                    productVersion: 'FakeVersion',
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'featureName' is longer than 48 bytes. Value = '${featNameVal}'`
                );
            });

            it("should return false when productId is null", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productId: null as any
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(`isScrtValid: productId is null.`);
            });

            it("should return false if productId is blank", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productId: '    '
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    "isScrtValid: 'productId' is blank."
                );
            });

            it("should return false if productId is longer than 8", () => {
                const productIdVal = "This product ID is longer than 8 characters";
                const scrtData = {
                    featureName: "Fake Feature name",
                    productId: productIdVal
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'productId' is longer than 8 bytes. Value = '${productIdVal}'`
                );
            });

            it("should return false when productVersion is null", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productId: 'FakPrdId',
                    productVersion: null as any
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(`isScrtValid: productVersion is null.`);
            });

            it("should return false if productVersion is blank", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: '    '
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    "isScrtValid: 'productVersion' is blank."
                );
            });

            it("should return false if productVersion is longer than 8", () => {
                const productVersionVal = "This product version is longer than 8 characters";
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: productVersionVal
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'productVersion' is longer than 8 bytes. Value = ` +
                    `'${productVersionVal}'`
                );
            });

            it("should return false if productVersion format is not ver.rel.level", () => {
                const productVersionVal = "123.456";
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: productVersionVal
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'productVersion' is not formatted as vv.rr.mm Value = ` +
                    `'${productVersionVal}'`
                );
            });

            it("should return false if version part of productVersion is longer than 2", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: "123.45.6"
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'version' is longer than 2 bytes. Value = '123'`
                );
            });

            it("should return false if version part of productVersion is blank", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: "  .12.34"
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'version' is blank.`
                );
            });

            it("should return false if version part of productVersion is not numeric", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: "ab.12.34"
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'version' is not a numeric value = 'ab'`
                );
            });

            it("should return false if release part of productVersion is longer than 2", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: "44.123.5"
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'release' is longer than 2 bytes. Value = '123'`
                );
            });

            it("should return false if release part of productVersion is blank", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: "12.  .34"
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'release' is blank.`
                );
            });

            it("should return false if release part of productVersion is not numeric", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: "12.ab.34"
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'release' is not a numeric value = 'ab'`
                );
            });

            it("should return false if modLevel part of productVersion is longer than 2", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: "44.5.123"
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'modLevel' is longer than 2 bytes. Value = '123'`
                );
            });

            it("should return false if modLevel part of productVersion is blank", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: "12.34.  "
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'modLevel' is blank.`
                );
            });

            it("should return false if modLevel part of productVersion is not numeric", () => {
                const scrtData = {
                    featureName: "Fake Feature name",
                    productVersion: "12.34.ab"
                };
                const isValid = privateRestClient.isScrtValid(scrtData);
                expect(isValid).toBe(false);
                expect(impErrorLoggerSpy).toHaveBeenCalledWith(
                    `isScrtValid: 'modLevel' is not a numeric value = 'ab'`
                );
            });
        });


        (os.platform() === "win32" ? describe : describe.skip)("CRLF at chunk boundaries with newline normalization", () => {
            it("should handle CRLF sequence split across chunk boundary", async () => {
                const session = new Session({
                    hostname: "test",
                    port: 443,
                    protocol: "https",
                });

                const client = new RestClient(session);

                // Create a stream that emits CRLF split across two chunks
                const requestStream = new PassThrough();

                // Mock the https.request to capture what is written
                const writtenChunks: Buffer[] = [];
                const mockRequest: any = new EventEmitter();
                mockRequest.write = jest.fn((chunk: Buffer) => {
                    writtenChunks.push(Buffer.from(chunk));
                });
                mockRequest.end = jest.fn();
                mockRequest.setTimeout = jest.fn();
                mockRequest.on = jest.fn().mockReturnThis();

                jest.spyOn(https, "request").mockImplementation((_options: any, callback: any) => {
                    // Simulate successful response
                    setImmediate(() => {
                        const response: any = new EventEmitter();
                        response.statusCode = 200;
                        response.headers = {};
                        callback(response);
                        setImmediate(() => {
                            response.emit("data", Buffer.from("OK"));
                            response.emit("end");
                        });
                    });
                    return mockRequest as any;
                });

                requestStream.write(Buffer.from("abc\r"));
                requestStream.write(Buffer.from("\ndef\r\n"));
                requestStream.end();

                await client.request({
                    resource: "/test",
                    request: "PUT",
                    requestStream,
                    normalizeRequestNewLines: true
                });

                // Verify that CR was stripped (CRLF -> LF)
                // "abc\r" becomes "abc" (CR held), "\ndef\r\n" prepends CR to get "\r\ndef\r\n" which becomes "\ndef\n" (CRLF stripped)
                const allWritten = Buffer.concat(writtenChunks);
                expect(allWritten.toString()).toBe("abc\ndef\n");
            });

            it("should preserve standalone CR at chunk boundary", async () => {
                const session = new Session({
                    hostname: "test",
                    port: 443,
                    protocol: "https",
                });

                const client = new RestClient(session);

                const requestStream = new PassThrough();

                const writtenChunks: Buffer[] = [];
                const mockRequest: any = new EventEmitter();
                mockRequest.write = jest.fn((chunk: Buffer) => {
                    writtenChunks.push(Buffer.from(chunk));
                });
                mockRequest.end = jest.fn();
                mockRequest.setTimeout = jest.fn();
                mockRequest.on = jest.fn().mockReturnThis();

                jest.spyOn(https, "request").mockImplementation((_options: any, callback: any) => {
                    setImmediate(() => {
                        const response: any = new EventEmitter();
                        response.statusCode = 200;
                        response.headers = {};
                        callback(response);
                        setImmediate(() => {
                            response.emit("data", Buffer.from("OK"));
                            response.emit("end");
                        });
                    });
                    return mockRequest as any;
                });

                requestStream.write(Buffer.from("abc\r"));
                requestStream.write(Buffer.from("xyz"));
                requestStream.end();

                await client.request({
                    resource: "/test",
                    request: "PUT",
                    requestStream,
                    normalizeRequestNewLines: true
                });

                // Verify that standalone CR is preserved
                const allWritten = Buffer.concat(writtenChunks);
                expect(allWritten.toString()).toBe("abc\rxyz");
            });

            it("should handle multiple CRLF sequences across boundaries", async () => {
                const session = new Session({
                    hostname: "test",
                    port: 443,
                    protocol: "https",
                });

                const client = new RestClient(session);

                const requestStream = new PassThrough();

                const writtenChunks: Buffer[] = [];
                const mockRequest: any = new EventEmitter();
                mockRequest.write = jest.fn((chunk: Buffer) => {
                    writtenChunks.push(Buffer.from(chunk));
                });
                mockRequest.end = jest.fn();
                mockRequest.setTimeout = jest.fn();
                mockRequest.on = jest.fn().mockReturnThis();

                jest.spyOn(https, "request").mockImplementation((_options: any, callback: any) => {
                    setImmediate(() => {
                        const response: any = new EventEmitter();
                        response.statusCode = 200;
                        response.headers = {};
                        callback(response);
                        setImmediate(() => {
                            response.emit("data", Buffer.from("OK"));
                            response.emit("end");
                        });
                    });
                    return mockRequest as any;
                });

                requestStream.write(Buffer.from("line1\r"));
                requestStream.write(Buffer.from("\nline2\r\n"));
                requestStream.write(Buffer.from("line3\r"));
                requestStream.write(Buffer.from("\n"));
                requestStream.end();

                await client.request({
                    resource: "/test",
                    request: "PUT",
                    requestStream,
                    normalizeRequestNewLines: true
                });

                // All CRLF should be converted to LF
                const allWritten = Buffer.concat(writtenChunks);
                expect(allWritten.toString()).toBe("line1\nline2\nline3\n");
            });

            it("should handle CR at end of stream correctly", async () => {
                const session = new Session({
                    hostname: "test",
                    port: 443,
                    protocol: "https",
                });

                const client = new RestClient(session);

                const requestStream = new PassThrough();

                const writtenChunks: Buffer[] = [];
                const mockRequest: any = new EventEmitter();
                mockRequest.write = jest.fn((chunk: Buffer) => {
                    writtenChunks.push(Buffer.from(chunk));
                });
                mockRequest.end = jest.fn();
                mockRequest.setTimeout = jest.fn();
                mockRequest.on = jest.fn().mockReturnThis();

                jest.spyOn(https, "request").mockImplementation((_options: any, callback: any) => {
                    setImmediate(() => {
                        const response: any = new EventEmitter();
                        response.statusCode = 200;
                        response.headers = {};
                        callback(response);
                        setImmediate(() => {
                            response.emit("data", Buffer.from("OK"));
                            response.emit("end");
                        });
                    });
                    return mockRequest as any;
                });

                requestStream.write(Buffer.from("data\r"));
                requestStream.end();

                await client.request({
                    resource: "/test",
                    request: "PUT",
                    requestStream,
                    normalizeRequestNewLines: true
                });

                // CR at end should be preserved
                const allWritten = Buffer.concat(writtenChunks);
                expect(allWritten.toString()).toBe("data\r");
            });
        });
    });
});
