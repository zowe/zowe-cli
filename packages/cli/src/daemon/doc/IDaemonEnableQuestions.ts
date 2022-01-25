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
 * Specifies wwhether questions can be asked of the user, and if not,
 * what value should be used for a question when we do not ask.
 */
export interface IDaemonEnableQuestions {
    canAskUser: boolean;   // can we ask the user questions?

    /* Answer for the "can we add .zowe/bin to PATH" question.
     * The value is only used when we cannot ask the user.
     */
    addBinToPathVal: string;
}
