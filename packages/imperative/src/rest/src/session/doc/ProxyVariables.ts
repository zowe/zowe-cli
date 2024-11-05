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

export interface ProxyVariables {
    /**
     * HTTP_PROXY/http_proxy value
     */
    http_proxy?: string,
    /**
     * HTTPS_PROXY/https_proxy value
     */
    https_proxy?: string,
    /**
     * string[] of NO_PROXY/no_proxy values
     */
    no_proxy?: string[],
    /**
     * The value to send as the Proxy-Authorization
     * header for every network request
     */
    proxy_authorization?: string,
    /**
     * boolean value for whether the proxy server certificate
     * should be verified against the list of supplied CAs
     */
    proxy_strict_ssl?: boolean
}
