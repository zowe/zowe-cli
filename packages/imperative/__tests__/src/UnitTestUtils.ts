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

// we need non-arrow functions to override some jest code
import { TestLogger } from "../TestLogger";
import { isNullOrUndefined } from "util";

const fnArgs = require("get-function-arguments");
const cowsay = require("cowsay");

export class UnitTestUtils {
    /**
     * Retain the old it definition
     */
    public static oldIt: any = it;

    /**
     * Overloaded method description.
     *
     * @param {() => void} callFcn A function to call that expects an error.
     * @returns {Error} The error thrown by the function.
     */
    public static catchError(callFcn: () => void): Error;

    /**
     * Overloaded method description.
     *
     * @param {Promise<any>} callFcn A pre-created promise reject an error.
     * @returns {Promise<Error>} The promise of an error returned
     */
    public static catchError(callFcn: Promise<any>): Promise<Error>;

    /**
     * This function allows a test to capture an error from the function specified as the input parameter.
     *
     * It works on both direct calls and functions that return a promise (Like async functions).
     *
     * @param callFcn either the promise or function to check for an error.
     * @returns {Error | Promise<Error>} Either the error that was caught or a promise that will resolve
     * to a caught error.
     *
     * @throws {Error} When the function or promise didn't throw an error.
     */
    public static catchError(callFcn: any): Error | Promise<Error> {
        if (callFcn instanceof Promise) {
            return new Promise((resolve, reject) => {
                callFcn
                    .then(() => {
                        reject(new Error("Expected function to throw an error but it didn't!"));
                    })
                    .catch((error: Error) => {
                        resolve(error);
                    });
            });
        } else {
            try {
                callFcn();
            } catch (error) {
                return error;
            }
        }

        throw new Error("Expected function to throw an error but it didn't!");
    }

    /**
     * Replaces the Jest It definition with a custom handler. The intention is to perform a psuedo-beforeEach where
     * you can capture the it details (such as the description) for logging and other purposes. You can supply a
     * custom function to be invoked OR the all the default, which is to log the test description (to allow for
     * easier parsing/reading of the TestLogger logs.
     * @static
     * @param {(details: any) => void} [testDetailHandler] - Optional function to invoke (rather than the default)
     * @returns {*} - Returns the it definition
     * @memberof UnitTestUtils
     */
    public static replaceIt(testDetailHandler?: (details: any) => void): any {
        // eslint-disable-next-line no-global-assign
        (it as any) = function (description: string, testFunc: (done?: any) => void) {
            const log = TestLogger.getTestLogger();
            if (isNullOrUndefined(testDetailHandler)) {
                testDetailHandler = function (details: any) {
                    log.info("\n" + cowsay.say({
                        text: (details as any).description,
                        e: "oO",
                        T: "U ",
                        wrap: true,
                        wrapLength: 80
                    }));
                };
            }

            if (fnArgs(testFunc).length > 0) {
                const testDetails = UnitTestUtils.oldIt(description, (done: any) => {
                    testDetailHandler(testDetails);
                    testFunc(done);
                });
            } else {
                const testDetails = UnitTestUtils.oldIt(description, () => {
                    testDetailHandler(testDetails);
                    testFunc();
                });
            }
        };
    }
}
