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

import * as dns from "dns";
import { promisify } from "util";
import { RestClient } from "../../packages/rest/src/client/RestClient";
import { Session } from "../../packages/rest/src/session/Session";
import { TestLogger } from "../TestLogger";

describe("AbstractRestClient system tests", () => {
    const exampleDomain = "dns.google.com";
    const removeHash = (html: string) => html.replace(/(?<=nonce)=".+"/g, "");
    let exampleHtml: string;

    it("should get response when host is domain name", async () => {
        const session = new Session({ hostname: exampleDomain });
        let caughtError;
        try {
            exampleHtml = removeHash(await RestClient.getExpectString(session, "/"));
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
        expect(exampleHtml).toContain("<!DOCTYPE html>");
    });

    it("should get response when host is IPv4 address", async () => {
        const [ipv4] = await promisify(dns.resolve4)(exampleDomain);
        const session = new Session({ hostname: ipv4 });
        let responseText, caughtError;
        try {
            responseText = await RestClient.getExpectString(session, "/", [{ "Host": exampleDomain }]);
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
        expect(removeHash(responseText)).toBe(exampleHtml);
    });

    it("should get response when host is IPv6 address", async () => {
        const [ipv6] = await promisify(dns.resolve6)(exampleDomain);
        const session = new Session({ hostname: ipv6 });
        let responseText, caughtError;
        try {
            responseText = await RestClient.getExpectString(session, "/", [{ "Host": exampleDomain }]);
        } catch (error) {
            caughtError = error;
            TestLogger.info("To run this test, your network must support connecting to external IPv6 addresses.");
        }
        expect(caughtError).toBeUndefined();
        expect(removeHash(responseText)).toBe(exampleHtml);
    });
});
