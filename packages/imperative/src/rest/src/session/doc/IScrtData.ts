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
 * Interface to construct and retrieve SCRT data.
 *
 * @export
 * @interface IScrtData
 */
export interface IScrtData {
    /**
     * The feature name associated with your REST client.
     * Maximum length is 48 bytes.
     */
    featureName: string;

    /* featureDescription is not used in SCRT reports, so featureName will also
       be supplied as featureDescription to FRS functions by the RESP API SDK.
    */

    /**
     * Product ID for the REST service to which your client communicates.
     * Maximum length is 8 bytes.
     * This property is not required if your REST service sets its own
     * productId in its application.yaml.
     */
    productId?: string;

    /**
     * Product version for the REST service to which your client communicates.
     * Maximum length is 8 bytes, 2 bytes for each of the three segments,
     * version.release.modLevel (vv.rr.mm). Each segment must be numeric.
     * This property is not required if your REST service sets its own
     * productVersion in its application.yaml.
     */
    productVersion?: string;

    // productName is retrieved by the RESP API SDK from the product catalog using productId
    // prodInstance is not used for SCRT reporting of REST client/server.
    // lmpKey is not used for SCRT reporting of REST client/server.
}