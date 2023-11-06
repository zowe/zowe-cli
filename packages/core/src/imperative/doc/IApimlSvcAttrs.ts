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
 * When a command group or plugin is used with the API Mediation Layer,
 * the connection properties for communicating to the service associated
 * with the command group can be retrieved from APIML. These attributes
 * are used to identify the desired REST service within APIML.
 *
 * Information retrieved from APIML using these attributes is then used
 * to automatically create connection profile properties into a Zowe
 * team configuration file.
 *
 * Note that the "ibm.zosmf" service apiId is baked into the Zowe CLI.
 * Therefore, this optional interface need not be specified by a plugin
 * that requires only a connection to z/OSMF.
 */
export interface IApimlSvcAttrs {
    /**
     * The identifier of the REST API to which this command group communicates.
     * The API ID is defined by the REST service programmer. An example is
     * "zowe.apiml.apicatalog".
     * @type {string}
     * @memberof IApimlSvcAttrs
     */
    apiId: string;

    /**
     * The portion of the URL that directs a REST request to the correct path
     * for the desired web service. When multiple versions of the same apiId
     * are hosted on an APIML instance, this attribute identifies the desired
     * version of the REST API. This attribute is defined by the REST service
     * programmer. An example is "api/v1". If no gatewayUrl is supplied, but
     * multiple versions of the REST API exists in APIML, the first instance
     * of the apiId returned by APIML will be used. You might choose to not
     * specify a gatewayURL, if your client app supports all available versions
     * of the associated REST service.
     * @type {string}
     * @memberof IApimlSvcAttrs
     */
    gatewayUrl?: string;

    /**
     * The Zowe-CLI profile type which contains the properties that the command
     * group uses to connect to its service. The profile type is defined by
     * the plugin programmer. An example is "db2", which is used by the
     * zowe-cli-db2-plugin.
     *
     * A command group may have multiple profiles, but you specify the profile
     * in which connection information is maintained. If not specified, the
     * first profile type defined for the command group will be used.
     * That is fine if your command group has only one profile type. If you
     * have more than one profile type, you should really explicitly specify
     * the correct profile type.
     *
     * When a team configuration file is automatically generated from APIML,
     * (using the 'zowe config init --apiml' command), a profile of this type
     * will be created into that generated config file.
     * @type {string}
     * @memberof IApimlSvcAttrs
     */
    connProfType?: string;
}
