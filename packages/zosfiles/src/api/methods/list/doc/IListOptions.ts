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

import { ZosmfMigratedRecallOptions } from "../../../doc/types/ZosmfMigratedRecallOptions";
import { IGlobalOptions } from "../../../doc/IGlobalOptions";

/**
 * This interface defines the options that can be sent into the dwanload data set function
 */
export interface IListOptions extends IGlobalOptions {

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

    /**
     * An optional search parameter that specifies the first data set name to return in the response document
     */
    start?: string;

    /**
     * An optional parameter that specifies how to handle migrated data sets
     */
    recall?: ZosmfMigratedRecallOptions;
}
