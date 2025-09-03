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

import { IScrtData } from "./doc/IScrtData";

/**
 * This class holds SCRT data that is gathered from extenders during the processing of the
 * extenders application definition. That data is then used to pass out-of-band usage
 * information to the associated REST service on each request. The current implementation
 * passes a custom header on each REST request. Other methods may be used in the future
 * to communicate to other back-ends (like Zowe Remote Shell).
 *
 * We intend that this data will be set once for an application, and used repeatedly.
 * If that premise changes, it may be necessary to implement some form of locking to
 * ensure that the data is not changed before it delivered in a REST request.
 *
 * Once on the mainframe server, the data is used to produce SCRT reports.
 *
 * @export
 * @class ScrtCache
 */
export class ScrtCache {

    private static scrtData: IScrtData = null;

    /**
     * Get the cached SCRT data.
     *
     * @returns {IScrtData} The SCRT data
     *      If no SCRT data has been set, null is returned.
     */
    public static get(): IScrtData {
        return ScrtCache.scrtData;
    }

    /**
     * Set the SCRT data in the cache.
     *
     * @param {IScrtData} scrtData - The data items required for SCRT reporting
     */
    public static set(scrtData: IScrtData): void {
        // This is only a shallow copy. Change if a deep copy is needed.
        ScrtCache.scrtData = { ... scrtData };
    }

    /**
     * Form an HTTP header containing the SCRT data.
     *
     * @returns {IScrtData}
     *      A string containing a properly formatted X-Zowe-Client-Usage header.
     *      If no SCRT data has been set, null is returned.
     */
    public static formHeader(): string {
        if (ScrtCache.scrtData === null) {
            return null;
        }
        return "a valid X-Zowe-Client-Usage header"
    }
}