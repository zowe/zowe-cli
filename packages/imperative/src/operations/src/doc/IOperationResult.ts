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

import { Operation } from "../Operation";

export interface IOperationResult<T> {
    "operationName": string;
    "resultMessage": string;
    "operationFailed": boolean;
    "diverge": boolean;
    "divergeTo": Operation<any>;
    "continuePath": boolean;
    "nextOperationResult": IOperationResult<any>;
    "operationObject": Operation<any>;
    "operationUndoPossible": boolean;
    "operationUndoFailed": boolean;
    "operationUndoAttempted": boolean;
    "critical": boolean;
    "infoMessages": string[];
    "errorMessages": string[];
    "output": T;
}
