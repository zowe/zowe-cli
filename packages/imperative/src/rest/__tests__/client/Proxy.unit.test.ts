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
import { Proxy } from '../../src/client/Proxy';
import { HTTPS_PROTOCOL, HTTP_PROTOCOL } from '../../src/session/SessConstants';
import { ZosmfSession } from '../../../../../zosmf/src/ZosmfSession';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { env } from 'process';

describe('Proxy tests', () => {
    const session = ZosmfSession.createSessCfgFromArgs({
        $0: "zowe",
        _: [""],
        host: "fake",
        port: "fake",
        rejectUnauthorized: false,
        basePath: "fakeBasePath",
        tokenValue: "fake",
        tokenType: "fake"
    });
    const privateProxy = Proxy as any;
    const httpUrl = 'http://www.zowe.com';
    const httpsUrl = 'https://www.zowe.com';
    let getProxySettingsSpy: jest.SpyInstance;
    let checkUrlSpy: jest.SpyInstance;

    describe('getProxyAgent', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            getProxySettingsSpy = jest.spyOn(privateProxy, "getProxySettings");
        });

        it('Should retrieve the HTTP proxy agent', () => {
            const expected = new HttpProxyAgent(httpUrl);
            getProxySettingsSpy.mockReturnValue({
                proxyUrl: httpUrl,
                protocol: HTTP_PROTOCOL
            });
            expect(JSON.stringify(Proxy.getProxyAgent(session))).toEqual(JSON.stringify(expected));
        });

        it('Should retrieve the HTTPS proxy agent', () => {
            const expected = new HttpsProxyAgent(httpsUrl, { rejectUnauthorized: false });
            getProxySettingsSpy.mockReturnValue({
                proxyUrl: httpsUrl,
                protocol: HTTPS_PROTOCOL
            });
            expect(JSON.stringify(Proxy.getProxyAgent(session))).toEqual(JSON.stringify(expected));
        });
    });

    describe('getSystemProxyUrl', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            getProxySettingsSpy = jest.spyOn(privateProxy, "getProxySettings");
        });

        it('Should retrieve the system proxy URL', () => {
            getProxySettingsSpy.mockReturnValue({
                proxyUrl: httpsUrl,
                protocol: HTTPS_PROTOCOL
            });
            expect(Proxy.getSystemProxyUrl(session)).toEqual(httpsUrl);
        });
    });

    describe('getProxySettings', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            checkUrlSpy = jest.spyOn(privateProxy, "checkUrl");
        });

        it('Should return proxy settings from session', () => {
            const expected = {
                proxyUrl: httpsUrl,
                protocol: HTTPS_PROTOCOL
            };
            checkUrlSpy.mockReturnValue(httpsUrl);
            expect(Proxy["getProxySettings"](session)).toEqual(expected);
        });
    });

    describe('getHttpEnvVariables', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('Should return the HTTP environment variables if they exist', () => {
            const expected = {
                test: "test"
            };
            Object.defineProperty(env, "HTTP_PROXY", {
                value: expected,
                configurable: true
            });
            expect(Proxy["getHttpEnvVariables"]()).toEqual(expected);
        });
    });
});
