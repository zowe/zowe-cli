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

import { ICreateDataSetOptions, ZosFilesConstants } from "../../../../src";
import { Session } from "@zowe/imperative";
import * as http from "http";

const PRETEND_SESSION = new Session({
    user: "user",
    password: "password",
    hostname: "localhost",
    port: 3000,
    protocol: "http",
    type: "basic",
    rejectUnauthorized: false
});

describe("Create Dataset", () => {
    const dsname = "***REMOVED***";

    const setupMockServer = (done: any) => {
        const req = http.request({
            hostname: PRETEND_SESSION.ISession.hostname,
            port: PRETEND_SESSION.ISession.port,
            method: "POST",
            path: "/mock/response",
            headers: {
                "Content-Type": "application/json"
            }
        }, (res) => {
            // Imperative.console.info("Response: " + res.statusCode + " " + res.statusMessage);
            done();
        });

        req.on("error", (e) => {
            // Imperative.console.info("Error: " + inspect(e));
            done();
        });

        const mockEndpoint = {
            endpoint: ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname,
            content: "",
            method: "POST",
            status: 201
        };

        req.write(JSON.stringify(mockEndpoint), () => {
            // done();
        });
        req.end();
    };

    const clearAllMocks = (done: any) => {
        const req = http.request({
            hostname: PRETEND_SESSION.ISession.hostname,
            port: PRETEND_SESSION.ISession.port,
            method: "DELETE",
            path: "/mock/clear/all"
        }, () => {
            done();
        });
        req.end();
    };

    // beforeAll((done) => {
    //   // Initialize mock server
    //   // Basic setup of endpoints
    //
    //   setupMockServer(done);
    // });

    // afterAll((done) => {
    //   // clear all endpoints
    //   // disconnect the mock server
    //
    //   clearAllMocks(done);
    // });

    const options: ICreateDataSetOptions = {} as any;

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("should create a partitioned data set", async () => {
        // const response = await Create.dataSet(PRETEND_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname, options);

        // expect(response.success).toBe(true);
        // expect(response.commandResponse).toContain(ZosFilesMessages.dataSetCreatedSuccessfully.message);
    });

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("should create a sequential data set", async () => {
        // const response = await Create.dataSet(PRETEND_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname, options);

        // expect(response.success).toBe(true);
        // expect(response.commandResponse).toContain(ZosFilesMessages.dataSetCreatedSuccessfully.message);
    });
});
