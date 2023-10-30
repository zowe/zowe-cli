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

import { IImperativeErrorParms } from "../../../error/src/doc/IImperativeErrorParms";

/**
 * Options that will affect the behavior of the ProfileInfo class.
 * They are supplied on the ProfileInfo constructor.
 */
export interface IProfInfoErrParms extends IImperativeErrorParms {

    /**
     * This property is used when an error is returned that is related
     * to a number of configuration items. For example, if a problem is
     * identified that affects a subset of profiles, those affected
     * profiles can be identified in the itemsInError array. An app can
     * easily identify each affected profile by traversing itemsInError.
     */
    itemsInError?: string[];
}
