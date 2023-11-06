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
 * The test environment for your test.
 * @export
 * @interface ITestEnvironment
 */
export interface ITestEnvironment {
    /**
     * The working directory for your test environment. It is a unique (uuid) area where your tests can create
     * their home folders (for imperative, etc.) and you can use the area as scratch for any files, etc. that
     * must be created for your test.
     * @type {string}
     * @memberof ITestEnvironment
     */
    workingDir: string;
}
