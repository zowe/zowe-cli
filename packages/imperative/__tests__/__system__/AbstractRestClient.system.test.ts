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

import { RestClient, Session, ISession } from "../../src/rest";

describe("AbstractRestClient system tests", () => {
    it("should time out before connecting if given a connection timeout", async () => {
        const mISession: ISession = {
            hostname: "www.zowe.org",
            protocol: "https",
            socketConnectTimeout: 1
        };
        const mSession = new Session(mISession);
        const restClient = new RestClient(mSession);
        let error;
        try {
            await restClient.request({resource: "/", request: "GET"});
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("Failed to send an HTTP request");
        expect(error.causeErrors.message).toContain("Connection timed out. Check the host, port, and firewall rules.");
    });
    it("should time out before getting a response with the request timeout", async () => {
        const mISession: ISession = {
            hostname: "www.zowe.org",
            protocol: "https",
            requestCompletionTimeout: 1
        };
        const mSession = new Session(mISession);
        const restClient = new RestClient(mSession);
        let error;
        try {
            await restClient.request({resource: "/", request: "GET"});
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("HTTP request timed out after connecting.");
    });
    it("should fail to send a request if the hostname contains a protocol", async () => {
        const mISession: ISession = {
            hostname: "https://www.zowe.org",
            protocol: "https"
        };
        const mSession = new Session(mISession);
        const restClient = new RestClient(mSession);
        let error;
        try {
            await restClient.request({resource: "/", request: "GET"});
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("The hostname should not contain the protocol.");
    });
    it("should fail to send a request if the hostname is blank", async () => {
        const mISession: ISession = {
            hostname: "www.zowe.org",
            protocol: "https"
        };
        const mSession = new Session(mISession);
        mISession.hostname = "";
        const restClient = new RestClient(mSession);
        let error;
        try {
            await restClient.request({resource: "/", request: "GET"});
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("The hostname is required");
    });
    it("should connect successfully", async () => {
        const mISession: ISession = {
            hostname: "www.zowe.org",
            protocol: "https"
        };
        const mSession = new Session(mISession);
        const restClient = new RestClient(mSession);
        let error;
        try {
            await restClient.request({resource: "/", request: "GET"});
        } catch (err) {
            error = err;
        }
        expect(error).not.toBeDefined();
    });
});
