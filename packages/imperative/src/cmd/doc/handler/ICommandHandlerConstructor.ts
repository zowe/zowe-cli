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

import { ICommandHandler } from "./ICommandHandler";

/**
 * This type is here so that we can indicate an object from a
 * require can be instantiated.
 */
export type ICommandHandlerConstructor = new () => ICommandHandler;
