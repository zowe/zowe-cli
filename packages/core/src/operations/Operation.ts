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

import * as fs from "fs";
import { removeSync } from "fs-extra";

import { IOperationResult } from "./doc/IOperationResult";
import { ITaskWithStatus } from "./doc/ITaskWithStatus";
import { TaskProgress } from "./TaskProgress";
import { TaskStage } from "./TaskStage";
import { Logger } from "../logger/Logger";
import { TextUtils } from "../utils/TextUtils";


export type IOperationCompleted<T> =
    (output: T) => void;

export type IOperationUndoCompleted =
    () => void;

export type IOperationResultReady<T> =
    (output: T, operationResults: IOperationResult<any>) => void;

export abstract class Operation<T> implements ITaskWithStatus {

    public static readonly NO_PARMS: any = null;

    public static readonly NO_OUTPUT: any = null;

    public static summarizeResults(operationResults: IOperationResult<any>): boolean {
        let currentResults: IOperationResult<any> = operationResults;
        let overallFailure: boolean = false;

        const staticLogger: Logger = Logger.getImperativeLogger();


        staticLogger.info("***********************************************************************************");
        staticLogger.info("**************************** Operation Results Summary ****************************");

        if (currentResults == null) {
            staticLogger.info("**************************************" +
                "*********************************************");
            staticLogger.info("No results to display");
        } else {

            while (currentResults != null) {
                staticLogger.info("*************************************************" +
                    "**********************************");
                if (currentResults.operationFailed) {
                    staticLogger.error("Operation Failed: " + currentResults.operationName);
                    if (currentResults.critical) {
                        overallFailure = true;
                    }
                } else {
                    staticLogger.info("Operation Succeeded: " + currentResults.operationName);
                }
                currentResults.operationObject.logOperationResults();
                staticLogger.info("Number of info messages for result: %d", currentResults.infoMessages.length);
                for (const msg of currentResults.infoMessages) {
                    staticLogger.info(msg);
                }
                staticLogger.info("Number of error messages for result: %d", currentResults.errorMessages.length);
                for (const msg of currentResults.errorMessages) {
                    staticLogger.error(msg);
                }
                currentResults = currentResults.nextOperationResult;
            }
        }

        if (overallFailure) {
            staticLogger.info("**************************************" +
                "*********************************************");
            staticLogger.error("************************The operation has failed. Sorry.***********" +
                "***************");
            staticLogger.info("*******************************************" +
                "****************************************");
        } else {
            staticLogger.info("***********************************************************************" +
                "************");
            staticLogger.info("**********************The operation has succeeded! Rejoice!*******" +
                "*****************");
            staticLogger.info(Operation.outputSeparator +
                "****************");
        }

        return overallFailure;
    }

    /**
     * Traverses the results chain and prints results and gives overall failure status
     */
    private static readonly outputSeparator = "*******************************************************************";

    public infoMessages: string[] = [];
    public errorMessages: string[] = [];

    public get statusMessage(): string {
        return this.mStatusMessage;
    }

    public get percentComplete(): number {
        return this.mPercentComplete;
    }

    public set percentComplete(newPercent: number) {
        if (newPercent > TaskProgress.ONE_HUNDRED_PERCENT) {
            this.log.warn("An attempt was made to set percent complete in Operation to a value above 100");
            this.mPercentComplete = TaskProgress.ONE_HUNDRED_PERCENT;
        }
        else {

            this.mPercentComplete = Math.ceil(newPercent);
        }
    }

    public get totalOperations(): number {
        return 1; // base case: 1 operation, no subops
    }

    protected log: Logger;
    /**
     * The full list of operation results
     */
    protected mOperationResults: IOperationResult<any> = null;

    /**
     * the result from the operation
     */
    protected mOperationResult: IOperationResult<T>;

    /**
     * The status of the operation
     */
    private mStageName: TaskStage = TaskStage.NOT_STARTED;

    /**
     * A string describing what is currently happening in the operation e.g. "Submitted job..."
     */
    private mStatusMessage: string;

    private mPercentComplete: number = 0;

    /**
     * The operation has completed and results are ready, this callback is invoked to inform the
     * caller of executeOperation, that the operation is done.
     */
    private mOperationCompleteCallback: IOperationResultReady<any>;

    /**
     * The list of all files that have been created by the service function
     * @type {Array}
     */
    private mAllFilesCreated: string[] = [];

