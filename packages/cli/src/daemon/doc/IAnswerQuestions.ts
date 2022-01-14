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
 * Specifies wwhether a question can be asked of the user, and if not,
 * what value should be used by default.
 */
export interface IAnswerQuestions {
    // Can we add .zowe/bin to PATH?
    addBinToPath: {
        askUser: boolean;   // can we ask the user?
        defaultVal: string; // default value when we do not ask
    }
}
