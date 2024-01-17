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

import { IOperationCompleted, IOperationUndoCompleted, Operation } from "../../../../src/operations";
import { TestLogger } from "../../../../__tests__/src/TestLogger";

const logger = TestLogger.getTestLogger();

export class TestSubOpNoUndo extends Operation<any> {

    constructor() {
        super("Initialize Test Sub Op No Undo", false);
    }

    public logOperationResults(): void {
        logger.debug("Test sub operation no undo has ended.");
    }

    protected execute(inputParameters: any, operationCompletedCallback: IOperationCompleted<any>) {
        this.operationResultMessage = "The test sub op No Undo was executed.";
        operationCompletedCallback(Operation.NO_OUTPUT);
    }

    protected undo(undoCompletedCallback: IOperationUndoCompleted): void {
        logger.debug("Performing undo action for test sub op No Undo.");
        undoCompletedCallback();
    }

    protected logOperationBeginMessages(): void {
        logger.debug("Test sub operation no undo is beginning.");
    }
}
