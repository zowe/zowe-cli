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

import { ICommandOptionDefinition } from "@zowe/imperative";

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
     * URI for the z/OSMF change password/passphrase endpoint
     * @type {string}
     */
    AUTHENTICATE_RESOURCE: "/zosmf/services/authenticate",

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
    },
    // https://www.ibm.com/docs/en/zos/2.5.0?topic=service-retrieve-zosmf-information
    VERSIONS: {
        V2R1: "24",
        V2R2: "25",
        V2R3: "26",
        V2R4: "27",
        V2R5: "28",
        V3R1: "29",
    }
};


/**
 * Object containing all options to be used by the Download data set API
 */
export const ZosFilesOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The files timeout header value
     * @type {ICommandOptionDefinition}
     */
    responseTimeout: {
        name: "response-timeout",
        aliases: ["rto"],
        description: "The maximum amount of time in seconds the z/OSMF Files TSO servlet should run before returning a response." +
        " Any request exceeding this amount of time will be terminated and return an error. Allowed values: 5 - 600",
        type: "number",
        defaultValue: undefined,
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        numericValueRange: [5, 600]
    },

    /**
     * The TSO account number to use for z/OSMF data set and file operations
     * @type {ICommandOptionDefinition}
     */
    tsoAccount: {
        name: "tso-account",
        description: "If specified, this value will be sent in the header X-IBM-Request-Acctnum" +
        " for z/OSMF data set and file operations that support it.",
        type: "string"
    },

    /**
     * The TSO logon procedure to use for z/OSMF data set and file operations
     * @type {ICommandOptionDefinition}
     */
    tsoProcedure: {
        name: "tso-procedure",
        aliases: ["tso-proc"],
        description: "If specified, this value will be sent in the header X-IBM-Request-Proc" +
        " for z/OSMF data set and file operations that support it.",
        type: "string"
    }
};
