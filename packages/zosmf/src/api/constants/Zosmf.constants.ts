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

/**
 * Constants to be used by the z/OSMF API
 */
export const ZosmfConstants: { [key: string]: any } = {
    /**
     * Specifies the z/OS data set and file REST interface
     * @type {string}
     */
    RESOURCE: "/zosmf",

    /**
     * indicator for get info request
     * @type {string}
     */
    INFO: "/info",

    /**
     * indicator for get topology services
     * @type {string}
     */
    TOPOLOGY: "/resttopology",

    /**
     * indicator for get defined systems in zosmf
     * @type {string}
     */
    SYSTEMS: "/systems",

    /**
     * Known error codes return by the API
     * @type {object}
     */
    ERROR_CODES: {
        /**
         * Error code when unable to connect to host
         * @type {string}
         */
        BAD_HOST_NAME: "ENOTFOUND",

        /**
         * Error code when unable to connect to port
         * @type {string}
         */
        BAD_PORT: "ECONNREFUSED",

        /**
         * Error code when self signed certificate in chain
         * @type {string}
         */
        SELF_SIGNED_CERT_IN_CHAIN: "SELF_SIGNED_CERT_IN_CHAIN",

        /**
         * Error code when unable to verify the first certificate
         * @type {string}
         */
        UNABLE_TO_VERIFY_LEAF_SIGNATURE: "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
    }
};
