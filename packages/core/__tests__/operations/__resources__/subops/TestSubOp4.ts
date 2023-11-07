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

import { IOperationCompleted, IOperationUndoCompleted, Operation } from "../../../../src/index";
import { TestLogger } from "../../../../__tests__/__resources__/src/TestLogger";

const logger = TestLogger.getTestLogger();

export class TestSubOp4 extends Operation<any> {

    constructor() {
        super("Initialize Test Sub Op 4", true);
    }

    public logOperationResults(): void {
        logger.info("Test sub operation 4 has ended.");
    }

    protected execute(inputParameters: any, operationCompletedCallback: IOperationCompleted<any>) {
        this.operationResultMessage = "The test sub op 4 was executed.";
        this.setOperationUndoable();
        operationCompletedCallback(Operation.NO_OUTPUT);
    }

    protected undo(undoCompletedCallback: IOperationUndoCompleted): void {
        logger.info("Performing undo action for test sub op 4.");
        undoCompletedCallback();
    }

    protected logOperationBeginMessages(): void {
        logger.info("Test sub operation 4 is beginning.");
    }
}
