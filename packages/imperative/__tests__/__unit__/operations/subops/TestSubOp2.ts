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

export class TestSubOp2 extends Operation<any> {

    constructor() {
        super("Initialize Test Sub Op 2", true);
    }

    public logOperationResults(): void {
        this.log.info("Test sub operation 2 has ended.");
    }

    protected execute(inputParameters: any, operationCompletedCallback: IOperationCompleted<any>) {
        this.operationResultMessage = "The test sub op 2 was executed.";
        this.setOperationUndoable();
        operationCompletedCallback(Operation.NO_OUTPUT);
    }

    protected undo(undoCompletedCallback: IOperationUndoCompleted): void {
        this.log.info("Performing undo action for test sub op 2.");
        undoCompletedCallback();
    }

    protected logOperationBeginMessages(): void {
        this.log.info("Test sub operation 2 is beginning.");
    }


}
