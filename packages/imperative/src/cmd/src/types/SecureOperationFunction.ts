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
 * This type defines the signature for a function taht calls the credential manager. This is used by the TypeScript
 * compiler to verify that any function that wants to call the credential manager have the necessary
 * arguments sent to it.
 */
export type SecureOperationFunction =
  /**
   * @param {string} propNamePath - The path to a child property
   * @param {*} propValue - The value of said property
   * @param {boolean} optional - Set to true if failure to find credentials should be ignored
   * @return {Promise<any>} - The processed value after the secure operation function runs
   */
  (propNamePath: string, propValue?: any, optional?: boolean) => Promise<any>;
