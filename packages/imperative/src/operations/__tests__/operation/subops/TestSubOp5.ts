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

/* eslint-disable deprecation/deprecation */
import { IOperationCompleted, IOperationUndoCompleted, Operation } from "../../../../index";
import { TestLogger } from "../../../../../__tests__/src/TestLogger";

const logger = TestLogger.getTestLogger();

export class TestSubOp5 extends Operation<any> {

    constructor() {
        super("Initialize Test Sub Op 5", true);
    }

    public logOperationResults(): void {
        logger.debug("Test sub operation 5 has ended.");
    }

    protected execute(inputParameters: any, operationCompletedCallback: IOperationCompleted<any>) {
        this.operationResultMessage = "The test sub op 5 was executed.";
        this.setOperationUndoable();
        operationCompletedCallback(Operation.NO_OUTPUT);
    }

    protected undo(undoCompletedCallback: IOperationUndoCompleted): void {
        logger.debug("Performing undo action for test sub op 5.");
        undoCompletedCallback();
    }

    protected logOperationBeginMessages(): void {
        logger.debug("Test sub operation 5 is beginning.");
    }
}
