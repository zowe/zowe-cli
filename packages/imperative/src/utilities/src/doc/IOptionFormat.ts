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

export interface IOptionFormat {
    /**
     * The camel cased format of an option.
     *
     * Example:
     * ---
     *
     * this-is-a-test -> thisIsATest
     */
    camelCase: string;

    /**
     * The kebab cased format of an option key
     *
     * Example:
     * ---
     * thisIsATest -> this-is-a-test
     */
    kebabCase: string;

    /**
     * The untouched original key.
     *
     * Example:
     * ---
     * thisIsATest-test-here -> thisIsATest-test-here
     *
     * camelCase: thisIsATestTestHere
     * kebabCase: this-is-a-test-test-here
     */
    key: string;
}
