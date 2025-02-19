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

jest.mock("path");
import * as path from "path";
import * as https from "https";
import { Session } from "../../src/session/Session";
import { EventEmitter } from "events";
import { ProcessUtils } from "../../../utilities";
import { MockHttpRequestResponse } from "./__model__/MockHttpRequestResponse";
import { CustomRestClient } from "./__model__/CustomRestClient";
import { CustomRestClientWithProcessError, EXPECTED_REST_ERROR } from "./__model__/CustomRestClientWithProcessError";
import { getRandomBytes } from "../../../../__tests__/src/TestUtil";
import { RestClientError } from "../../src/client/RestClientError";
import { IOptionsFullResponse } from "../../src/client/doc/IOptionsFullResponse";
import { IRestClientResponse } from "../../src/client/doc/IRestClientResponse";
import { CLIENT_PROPERTY } from "../../src/client/types/AbstractRestClientProperties";
import { AbstractRestClient } from "../../src/client/AbstractRestClient";

/**
 * RestClient is already tested vie the AbstractRestClient test, so we will extend RestClient
 * with CustomRestClient to test things above and beyond RestClient.
 */

describe("RestClient tests", () => {
    let setPasswordAuthSpy: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // pretend that basic auth was successfully set
        setPasswordAuthSpy = jest.spyOn(AbstractRestClient.prototype as any, "setPasswordAuth");
        setPasswordAuthSpy.mockReturnValue(true);
    });

    it("should add our custom header", async () => {

        const emitter = new MockHttpRequestResponse();

        (path.posix.join as jest.Mock<any>).mockReturnValueOnce("/mocked");

        const httpsRequestFnc = jest.fn((options, callback) => {
            expect(options).toMatchSnapshot();
            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    emitter.emit("error", "value");
                });
            });

            return emitter;
        });

        (https.request as any) = httpsRequestFnc;

        try {
            await CustomRestClient.getExpectString(new Session({hostname: "test"}), "/resource");
        } catch (err) {
            // Do nothing
        }
        expect(path.posix.join).toHaveBeenCalledTimes(2);
        expect(path.posix.join).toHaveBeenCalledWith(path.posix.sep, "", "/resource");
        expect(httpsRequestFnc).toHaveBeenCalled();
    });

    it("should add our custom header for JSON responses", async () => {

        interface IDoesNotMatter {
            data: string;
        }

        (path.posix.join as jest.Mock<any>).mockReturnValueOnce("/mocked");

        const emitter = new MockHttpRequestResponse();
        const httpsRequestFnc = jest.fn((options, callback) => {
            expect(options).toMatchSnapshot();

            ProcessUtils.nextTick(() => {
                callback(new EventEmitter());
                ProcessUtils.nextTick(() => {
                    emitter.emit("error", "value");
                });
            });

            return emitter;
        });

        (https.request as any) = httpsRequestFnc;

        try {
            await CustomRestClient.getExpectJSON<IDoesNotMatter>(new Session({hostname: "test"}), "/resource");
        } catch (err) {
            // Do nothing
        }

        expect(path.posix.join).toHaveBeenCalledTimes(2);
        expect(path.posix.join).toHaveBeenCalledWith(path.posix.sep, "", "/resource");
        expect(httpsRequestFnc).toHaveBeenCalled();
    });

    it("should provide the ability to process encountered errors", async () => {
        let error;

        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                newEmit.statusCode = "400"; // return a failed status code so that our processError gets called
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("{\"newData\":", "utf8"));
                });

                // missing closing bracket
                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", Buffer.from("\"response data\"}", "utf8"));
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end"); // request is finished
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        try {
            await CustomRestClientWithProcessError.getExpectString(new Session(
                {hostname: "google.corn"}),
            "/my/fake/resource/is/here.xml");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(RestClientError);
        expect(error.message).toContain(EXPECTED_REST_ERROR.msg);
    });

    it("should be able to return a buffer from various types of requests", async () => {

        const randomByteLength = 40;
        let randomBytes1 = await getRandomBytes(randomByteLength);
        let randomBytes2 = await getRandomBytes(randomByteLength);
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                newEmit.statusCode = "200";
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", randomBytes1);
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", randomBytes2);
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end"); // request is finished
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;
        let response: Buffer;
        try {
            response = await CustomRestClient.getExpectBuffer(new Session({hostname: "test"}), "/resource");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toEqual(Buffer.concat([randomBytes1, randomBytes2]));

        randomBytes1 = await getRandomBytes(randomByteLength);
        randomBytes2 = await getRandomBytes(randomByteLength);
        try {
            response = await CustomRestClient.deleteExpectBuffer(new Session({hostname: "test"}), "/resource");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toEqual(Buffer.concat([randomBytes1, randomBytes2]));

        randomBytes1 = await getRandomBytes(randomByteLength);
        randomBytes2 = await getRandomBytes(randomByteLength);
        try {
            response = await CustomRestClient.postExpectBuffer(new Session({hostname: "test"}), "/resource");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toEqual(Buffer.concat([randomBytes1, randomBytes2]));


        randomBytes1 = await getRandomBytes(randomByteLength);
        randomBytes2 = await getRandomBytes(randomByteLength);
        try {
            response = await CustomRestClient.putExpectBuffer(new Session({hostname: "test"}), "/resource", [], {});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toEqual(Buffer.concat([randomBytes1, randomBytes2]));
    });
    it("should be able to return full client response from various types of requests", async () => {

        const randomByteLength = 40;
        let randomBytes1 = await getRandomBytes(randomByteLength);
        let randomBytes2 = await getRandomBytes(randomByteLength);
        const emitter = new MockHttpRequestResponse();
        const requestFnc = jest.fn((options, callback) => {
            ProcessUtils.nextTick(async () => {

                const newEmit = new MockHttpRequestResponse();
                newEmit.statusCode = "200";
                callback(newEmit);

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", randomBytes1);
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("data", randomBytes2);
                });

                await ProcessUtils.nextTick(() => {
                    newEmit.emit("end"); // request is finished
                });
            });
            return emitter;
        });

        (https.request as any) = requestFnc;

        let error;
        let response: IRestClientResponse;
        const reqOptions: IOptionsFullResponse = {
            resource: "/resource"
        };

        const listOfClientProperties = Object.keys(CLIENT_PROPERTY);

        try {
            response = await CustomRestClient.getExpectFullResponse(new Session({hostname: "test"}), reqOptions);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        expect(response.data).toEqual(Buffer.concat([randomBytes1, randomBytes2]));
        listOfClientProperties.forEach((property) => expect((response as any)[`${property}`]).toBeDefined());

        randomBytes1 = await getRandomBytes(randomByteLength);
        randomBytes2 = await getRandomBytes(randomByteLength);
        try {
            response = await CustomRestClient.deleteExpectFullResponse(new Session({hostname: "test"}), reqOptions);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        expect(response.data).toEqual(Buffer.concat([randomBytes1, randomBytes2]));
        listOfClientProperties.forEach((property) => expect((response as any)[`${property}`]).toBeDefined());

        randomBytes1 = await getRandomBytes(randomByteLength);
        randomBytes2 = await getRandomBytes(randomByteLength);
        try {
            response = await CustomRestClient.postExpectFullResponse(new Session({hostname: "test"}), reqOptions);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        expect(response.data).toEqual(Buffer.concat([randomBytes1, randomBytes2]));
        listOfClientProperties.forEach((property) => expect((response as any)[`${property}`]).toBeDefined());

        randomBytes1 = await getRandomBytes(randomByteLength);
        randomBytes2 = await getRandomBytes(randomByteLength);
        try {
            response = await CustomRestClient.putExpectFullResponse(new Session({hostname: "test"}), reqOptions);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        expect(response.data).toEqual(Buffer.concat([randomBytes1, randomBytes2]));
        listOfClientProperties.forEach((property) => expect((response as any)[`${property}`]).toBeDefined());
    });

});
