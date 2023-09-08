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
 * A single field in a profile schema which can be serialized to a profile file
 */
export interface IProfileProperty {
    /**
   * See ICommandProfileProperty.ts for how to include option definitions
   * on your schema for auto-generated commands
   */
    type: string | string[];

    items?: any;

    /**
   * Nested properties e.g. banana.origin.zipcode, banana.origin.country
   */
    properties?: any;

    /**
   * Indicates if the given property should be securely stored
   */
    secure?: boolean;

}
