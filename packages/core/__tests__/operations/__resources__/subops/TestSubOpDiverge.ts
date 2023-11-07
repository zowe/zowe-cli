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

import { TestOperations2 } from "../TestOperations2";
import { IOperationCompleted, IOperationUndoCompleted, Operation } from "../../../../src";
import { TestLogger } from "../../../../__tests__/__resources__/src/TestLogger";

const logger = TestLogger.getTestLogger();

export class TestSubOpDiverge extends Operation<any> {

    constructor() {
        super("Initialize Test Sub Op diverge", true);
    }

    public logOperationResults(): void {
        logger.debug("Test sub operation diverge has ended.");
    }

    protected execute(inputParameters: any, operationCompletedCallback: IOperationCompleted<any>) {
        this.operationResultMessage = "The test sub op diverge was executed.";
        this.setOperationUndoable();
        this.setOperationDiverge(new TestOperations2(), true);
        operationCompletedCallback(Operation.NO_OUTPUT);
    }

    protected undo(undoCompletedCallback: IOperationUndoCompleted): void {
        logger.debug("Performing undo action for test sub op diverge.");
        undoCompletedCallback();
    }

    protected logOperationBeginMessages(): void {
        logger.debug("Test sub operation diverge is beginning.");
    }
}
