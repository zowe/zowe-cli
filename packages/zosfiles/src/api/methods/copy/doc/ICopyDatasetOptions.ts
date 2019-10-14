import { enqueue } from "../../..";

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
 * This interface defines the options that can be sent into the copy data set function.
 */
export interface ICopyDatasetOptions {

    /**
     * The volume where the from data set resides.
     */
    fromVolume?: string;

    /**
     * The volume where the to data set resides.
     */
    toVolume?: string;

    /**
     * If true, members in the target dataset are replaced.
     * If false, like named members are not copied and an error is returned
     */
    replace?: boolean;

    /**
     * This is the enqueue type for the "to" data set. SHRW is the default for PDS, EXCLU for sequential
     */
    enq?: enqueue;
}
