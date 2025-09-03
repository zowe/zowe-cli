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
 * @export
 * @interface IScrtData
 */
export interface IScrtData {
    // product information
    productName: string;    // max of 48 characters
    version: string;        // max of 2 characters
    release: string;        // max of 2 characters
    modLevel: string;       // max of 2 characters
    vendor: string;

    // mutually exclusive options
    lmpKey?: string;        // 2 bytes
    prodId?: string;        // 2 bytes

    // feature information
    featureName: string;    // max of 48 bytes
    featureDesc: string;    // max of 128 bytes
}