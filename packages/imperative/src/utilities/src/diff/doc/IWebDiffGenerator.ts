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
 * Web diff genrator API that handles genration of web diff base launcher
 * at cli home dir
 * @export
 * @interface IWebDiffGenerator
 */
export interface IWebDiffGenerator {

    /**
     * build the diff generator
     */
    buildDiffDir(): void;

}
