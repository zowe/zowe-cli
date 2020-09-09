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

import { IProvisionedInstanceVariable } from "../../../src/doc/zosmf/IProvisionedInstanceVariable";

/**
 * The list of variables of the provisioned instance.
 * @export
 * @interface IProvisionedInstanceVariables
 */
export interface IProvisionedInstanceVariables {

    /**
     * Variables for the software services instance.
     * @type IProvisionedInstanceVariable[], @see {IProvisionedInstanceVariable}
     * @memberof IProvisionedInstanceVariables
     */
    variables: IProvisionedInstanceVariable[];
}