    /**
     * The list of files that will be cleaned during an undo operation.
     * @type {Array}
     */
    private mFilesForUndo: string[] = [];

    /**
     * Action constructor to build action object
     * @param {string} opName: the name of the operation
     * @param {boolean} criticalOperation the operation is critical - meaning if it fails the entire operation fails and
     * the undo methods should be called.
     */
    constructor(opName: string, criticalOperation?: boolean) {
        this.log = Logger.getImperativeLogger();
        this.mOperationResult = {
            operationName: opName,
            resultMessage: "",
            operationFailed: false,
            diverge: false,
            divergeTo: null,
            continuePath: true,
            nextOperationResult: null,
            operationObject: this,
            operationUndoPossible: false,
            operationUndoFailed: false,
            operationUndoAttempted: false,
            critical: (criticalOperation != null ? criticalOperation : false),
            output: null,
            infoMessages: [],
            errorMessages: []
        };
    }

    /**
     * Execute the operation. Set the status of the operation to IN_PROGRESS and invoke the implemented operations
     * execute method.
     *
     * @param {any} inputParameters: The input parameters to this operation. This can be anything as defined by
     * the operation.
     * @param {IOperationResultReady} operationComplete: Operation has completed callback
     */
    public executeOperation(inputParameters: T, operationComplete: IOperationResultReady<any>): void {
        /**
         * Set the status of the operation to in progress, log the operation begin message
         * and save the callers callback method for after the operation completes.
         */
        this.mStageName = TaskStage.IN_PROGRESS;
        this.logBeginMessage();
        this.mOperationCompleteCallback = operationComplete;

        /**
         * Execute the operation, the operation must invoke the callback method
         * to continue the operation sequence. Results will be processed in the
         * callback function below.
         */
        this.execute(inputParameters, this.operationComplete.bind(this));
    }


    /**
     *  Set the status message for the operation
     * @param message - the message,  including any templates you want replaced like %s or "{{myObject}}"
     * @param args - variable args as allowed by printf-like syntax or {myObject: this.myObject}
     * @returns {string} the final translated and formatted string (in case you want to log it etc.)
     */
    public setStatusMessage(message: string, ...args: any[]) {
        if (args != null) {
            message = TextUtils.formatMessage(message, ...args);
        }
        this.mStatusMessage = message;
    }

    /**
     * The perform undo method sets that an attempt was made to perform the undo and invokes the
     * undo method of the implemented operation.
     *
     * Before invoking, any files that have been created and saved on the undo-able list will be cleaned.
     *
     * @param {IOperationUndoCompleted} undoCompletedCallback: the undo completed callback
     */
    public performUndo(undoCompletedCallback: IOperationUndoCompleted): void {
        this.log.info("Operation: " + this.mOperationResult.operationName + " attempting undo action.");
        this.setOperationUndoAttempted();
        this.deleteAllFilesMarkedForUndo();
        this.undo(undoCompletedCallback.bind(this));
    }

    /**
     * Override this method when implementing and place any operation end messages that should be
     * logged here.
     */
    public abstract logOperationResults(): void;

    /**
     * Accessor method for operation result
     * @returns {IOperationResult}: The operation result
     */
    get operationResult(): IOperationResult<T> {
        const result = this.mOperationResult;
        result.errorMessages = this.errorMessages;
        result.infoMessages = this.infoMessages;
        return result;
    }

    /**
     * Accessor method for operation status
     * @returns {TaskStage}: The operation status/ stage name e.g. FAILED
     */
    get stageName(): TaskStage {
        return this.mStageName;
    }

    /**
     * Accessor method to obtain all the files created using the file creator service
     * @return {string[]}
     */
    get allFilesCreated(): string[] {
        return this.mAllFilesCreated;
    }

    /**
     * Accessor method to obtain all the files created that are marked as delete on undo
     * @return {string[]}
     */
    get fileToUndo(): string[] {
        return this.mFilesForUndo;
    }

    /**
     * Get the operation name for display and other purposes
     * @return {string}
     */
    get operationName(): string {
        return this.operationResult.operationName;
    }

    /**
     * Set method to indicate that the operation failed.
     */
    protected setOperationFailed() {
        this.mOperationResult.operationFailed = true;
    }

    /**
     * Set method to indicate that the operation is "undoable".
     *
     * This means that if an operation fails, we will 'rollback' through the completed operations
     * and undo any that have occurred.
     */
    protected setOperationUndoable() {
        this.mOperationResult.operationUndoPossible = true;
    }

