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

import { ICommandHandlerConstructor } from "./ICommandHandlerConstructor";

/**
 * This interface defines what the expected module.exports variable should be
 * for any defined handlers by an implementing cli.
 */
export interface ICommandHandlerRequire {
    /**
     * In TypeScript, doing an 'export default class' puts the export in exports.default. This takes
     * advantage of TypeScript language constructs and cleans up the code a bit.
     */
    default: ICommandHandlerConstructor;
}
