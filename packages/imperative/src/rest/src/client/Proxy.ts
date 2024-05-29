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

import { env } from 'process';
import { URL } from 'url';
import { Agent } from 'https';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { HTTP_PROTOCOL_CHOICES, HTTP_PROTOCOL, HTTPS_PROTOCOL } from '../session/SessConstants';
import { ISession } from '../session/doc/ISession';

export class Proxy {

    public static getProxyAgent(session: ISession): Agent | undefined {
        const proxySetting = this.getProxySettings(session);
        if (proxySetting?.protocol === HTTP_PROTOCOL) {
            return new HttpProxyAgent(proxySetting.proxyUrl);
        }
        if (proxySetting?.protocol === HTTPS_PROTOCOL) {
            return new HttpsProxyAgent(proxySetting.proxyUrl,
                { rejectUnauthorized: session.rejectUnauthorized ?? true });
        }
    }

    public static getSystemProxyUrl(session: ISession): URL | undefined {
        return this.getProxySettings(session)?.proxyUrl;
    }

    public static matchesNoProxySettings(session: ISession): boolean {
        const noProxyValues = this.getNoProxyEnvVariables();
        if (!noProxyValues) {
            return false;
        }
        if (noProxyValues.includes(session.hostname.toLocaleLowerCase())) {
            return true;
        }
        return false;
    }

    private static getProxySettings(session: ISession): ProxySetting | undefined {
        if (this.matchesNoProxySettings(session)) {
            return;
        }
        const protocol = session.protocol ?? HTTPS_PROTOCOL;
        let envVariable: string | undefined;
        if (protocol === HTTP_PROTOCOL) {
            envVariable = this.getHttpEnvVariables();
        }
        else if (protocol === HTTPS_PROTOCOL) {
            envVariable = this.getHttpsEnvVariables();
        }
        const proxyUrl = this.checkUrl(envVariable);
        if (proxyUrl) {
            return {proxyUrl, protocol};
        }
    }

    private static getHttpEnvVariables(): string | undefined {
        return env.HTTP_PROXY ?? env.http_proxy ?? undefined;
    }

    private static getHttpsEnvVariables(): string | undefined {
        return env.HTTPS_PROXY ?? env.https_proxy ?? this.getHttpEnvVariables() ?? undefined;
    }

    private static getNoProxyEnvVariables(): string[] | undefined {
        const noProxyValue = env.NO_PROXY ?? env.no_proxy ?? undefined;
        if (!noProxyValue) {
            return;
        }
        return noProxyValue.split(',').map(entry => entry.trim().toLocaleLowerCase());
    }

    private static checkUrl(inputUrl: string): URL | undefined {
        try {
            return new URL(inputUrl);
        } catch {
            return;
        }
    }
}
interface ProxySetting {
    proxyUrl: URL,
    protocol: HTTP_PROTOCOL_CHOICES
}
