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
 * Compare parms for diff. Allows you to ignore fields and instead specify a regex to match rather than allowing the
 * diff to occurr between the expected and actual JSON command response.
 */
export interface ICompareParms {
    /**
     * An array of paths to ignore in the diff. Construct the path using the dot (e.g. "test.property")
     */
    ignorePaths?: string[];
    /**
     * Instead of allowing diff to determine if the content is correct for a particular path (field) you can specify
     * a regex instead. This is useful for
     */
    pathRegex?: [{
        /**
         * The path to the property in the response object (e.g. "test.property")
         */
        path: string;
        /**
         * The regex to test
         */
        regex: RegExp;
    }];
}