    /**
     * Append an additional message to the result message buffer
     * @param {string} message: The result message you wish to append.
     */
    set operationResultMessage(message: string) {
        this.mOperationResult.resultMessage += (" " + message);
    }

    /**
     * Determine if the operation failed
     *
     * @return {boolean}: If the operation failed
     */
    get operationSucceeded(): boolean {
        return !(this.mStageName === TaskStage.FAILED);
    }

    /**
     * Set that the operation undo failed. This is for diagnostic purposes.
     */
    protected setOperationUndoFailed(): void {
        this.mOperationResult.operationUndoFailed = true;
    }

    /**
     * If the operation decides that a different path is required. You can set the next operation to complete
     * and whether or not you should continue down the original path
     *
     * @param {Operation} operation: the operation you use to diverge to
     * @param {boolean} continuePathAfterDiverge: Indicates that you want to continue down the normal path after
     * the divergent path is complete.
     */
    protected setOperationDiverge(operation: Operation<any>, continuePathAfterDiverge: boolean) {
        this.mOperationResult.diverge = true;
        this.mOperationResult.divergeTo = operation;
        this.mOperationResult.continuePath = continuePathAfterDiverge;
    }

    /**
     * Set the operation undo attempted (whether it succeed or failed is up to the undo method to set)
     */
    protected setOperationUndoAttempted() {
        this.mOperationResult.operationUndoAttempted = true;
    }

    /**
     * The execute method must be implemented by the class. This is where the operation performs its
     * work and sets the result and the course of action (failed, undo possible, etc).
     *
     * @param {any} inputParameters: The input parameters to the operation
     * @param {IOperationCompleted} operationCompletedCallback: Operation
     */
    protected abstract execute(inputParameters: T, operationCompletedCallback: IOperationCompleted<any>): void;

    /**
     * The undo method is called when an operation fails and the operation is set to "undoable"
     */
    protected abstract undo(undoCompleteCallback: IOperationUndoCompleted): void;

    /**
     * Override this method when implementing and place any operation start messages that should be
     * logged here.
     */
    protected abstract logOperationBeginMessages(): void;

    /**
     * Add the result to the end of the results list
     * @param {IOperationResult} result: the result from the last operation
     */
    protected addResult(result: IOperationResult<any>) {
        if (this.mOperationResults == null) {
            this.mOperationResults = result;
            this.log.debug("Queued first operation to result list: " + result.operationName);
        } else {
            let prevResult: IOperationResult<any> = this.mOperationResults;
            let currentResult: IOperationResult<any> = this.mOperationResults;
            do {
                prevResult = currentResult;
                currentResult = currentResult.nextOperationResult;
            } while (currentResult != null);
            prevResult.nextOperationResult = result;
            this.log.debug("Queued additional operation to result list: " + result.operationName);
        }
    }

    /**
     * Use this method to create files and optionally push them onto the files created stack that will
     * be referenced when an undo is required.
     *
     * @param {string} filePath
     * @param {string} message: the error message to print.
     * @param {boolean} saveFileNameForUndo: Whether you want to keep track of the files created for undo
     * @param {boolean} isDir: if this is a file or directory
     */
    protected createFile(filePath: string, message: string, saveFileNameForUndo: boolean, isDir: boolean) {
        this.log.debug("Operation: " + this.operationName + " creating file/dir: " + filePath);
        try {
            if (isDir) {
                fs.mkdirSync(filePath);
            } else {
                fs.closeSync(fs.openSync(filePath, "w"));
            }
            this.mAllFilesCreated.push(filePath);
            if (saveFileNameForUndo) {
                this.mFilesForUndo.push(filePath);
            }
        } catch (error) {
            const msg: string = "An error occurred creating file: " + filePath +
                " during operation: " + this.operationResult.operationName;
            this.log.error(message);
            this.log.error(msg);
            throw new Error(msg);
        }
    }

    /**
     * Method to print all the files created by the file creator service.
     */
    protected printFilesCreatedList() {
        this.log.debug(this.allFilesCreated.length + " files created during "
            + this.operationResult.operationName);
        for (let x = 0; x < this.allFilesCreated.length; x++) {
            this.log.debug("File: " + this.mAllFilesCreated[x]);
        }
    }

