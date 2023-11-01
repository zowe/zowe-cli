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

import { IOperationResult } from "./doc/IOperationResult";
import { IOperationResultReady, Operation } from "./Operation";
import { TaskProgress } from "./TaskProgress";
import { TextUtils } from "../utils/TextUtils";

/**
 * The Operations class extends Operation and is used to create a 'string' of operations that must
 * be completed in serial order.
 *
 * The implementing class is responsible (in defineOperations) for creating each operation (and
 * invoking addNextOperation) to add the operations to the list. You must also call "defineOperations"
 * from your constructor. This allows you to setup anything you need (in your constructor) before defining
 * the list of operations.
 *
 * You can initiate the operation by invoking performOperation, which will iterate through each operation
 * defined and perform them in sequence. If a operation chooses to diverge, then
 */
export abstract class Operations<T> extends Operation<any> {


    /**
     * The list of operations that should be executed in sequence
     */
    private mOperationList: Array<Operation<any>> = [];

    /**
     * Optionally give a status message in your Operations object instead of
     * letting the message from your sub-operations come through.
     */
    private mOverallStatusMessage: string;

    /**
     * The current operation that is being executed.
     * @type {number}
     */
    private mCurrentOperation: number = 0;

    /**
     * the callers operations complete callback
     */
    private mOperationsCompleteCallback: IOperationResultReady<any>;

    /**
     * In the event of an undo request, we will prepare a list that will be traversed to complete
     * each undo function.
     * @type {Array}
     */
    private mOperationUndoList: Array<Operation<any>> = [];

    /**
     * The current operation undo index.
     * @type {number}
     */
    private mOperationUndoIndex: number = 0;

    /**
     * The input parameters to this string of operations
     */
    private mInputParameters: T;

    /**
     * Building an Operations object
     * @param {string} opName: Operations Name
     * @param {boolean} critical: if the operation is critical
     */
    constructor(opName: string, critical?: boolean) {
        super(opName, critical);
    }

    /**
     * The public interface to Operations. This method allows consumers to initiate the operation sequence.
     * @returns {IOperationResult}: The operation results
     */
    public executeOperation(inputParameters: T, operationComplete: IOperationResultReady<any>): void {
        /**
         * Execute the next operation in the list.
         */
        this.mInputParameters = inputParameters;
        this.mOperationsCompleteCallback = operationComplete;
        this.executeNextOperation(inputParameters);
    }


    /**
     *  Set the status message for the overall Operations object,
     *  which takes precedence over the sub-operations' messages
     * @param message - the message,  including any templates you want replaced like %s or "{{myObject}}"
     * @param args - variable args as allowed by printf-like syntax or {myObject: this.myObject}
     * @returns {string} the final translated and formatted string (in case you want to log it etc.)
     */
    public setStatusMessage(message: string, ...args: any[]): string {
        if (args) {
            message = TextUtils.formatMessage(message, ...args);
        }
        this.mOverallStatusMessage = message;
        return message;
    }

    public get statusMessage(): string {
        if (this.mOverallStatusMessage == null) {
            return this.mOperationList[this.mCurrentOperation].statusMessage;
        }
        else {
            return this.mOverallStatusMessage;
        }
    }


    /**
     * What percent complete is the Operations as a whole?s
     * @returns {number}  percentComplete weighted against how many operations are complete
     */
    public get percentComplete(): number {
        const percentPerOp: number = (TaskProgress.ONE_HUNDRED_PERCENT / this.mOperationList.length);
        const currentOpPercentComplete = this.mOperationList[this.mCurrentOperation].percentComplete ?? 0;

        return Math.ceil(percentPerOp * this.mCurrentOperation + // how many operations completed so far (each 100%)
            (percentPerOp * (currentOpPercentComplete / TaskProgress.ONE_HUNDRED_PERCENT)));

        // what is the percent complete of the current operation in the list? weight that against number of ops
    }

    /**
     * Log that the set of operations have completed.
     */
    public logOperationResults(): void {
        this.log.info("The set of operations have completed.");
    }

    /**
     * Count the total number of base operation objects
     * @returns {number}
     */
    public get totalOperations(): number {
        let count = 0;
        for (const subOp of this.mOperationList) {
            count += subOp.totalOperations;
        }
        return count;
    }

    /**
     * Add a new operation to the list of operations to be executed.
     *
     * @param {Operation} newOperation: Operation to be added to the list of sequential operations
     */
    protected addNextOperation(newOperation: Operation<any>) {
        this.mOperationList.push(newOperation);
    }

    /**
     * This is a placeholder and is never directly called.
     */
    protected execute() {
        // this.executeOperation();
    }

    /**
     * Perform all undos if the undo function is called for an Operations
     */
    protected undo() {
        this.executeNextUndo();
    }

