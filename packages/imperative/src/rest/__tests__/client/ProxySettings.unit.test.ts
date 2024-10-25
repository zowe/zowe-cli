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

import * as process from "process";

import { ProxySettings } from "../../src/client/ProxySettings";

import { HTTPS_PROTOCOL, HTTP_PROTOCOL } from "../../src/session/SessConstants";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";

import { ISession } from "../../src/session/doc/ISession";

describe("Proxy tests", () => {
    const session = {
        hostname: "fake.com",
        port: 443,
        rejectUnauthorized: false
    } as ISession;
    const privateProxy = ProxySettings as any;
    const httpUrl = "http://www.zowe.com";
    const httpsUrl = "https://www.zowe.com";
    const noProxyList = "www.zowe.com, fake.com,ibm.com,broadcom.com   ";
    const passedUrl = "passedurl.com";
    let getProxySettingsSpy: jest.SpyInstance;
    let checkUrlSpy: jest.SpyInstance;

    describe("recognise passed proxy values in session", () => {
        const noProxySpy = jest.spyOn(privateProxy, "matchesNoProxySettings");
        const httpEnvVarSpy = jest.spyOn(privateProxy, "getHttpEnvVariables");
        const httpsEnvVarSpy = jest.spyOn(privateProxy, "getHttpsEnvVariables");
        checkUrlSpy = jest.spyOn(privateProxy, "checkUrl");
        const expected = {
            proxyUrl: passedUrl,
            protocol: HTTPS_PROTOCOL
        }

        beforeEach(() => {
            jest.clearAllMocks();
            checkUrlSpy.mockClear();
        });
        it("Should use the HTTP proxy agent passed with session", () => {
            expected.protocol = HTTP_PROTOCOL;
            session.proxy = { http_proxy: passedUrl };
            session.protocol = HTTP_PROTOCOL;
            noProxySpy.mockReturnValueOnce(false);
            expect(httpEnvVarSpy).not.toHaveBeenCalled();
            expect(httpsEnvVarSpy).not.toHaveBeenCalled();
            checkUrlSpy.mockReturnValueOnce(passedUrl);
            expect(JSON.stringify(ProxySettings["getProxySettings"](session))).toEqual(JSON.stringify(expected));
            noProxySpy.mockClear();
            checkUrlSpy.mockClear();
        });
        it("Should use the HTTPS proxy agent passed with session", () => {
            expected.protocol = HTTPS_PROTOCOL;
            session.proxy = { https_proxy: passedUrl };
            session.protocol = HTTPS_PROTOCOL;
            noProxySpy.mockReturnValueOnce(false);
            expect(httpEnvVarSpy).not.toHaveBeenCalled();
            expect(httpsEnvVarSpy).not.toHaveBeenCalled();
            checkUrlSpy.mockReturnValueOnce(passedUrl);
            expect(JSON.stringify(ProxySettings["getProxySettings"](session))).toEqual(JSON.stringify(expected));
            noProxySpy.mockClear();
            checkUrlSpy.mockClear();
        });
    })

    describe("getProxyAgent", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            getProxySettingsSpy = jest.spyOn(privateProxy, "getProxySettings");
        });

        it("Should retrieve the HTTP proxy agent", () => {
            const expected = new HttpProxyAgent(httpUrl);
            getProxySettingsSpy.mockReturnValue({
                proxyUrl: httpUrl,
                protocol: HTTP_PROTOCOL
            });
            expect(JSON.stringify(ProxySettings.getProxyAgent(session))).toEqual(JSON.stringify(expected));
        });

        it("Should retrieve the HTTPS proxy agent", () => {
            const expected = new HttpsProxyAgent(httpsUrl, { rejectUnauthorized: false });
            getProxySettingsSpy.mockReturnValue({
                proxyUrl: httpsUrl,
                protocol: HTTPS_PROTOCOL
            });
            expect(JSON.stringify(ProxySettings.getProxyAgent(session))).toEqual(JSON.stringify(expected));
        });
    });

    describe("getSystemProxyUrl", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            getProxySettingsSpy = jest.spyOn(privateProxy, "getProxySettings");
        });

        it("Should retrieve the system proxy URL", () => {
            getProxySettingsSpy.mockReturnValue({
                proxyUrl: httpsUrl,
                protocol: HTTPS_PROTOCOL
            });
            expect(ProxySettings.getSystemProxyUrl(session)).toEqual(httpsUrl);
        });
    });

    describe("getProxySettings", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            checkUrlSpy = jest.spyOn(privateProxy, "checkUrl");
        });

        it("Should return proxy settings from session", () => {
            const expected = {
                proxyUrl: httpsUrl,
                protocol: HTTPS_PROTOCOL
            };
            checkUrlSpy.mockReturnValue(httpsUrl);
            expect(ProxySettings["getProxySettings"](session)).toEqual(expected);
        });
    });

    describe("getHttpEnvVariables", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("Should return the HTTP environment variables if they exist", () => {
            const expected = httpUrl;
            process.env["HTTP_PROXY"] = expected;
            expect(ProxySettings["getHttpEnvVariables"]()).toEqual(expected);
            process.env["HTTP_PROXY"] = undefined;
        });
    });

    describe("matchesNoProxySettings", () => {
        it("Should match session hostname with no_proxy",  () => {
            const expected = true;
            process.env["NO_PROXY"] = noProxyList;
            expect(ProxySettings["matchesNoProxySettings"](session)).toEqual(expected);
            process.env["NO_PROXY"] = undefined;
        });
        it("Should return true for match with no_proxy passed with session proxy", () => {
            session.proxy = { http_proxy: passedUrl, no_proxy: ["fake.com"] };
            session.protocol = HTTP_PROTOCOL;
            expect(ProxySettings["matchesNoProxySettings"](session)).toEqual(true);
        });
        it("Should not match session hostname with no_proxy",  () => {
            const expected = false;
            process.env["NO_PROXY"] = noProxyList;
            session.hostname = "microsoft.com";
            expect(ProxySettings["matchesNoProxySettings"](session)).toEqual(expected);
            process.env["NO_PROXY"] = undefined;
        });
        it("Should return false for match with no_proxy passed with session proxy", () => {
            session.proxy = { http_proxy: passedUrl, no_proxy: ["false.com", "blah.com"] };
            session.protocol = HTTP_PROTOCOL;
            expect(ProxySettings["matchesNoProxySettings"](session)).toEqual(false);
        });
    });
});
