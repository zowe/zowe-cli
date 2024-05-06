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
import {
    AUTH_TYPE_BASIC, AUTH_TYPE_BEARER, AUTH_TYPE_CERT_PEM, AUTH_TYPE_TOKEN
} from "../../src/session/SessConstants";
import { RestClient } from "../../src/client/RestClient";
import { Headers } from "../../src/client/Headers";
import { ProcessUtils } from "../../../utilities";
import { MockHttpRequestResponse } from "./__model__/MockHttpRequestResponse";
import { EventEmitter } from "events";
import { ImperativeError } from "../../../error";
import { IOptionsFullResponse } from "../../src/client/doc/IOptionsFullResponse";
import { CLIENT_PROPERTY } from "../../src/client/types/AbstractRestClientProperties";
import { PassThrough } from "stream";
import * as zlib from "zlib";
import * as streamToString from "stream-to-string";
import { AbstractRestClient } from "../../src/client/AbstractRestClient";
import * as os from "os";
import { join } from "path";
import { IO } from "../../../io";

/**
 * To test the AbstractRestClient, we use the existing default RestClient which
 * extends AbstractRestClient to use as a __model__.
 */

describe("AbstractRestClient tests", () => {
    let setPasswordAuthSpy: any;

    beforeEach(() => {
        // pretend that basic auth was successfully set
        setPasswordAuthSpy = jest.spyOn(AbstractRestClient.prototype as any, "setPasswordAuth");
        setPasswordAuthSpy.mockReturnValue(true);
    });

    it("should not append any headers to a request by default", () => {
        const client = new RestClient(new Session({hostname: "test"}));
        expect((client as any).appendHeaders(["Test"])).toMatchSnapshot();
        expect((client as any).appendHeaders(undefined)).toMatchSnapshot();
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

    it("should throw an error when when no creds are in the session", async () => {
        // restore setPasswordAuth spy to its original implementation
        setPasswordAuthSpy.mockRestore();

        let caughtError;
        try {
            await RestClient.getExpectString(new Session({
                hostname: "test"
            }), "/resource");
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError instanceof ImperativeError).toBe(true);
        expect(caughtError.message).toContain("No credentials for a BASIC or TOKEN type of session");
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
            const data = await RestClient.getExpectJSON<IResponseload>(new Session({hostname: "test"}), "/resource");
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
            const data = await RestClient.postExpectJSON<IResponseload>(new Session({hostname: "test"}),
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

        let error;

        try {
            await RestClient.getExpectString(new Session({hostname: "test", protocol: "http"}), "/resource");
        } catch (thrownError) {
            error = thrownError;
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

        let error;
        try {
            await RestClient.getExpectString(new Session({hostname: "test"}), "/resource");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(httpsRequestFnc).toHaveBeenCalled();
        expect(httpRequestFnc).not.toHaveBeenCalled();
    });

    it("should not error when streaming data", async () => {

        interface IPayload {
            data: string;
        }

        const fakeResponseStream: any = {
            write: jest.fn(),
            on: jest.fn(),
            end: jest.fn(),
            writableFinished: true
        };
        const fakeRequestStream: any = {
            on: jest.fn((eventName: string, callback: any) => {
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

        let error;
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
        } catch (thrownError) {
            error = thrownError;
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
                        newEmit.emit("data", gzipBuffer.slice(0, -10));
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
            expect(caughtError.message).toMatchSnapshot();
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
            expect(caughtError.message).toMatchSnapshot();
        });

        it("should error when decompressing truncated gzip stream with text content", async () => {
            const emitter = new MockHttpRequestResponse();
            const requestFnc = jest.fn((options, callback) => {
                ProcessUtils.nextTick(async () => {

                    const newEmit = new MockHttpRequestResponse();
                    newEmit.headers = { "Content-Encoding": "gzip" };
                    callback(newEmit);

                    await ProcessUtils.nextTick(() => {
                        newEmit.emit("data", gzipBuffer.slice(0, -10));
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
            expect(caughtError.message).toMatchSnapshot();
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
    });
});
