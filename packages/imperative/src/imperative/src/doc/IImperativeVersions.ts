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

export interface IImperativeVersions {
    /**
     * The version of the consuming program, retrieved from `version` in package.json
     * @type {string}
     * @memberof IImperativeVersions
     */
    version: string,
    /**
     * The Zowe LTS release number from the consuming program, retrieved from `zoweVersion` in package.json
     * @type {string}
     * @memberof IImperativeVersions
     */
    zoweVersion?: string
}