    /**
     * Add a file created by the operation to the list of all files created and optionally mark this file
     * as undoable, which will cause the undo operation to attempt to remove the file or directory.
     *
     * @param {boolean} fileUndoable: The file or directory should be automatically removed by the undo operation.
     * @param {string} file: The file or directory created.
     */
    protected addFileCreated(fileUndoable: boolean, file: string) {
        this.log.debug("Adding files created: %s", file);
        this.mAllFilesCreated.push(file);
        if (fileUndoable) {
            this.mFilesForUndo.push(file);
        }
    }

    /**
     * Method that is called after the implementing classes undo to delete all the files that have been
     * saved during the operation (on the mFilesForUndo list).
     */
    private deleteAllFilesMarkedForUndo(): void {
        this.log.info("Cleaning all files and directories marked as 'undo-able'.");
        const order: string[] = [];

        /**
         * Reverse the order that the files/directories were created (in-case they are nested)
         */
        for (let x = this.fileToUndo.length - 1; x > -1; x--) {
            order.push(this.mFilesForUndo[x]);
        }

        for (let x = 0; x < order.length; x++) {
            this.log.info("Cleaning file: " + this.fileToUndo[x]);
            try {
                if (fs.statSync(order[x]).isDirectory()) {
                    removeSync(order[x]);
                } else {
                    fs.unlinkSync(order[x]);
                }
            } catch (error) {
                this.log.error("An error occurred deleting: " + order[x]);
                this.log.error("Message: " + error.message);
            }
        }
    }

    /**
     * This method logs a standard header for the operation
     */
    private logBeginMessage(): void {
        const seperator: string = Operation.outputSeparator;
        const text: string = "***Operation: " + this.mOperationResult.operationName + " is starting ";
        const appendlength: number = seperator.length - text.length;

        let append: string = "";
        if (appendlength > 0) {
            for (let x = 0; x < appendlength; x++) {
                append += "*";
            }
        }

        this.log.debug(Operation.outputSeparator);
        this.log.debug(text + append);
        this.log.debug(Operation.outputSeparator);
        this.logOperationBeginMessages();
    }

    /**
     * This method logs a standard header for the operation
     */
    private logEndMessage(): void {
        this.log.debug("Operation: " + this.mOperationResult.operationName + " has ended.");
        if (this.mOperationResult.operationFailed) {
            this.log.error("Operation " + this.mOperationResult.operationName + " has failed.");
        } else {
            this.log.debug("Operation has succeeded.");
        }
    }

    /**
     * Operation complete callback method. The operation must invoke the callback to indicate that it
     * has finished. If it does not, the operation sequence will not continue.
     */
    private operationComplete(output: any): void {

        /**
         * Set the status of the operation based on whether or not it failed.
         */
        if (this.mOperationResult.operationFailed) {
            this.mStageName = TaskStage.FAILED;

            /**
             * If the operation is marked as critical, then we cannot continue the set of operations
             */
            if (this.mOperationResult.critical) {
                this.mOperationResult.continuePath = false;
            }

            this.log.error("Operation: " + this.mOperationResult.operationName + " has failed.");
            this.log.error("Will attempt undo operations where applicable.");
        } else {
            this.mStageName = TaskStage.COMPLETE;
        }

        /**
         * Add the result of this operation to the operation results chain.
         */
        this.addResult(this.operationResult);
        this.logEndMessage();

        // /**
        //  * Determine if this operation has chosen to diverge to an arbitrary operation
        //  *
        //  * An operation can diverge to any operation it chooses, and the result is chained
        //  */
        // if (this.mOperationResult.diverge && this.mOperationResult.continuePath) {
        //     this.addResult(this.mOperationResult.divergeTo.executeOperation());
        // }

        /**
         * If the operation failed and undo is possible, attempt the undo now. Operations must be undone
         * in the LIFO order to effectively rollback any changes.
         */
        if (this.mOperationResult.operationFailed && this.mOperationResult.operationUndoPossible) {
            this.performUndo(this.undoComplete.bind(this));
        }

        /**
         * Invoke the callers operation complete callback if we are not performing an operation undo.
         */
        if (!this.mOperationResult.operationUndoAttempted) {
            this.log.debug("Calling operation complete callback for: " + this.mOperationResult.operationName);
            this.mOperationCompleteCallback(output, this.mOperationResult);
        }
    }

    /**
     * The operation undo complete callback method, this must be called by the operations undo method
     * in order for the operation 'undos' to continue.
     */
    private undoComplete(): void {
        this.log.debug("Calling operation complete callback after undo: "
            + this.mOperationResult.operationName);
        this.mOperationCompleteCallback(null, this.mOperationResult);
    }
}
