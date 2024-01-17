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
 * Describes the current stage/status of a task in your CLI
 * Used in operation infrastructure and for progress bars
 */
export enum TaskStage {
    IN_PROGRESS,
    COMPLETE,
    NOT_STARTED,
    FAILED,
}