    /**
     * Log that this is a set of operations that are about to begin.
     */
    protected logOperationBeginMessages(): void {
        this.log.info("This is a set of operations.");
    }

    /**
     * Callback invoked when the operation completes. Passed the result object of the operation.
     *
     * @param {IOperationResult} operationResult: The result of the operation
     * @param {any} output: The output from the operation
     */
    protected operationCompleted(output: any, operationResult: IOperationResult<any>): void {
        this.log.debug("Operation in list completed: " + operationResult.operationName);
        this.addResult(operationResult);

        /**
         * Check if the current operations path should continue, reasons for discontinuing may be that
         * a failure occurred, or a path diverged and we do not need to continue the operations here.
         */
        if (!operationResult.continuePath) {
            this.log.debug("Operation (" + operationResult.operationName + ") chose to quit current path");

            /**
             * If an operation failed, then we must check if other completed operations must be undone
             * If that is the case, we must process the completed operations in reverse order starting
             * with the operation prior to the operation that just 'completed'. That operation will
             * have already undone itself in the execute method.
             */
            if (operationResult.operationFailed) {

                /**
                 * Indicate that the overall list of operations failed, this will drive (if present) the parents
                 * operations undo list.
                 */
                this.mOperationResult.continuePath = false;
                this.setOperationFailed();
                this.prepareForUndo();
            } else {
                this.mOperationsCompleteCallback(output, this.mOperationResults);
            }
        } else {
            /**
             * Increment the current operation counter and invoke the next operation in the list.
             */
            this.mCurrentOperation++;
            this.executeNextOperation(output);
        }
    }

    /**
     * Abstract method that must be implemented by the subclass. In this method, you invoke "addNextOperation"
     * to add all the operations that must be performed when "executeOperation" is invoked.
     */
    protected abstract defineOperations(): void;

    /**
     * If more operations are available, execute the next operation in the list
     * @param {any} input: The output from the previous operation
     */
    private executeNextOperation(input: any): void {
        /**
         * Invoke the current operation and specify the callback method.
         */
        this.log.debug("Current operation index: " + this.mCurrentOperation +
            " out of: " + this.mOperationList.length);

        if (this.mCurrentOperation >= this.mOperationList.length) {
            this.log.info("All operations in the list have completed.");
            this.mOperationsCompleteCallback(input, this.mOperationResults);
        } else {
            // TODO - why did I do this? I have no idea...
            // /**
            //  * Execute the next operation in the list and pass the output of the previous operation to the
            //  * next operation as input OR the input to the string of operations
            //  */
            // let inputParameters: T = this.mInputParameters;
            // if (this.mCurrentOperation > 0) {
            //     inputParameters = this.mOperationList[this.mCurrentOperation - 1].operationResult.output;
            // }
            this.mOperationList[this.mCurrentOperation].executeOperation(input, this.operationCompleted.bind(this));
        }
    }

    /**
     * Prepare a list of operations to 'undo', we will traverse the list calling the undo function of
     * each operation. Only operations that are marked as 'undoa-able' will be called.
     *
     * TODO - we could probably fire off all undo functions here async, but for now they are serial
     */
    private prepareForUndo(): void {
        this.log.debug("Building list of undo operation actions");
        let currentOperationResult: IOperationResult<any> = this.mOperationResults;
        while (currentOperationResult != null) {
            if (currentOperationResult.operationUndoPossible && !currentOperationResult.operationUndoAttempted) {
                this.log.debug("Adding operation (" + currentOperationResult.operationName +
                    ") to undo list.");
                this.mOperationUndoList.push(currentOperationResult.operationObject);
                this.mOperationUndoIndex++;
            }

            currentOperationResult = currentOperationResult.nextOperationResult;
        }

        if (this.mOperationUndoIndex > 0) {
            this.log.debug("There are operations to undo, invoking undo functions now.");
            this.executeNextUndo();
        }
        else {
            this.mOperationsCompleteCallback(Operation.NO_OUTPUT, this.mOperationResults);
        }
    }

    /**
     * Execute the next undo in the list. If the undo index is 0 when this function is called, then we can
     * invoke the callers callback as all undos are complete.
     */
    private executeNextUndo(): void {
        this.log.debug("Execute next undo entered. Current index: " + this.mOperationUndoIndex);
        if (this.mOperationUndoIndex === 0) {
            this.log.debug("Invoke the callers operation complete callback.");
            this.mOperationsCompleteCallback(null, this.mOperationResults);
        } else {
            this.mOperationUndoIndex--;
            this.log.debug("Decrementing undo index and performing next undo. Index: "
                + this.mOperationUndoIndex);
            this.mOperationUndoList[this.mOperationUndoIndex].performUndo(this.undoOpComplete.bind(this));
        }
    }

    /**
     * Undo operation completed callback. Probably unnecessary.
     */
    private undoOpComplete(): void {
        this.executeNextUndo();
    }
}
