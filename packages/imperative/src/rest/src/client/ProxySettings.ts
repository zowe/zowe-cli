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

import { env } from "process";
import { URL } from "url";
import { Agent } from "https";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";

import {
    HTTP_PROTOCOL_CHOICES,
    HTTP_PROTOCOL,
    HTTPS_PROTOCOL,
} from "../session/SessConstants";
import { ISession } from "../session/doc/ISession";

/**
 * Utility class to provide an http agent to REST APIs that is configured for
 * a proxy server based on commonly used environment variables.
 *
 * Supports the usage of the environment variables HTTP_PROXY, http_proxy, HTTPS_PROXY, https_proxy.
 * If any of these env variables is set and depending how the Zowe session is configured for http or
 * https it instantiates an appropriate http agent utilizing a popular third party library. If the z/OS
 * system uses self-signed certificates then the proxy server must be configured to accept them. If the
 * proxy server itself is configured with self-signed certificates then the user needs to either import
 * these certificates on their workstation, use rejectUnauthorized in their Zowe profile, or use the (not
 * recommended) nodejs variable NODE_TLS_REJECT_UNAUTHORIZED=0. This class also looks for the environment
 * variables NO_PROXY or no_proxy. These work with a simple comma separated list of hostnames that need
 * to match with the hostname of the Zowe profile.
 */
export class ProxySettings {
    /**
     * Retrieve an appropriate http.agent instance if proxy environment variables can be found.
     * @static
     * @param session Zowe `ISession` containing the hostname for the http request.
     *                Uses the session's `rejectUnauthorized` also for the proxy connection.
     * @returns an instance of an appropriate subclass of node's https.agent if proxy
     *          settings were found. Returns `undefined` if no proxy settings are found.
     * @memberof ProxySettings
     */
    public static getProxyAgent(session: ISession): Agent | undefined {
        const proxySetting = this.getProxySettings(session);
        const proxyOptions = {} as ProxyOptions;
        const authHeader = ProxySettings.getProxyAuthHeader(proxySetting);
        if (authHeader) {
            proxyOptions.headers = authHeader;
        }
        if (!proxySetting?.protocol) {
            return;
        }
        if (proxySetting.protocol === HTTP_PROTOCOL) {
            return new HttpProxyAgent(proxySetting.proxyUrl, proxyOptions);
        }
        if (proxySetting.protocol === HTTPS_PROTOCOL) {
            proxyOptions.rejectUnauthorized =
                session.rejectUnauthorized ?? true;
            return new HttpsProxyAgent(proxySetting.proxyUrl, proxyOptions);
        }
    }

    /**
     * Returns the URL to the proxy server if proxy environment variables can be found.
     * Can be used for testing the settings and logging connection details.
     * @static
     * @param session Zowe `ISession` containing the hostname for the http request.
     * @returns `URL` to proxy server
     * @memberof ProxySettings
     */
    public static getSystemProxyUrl(session: ISession): URL | undefined {
        return this.getProxySettings(session)?.proxyUrl;
    }

    /**
     * If the NO_PROXY or no_proxy environment variables are set with a comma separated
     * list of hostnames it will try to match the hostname of the Zowe `ISession` and
     * return `true` if found. Performs a simple string compare ignoring casing and white
     * spaces, but will not resolve hostnames to ip addressees and not perform wildcard matching.
     * @static
     * @param session Zowe `ISession` containing the hostname for the http request.
     * @returns `true` if the Zowe session host matches an entry in the comma separated
     *          list of hostnames in the environment variable. `false` otherwise.
     * @memberof ProxySettings
     */
    public static matchesNoProxySettings(session: ISession): boolean {
        const noProxyValues =
            session.proxy?.no_proxy ?? this.getNoProxyEnvVariables();
        if (!noProxyValues) {
            return false;
        }
        if (noProxyValues.includes(session.hostname.toLocaleLowerCase())) {
            return true;
        }
        return false;
    }

    private static getProxyAuthHeader(
        proxySetting: ProxySetting
    ): { [key: string]: string } | undefined {
        return proxySetting?.authSetting
            ? { "Proxy-Authorization": proxySetting.authSetting }
            : undefined;
    }

    /**
     * Parses environment variables for proxy servers.
     * @private
     * @static
     * @param session Zowe `ISession` containing the hostname for the http request.
     * @returns instance of private `ProxySetting` or `undefined`
     * @memberof ProxySettings
     */
    private static getProxySettings(
        session: ISession
    ): ProxySetting | undefined {
        if (this.matchesNoProxySettings(session)) {
            return;
        }
        const protocol = session.protocol ?? HTTPS_PROTOCOL;
        let envVariable: string | undefined;
        if (protocol === HTTP_PROTOCOL) {
            envVariable =
                session.proxy?.http_proxy ?? this.getHttpEnvVariables();
        } else if (protocol === HTTPS_PROTOCOL) {
            envVariable =
                session.proxy?.https_proxy ?? this.getHttpsEnvVariables();
        }
        const proxyUrl = this.checkUrl(envVariable);

        const authSetting = session.proxy?.proxy_authorization;
        if (authSetting) {
            return { proxyUrl, protocol, authSetting };
        }
        if (proxyUrl) {
            return { proxyUrl, protocol };
        }
    }

    /**
     * Parses environment variables valid for http requests.
     * @private
     * @static
     * @returns `string` if valid variable is found or undefined.
     * @memberof ProxySettings
     */
    private static getHttpEnvVariables(): string | undefined {
        return env.HTTP_PROXY ?? env.http_proxy;
    }

    /**
     * Parses environment variables valid for https requests.
     * @private
     * @static
     * @returns `string` if valid variable is found or undefined.
     * @memberof ProxySettings
     */
    private static getHttpsEnvVariables(): string | undefined {
        return env.HTTPS_PROXY ?? env.https_proxy ?? this.getHttpEnvVariables();
    }

    /**
     * Parses environment variables valid for no proxy exceptions.
     * @private
     * @static
     * @returns `string[]` of all hostnames found in the comma separated list
     *          in lowercase without white spaces.
     * @memberof ProxySettings
     */
    private static getNoProxyEnvVariables(): string[] | undefined {
        const noProxyValue = env.NO_PROXY ?? env.no_proxy;
        if (!noProxyValue) {
            return;
        }
        return noProxyValue
            .split(",")
            .map((entry) => entry.trim().toLocaleLowerCase());
    }

    /**
     * Parses a string to check if it is a valid URL.
     * @private
     * @static
     * @param inputUrl a string with a URL
     * @returns a URL instance or undefined if not a valid url.
     * @memberof Proxy
     */
    private static checkUrl(inputUrl: string): URL | undefined {
        try {
            return new URL(inputUrl);
        } catch {
            return;
        }
    }
}

/**
 * Internal interface to group proxy settings
 */
interface ProxySetting {
    proxyUrl: URL;
    protocol: HTTP_PROTOCOL_CHOICES;
    authSetting?: string;
}

interface ProxyOptions {
    headers?: { [key: string]: string };
    rejectUnauthorized?: boolean;
}
