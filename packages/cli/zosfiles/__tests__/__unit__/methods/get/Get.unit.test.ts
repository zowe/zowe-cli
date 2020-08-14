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

import { posix } from "path";
import { Session } from "@zowe/imperative";
import { ZosFilesMessages } from "../../../../";
import { ZosmfHeaders, ZosmfRestClient } from "../../../../../rest";
import { Get, IGetOptions } from "../../../../src/api/methods/get";
import { ZosFilesConstants } from "../../../../src/api/constants/ZosFiles.constants";

describe("z/OS Files - View", () => {
    const dsname = "USER.DATA.SET";
    const ussfile = "USER.TXT";
    const content = Buffer.from("This\nis\r\na\ntest");

    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    describe("dataset", () => {
        const zosmfExpectSpy = jest.spyOn(ZosmfRestClient, "getExpectBuffer");

        beforeEach(() => {
            zosmfExpectSpy.mockClear();
            zosmfExpectSpy.mockImplementation(() => content);
        });

        it("should throw an error if the data set name is null", async () => {
            let response;
            let caughtError;

            // Test for NULL
            try {
                response = await Get.dataSet(dummySession, null);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should throw an error if the data set name is not defined", async () => {
            let response;
            let caughtError;

            // Test for UNDEFINED
            try {
                response = await Get.dataSet(dummySession, undefined);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should throw an error if the data set name is empty", async () => {
            let response;
            let caughtError;
            // Test for EMPTY
            try {
                response = await Get.dataSet(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should get data set content", async () => {
            let response;
            let caughtError;

            try {
                response = await Get.dataSet(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual(content);

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, []);
        });

        it("should get data set content in binary mode", async () => {
            let response;
            let caughtError;
            const binary = true;

            try {
                response = await Get.dataSet(dummySession, dsname, {binary});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual(content);

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_BINARY]);
        });

        it("should get data set content with encoding", async () => {
            let response;
            let caughtError;
            const encoding = 285;

            try {
                response = await Get.dataSet(dummySession, dsname, {encoding});
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual(content);

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, [{ "X-IBM-Data-Type": "text;fileEncoding=285" }]);
        });

        it("should get data set content with volume option", async () => {
            let response;
            let caughtError;
            const options: IGetOptions = {};
            options.volume = "IBMBOL";

            try {
                response = await Get.dataSet(dummySession, dsname, options);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, `-(${options.volume})`, dsname);


            expect(caughtError).toBeUndefined();
            expect(response).toEqual(content);

            expect(zosmfExpectSpy).toHaveBeenCalledTimes(1);
            expect(zosmfExpectSpy).toHaveBeenCalledWith(dummySession, endpoint, []);
        });

        describe("uss file", () => {
            const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "getExpectBuffer");

            beforeEach(() => {
                zosmfExpectSecondSpy.mockClear();
                zosmfExpectSecondSpy.mockImplementation(() => content);
            });

            it("should throw an error if the uss file name is null", async () => {
                let response;
                let caughtError;

                // Test for NULL
                try {
                    response = await Get.USSFile(dummySession, null);
                } catch (e) {
                    caughtError = e;
                }

                expect(response).toBeUndefined();
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);

            });
            it("should throw an error if the uss file name is not defined", async () => {
                let response;
                let caughtError;

                try {
                    response = await Get.USSFile(dummySession, undefined);
                } catch (e) {
                    caughtError = e;
                }

                expect(response).toBeUndefined();
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);
            });

            it("should throw an error if the uss file name is empty", async () => {
                let response;
                let caughtError;

                try {
                    response = await Get.USSFile(dummySession, "");
                } catch (e) {
                    caughtError = e;
                }

                expect(response).toBeUndefined();
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);
            });

            it("should get uss file content", async () => {
                let response;
                let caughtError;

                try {
                    response = await Get.USSFile(dummySession, ussfile);
                } catch (e) {
                    caughtError = e;
                }

                const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, ussfile);

                expect(caughtError).toBeUndefined();
                expect(response).toEqual(content);

                expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
                expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint, []);
            });

            it("should get uss file content in binary mode", async () => {
                let response;
                let caughtError;
                const binary = true;

                try {
                    response = await Get.USSFile(dummySession, ussfile, {binary});
                } catch (e) {
                    caughtError = e;
                }

                const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, ussfile);

                expect(caughtError).toBeUndefined();
                expect(response).toEqual(content);

                expect(zosmfExpectSecondSpy).toHaveBeenCalledTimes(1);
                expect(zosmfExpectSecondSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_BINARY]);
            });
        });
    });
});
