import { IDataSet } from "../../../doc/IDataSet";
import { IGlobalOptions } from "../../../doc/IGlobalOptions";

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
export interface ICopyDatasetOptions extends IGlobalOptions {
    /**
     * The dataset to copy from.
     * @type {IDataSet}
     */
    fromDataSet: IDataSet;

    /**
     * Enq option
     * Allow values are: SHR, SHRW, EXCLU.
     * @type {string}
     */
    enq?: string;

    /**
     * Replace option
     * @type {boolean}
     */
    replace?: boolean;
}
