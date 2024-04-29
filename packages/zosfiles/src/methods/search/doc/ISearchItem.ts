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

import { IDataSet } from "../../../doc/IDataSet";
import { ISearchMatchLocation } from "./ISearchMatchLocation";

/**
 * This interface defines the information that is stored in the download data set API return object
 */
export interface ISearchItem extends IDataSet {
    /**
     * The short content of the member
     */
    matchList?: ISearchMatchLocation[];
}
