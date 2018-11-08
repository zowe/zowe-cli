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
 * This interface defines the options that can be sent into the dwanload data set function
 */
export interface IListOptions {

    /**
     * The volume where the data set resides
     */
    volume?: string;

    /**
     * The indicator that we want to show more attributes
     */
    attributes?: boolean;

    /**
     * The indicator that we want to show less data sets or members
     */
    maxLength?: number;
}
