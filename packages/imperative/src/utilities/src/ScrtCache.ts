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

    private static scrtDataMap: Map<string, IScrtData> = new Map();

    /**
     * Get the cached SCRT data.
     *
     * @returns {IScrtData} The SCRT data
     *      If no SCRT data has been set, null is returned.
     */
    public static get(key: string): IScrtData {
        return ScrtCache.scrtDataMap.get(key);
    }

    /**
     * Set the SCRT data in the cache.
     *
     * @param {string} key - The connection key (e.g., "https://host:port")
     * @param {IScrtData} scrtData - The data items required for SCRT reporting
     */
    public static set(key: string, scrtData: IScrtData): void {
        // This is only a shallow copy. Change if a deep copy is needed.
        ScrtCache.scrtDataMap.set(key, {...scrtData});
    }

    /**
     * Form an HTTP header containing the SCRT data.
     *
     * @returns {IScrtData}
     *      A string containing a properly formatted X-Zowe-Client-Usage header.
     *      If no SCRT data has been set, null is returned.
     */
    public static formHeader(key: string): string | null {
        if (!ScrtCache.scrtDataMap || ScrtCache.scrtDataMap.size === 0) {
            return null;
        }
        const scrtData = ScrtCache.scrtDataMap.get(key);
        if(!scrtData) {
            return null;
        }
        const header = Object.entries(scrtData)
            .map(([k, v]) => `${k}=${v}`)
            .join(";");

        return header;
    }
}