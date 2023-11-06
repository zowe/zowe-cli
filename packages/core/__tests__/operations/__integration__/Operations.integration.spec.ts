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

/* eslint-disable jest/expect-expect */
import { TestOperations1 } from "../__resources__/TestOperations1";
import { TestOperations4 } from "../__resources__/TestOperations4";

import { TestOperations3 } from "../__resources__/TestOperations3";

import { IOperationResult, Operation, Operations } from "../../../src/operations/index";
import { TestLogger } from "../../__resources__/src/TestLogger";

const logger = TestLogger.getTestLogger();

class OperationTestConstants {
    public static OPER_TEST1_RESULTS: Array<IOperationResult<any>> = [{
        operationName: "Initialize Test Sub Op 1",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op 2",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op No Undo",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: false,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }];

    public static OPER_TEST2_RESULTS: Array<IOperationResult<any>> = [{
        operationName: "Initialize Test Sub Op 1",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: true,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op 2",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: true,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op No Undo",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: false,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op 4",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: true,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op 5",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: true,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op fail",
        resultMessage: "",
        operationFailed: true,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: true,
        operationUndoAttempted: true,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }];

    public static OPER_TEST3_RESULTS: Array<IOperationResult<any>> = [{
        operationName: "Initialize Test Sub Op 1",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op 2",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op No Undo",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: false,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op 4",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op 5",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }, {
        operationName: "Initialize Test Sub Op 6",
        resultMessage: "",
        operationFailed: false,
        diverge: false,
        divergeTo: null,
        continuePath: true,
        nextOperationResult: null,
        operationObject: null,
        operationUndoPossible: true,
        operationUndoFailed: false,
        operationUndoAttempted: false,
        critical: true,
        output: null,
        infoMessages: [],
        errorMessages: []
    }];
}

describe("Operation Infrastructure", () => {
    it("Operations: Test a simple set of operations", () => {
        logger.debug("Starting simple operations test.");
        const testOperation: Operations<any> = new TestOperations1();
        let operationResults: IOperationResult<any> = null;
        testOperation.executeOperation(Operation.NO_PARMS, (output: any, opResults: IOperationResult<any>) => {
            logger.debug("All operations have completed");
            operationResults = opResults;
            checkResults(operationResults, OperationTestConstants.OPER_TEST1_RESULTS);
        });
    });
    it("Operations: Test for complex set of operations", () => {
        logger.debug("Starting complex operations tests.");
        const testOperation: Operations<any> = new TestOperations3();
        let operationResults: IOperationResult<any> = null;
        testOperation.executeOperation(Operation.NO_PARMS, (output: any, opResults: IOperationResult<any>) => {
            logger.debug("All operations have completed");
            operationResults = opResults;
            checkResults(operationResults, OperationTestConstants.OPER_TEST3_RESULTS);
        });
    });
    it("Operations: Test for complex set of undo operations", () => {
        logger.debug("Starting simple undo test");
        const testOperation: Operations<any> = new TestOperations4();
        let operationResults: IOperationResult<any> = null;
        testOperation.executeOperation(Operation.NO_PARMS, (output: any, opResults: IOperationResult<any>) => {
            logger.debug("All operations have completed");
            operationResults = opResults;
            checkResults(operationResults, OperationTestConstants.OPER_TEST2_RESULTS);
        });
    });
});

function checkResults(operationActualResults: IOperationResult<any>,
    operationExpectedResults: Array<IOperationResult<any>>) {

    if (operationActualResults == null) {
        expect(0).toEqual(1);
        let currentOperationResults: IOperationResult<any> = operationActualResults;
        for (const result of operationExpectedResults) {
            logger.debug("Result operation name: " + currentOperationResults.operationName);
            logger.debug("Result expected name: " + result.operationName);

            /**
             * Test all the operation result properties agaisnt the set of expected properties
             */
            logger.debug("Checking operation name match...");
            expect(currentOperationResults.operationName).toEqual(result.operationName);
            logger.debug("Checking operation failed match...");
            expect(currentOperationResults.operationFailed).toEqual(result.operationFailed);
            logger.debug("Checking operation undo possible match...");
            expect(currentOperationResults.operationUndoPossible).toEqual(result.operationUndoPossible);
            logger.debug("Checking operation undo attempted match...");
            expect(currentOperationResults.operationUndoAttempted).toEqual(result.operationUndoAttempted);

            currentOperationResults = currentOperationResults.nextOperationResult;
        }

        if (currentOperationResults != null) {
            // more results than expected - fail
            expect(0).toEqual(1);
        }
    }
}
