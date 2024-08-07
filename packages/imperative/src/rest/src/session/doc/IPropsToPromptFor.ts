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

import { ISession } from './ISession';

export interface IPropsToPromptFor <SessCfgType extends ISession=ISession> {
    name: keyof SessCfgType & string,
    secure?: boolean,
    description?: string,
    isGivenValueValid?: (givenValue: string) => boolean
}