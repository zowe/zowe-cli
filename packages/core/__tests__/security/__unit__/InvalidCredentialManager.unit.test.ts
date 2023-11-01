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

import { InvalidCredentialManager } from "../src/InvalidCredentialManager";
import { BadCredentialManagerError } from "../../../src/security";

describe("InvalidCredentialMangager", () => {
    it("should throw an error for every available method on the class", async () => {
        const error = new Error("This is a test");
        const invalidManager = new InvalidCredentialManager("cli", error);
        const ignoreMethods = [ "constructor" ];

        // Loops through the InvalidCredentialManager class's direct methods and will
        // check that each one throws the expected BadCredentialManagerError object.
        // If more methods are ever added to the invalid manager, they will be checked
        // to see that they do throw errors.
        for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(invalidManager))) {
            // We will ignore any methods specified in the ignoreMethods array and
            // only look at functions of the class.
            if (ignoreMethods.indexOf(method) === -1 && typeof (invalidManager as any)[method] === "function") {
                let caughtError: Error;

                try {
                    // Try to invoke the method. We don't care about the parameters because neither should
                    // the class throwing errors.
                    await (invalidManager as any)[method]();
                } catch (e) {
                    caughtError = e;
                }

                // Check to see if this method fails the test.
                expect(caughtError).toBeDefined();
                expect(caughtError instanceof BadCredentialManagerError).toBe(true);
                expect((caughtError as any).causeErrors).toBe(error);
            }
        }
    });
});
