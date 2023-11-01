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

import { BadCredentialManagerError } from "../../../../src/security";

describe("BadCredentialMangagerError", () => {
    it("should construct an imperative error with the proper cause error", () => {
        const baseError = new Error("We should see this");
        const testError = new BadCredentialManagerError(baseError);

        expect(testError.message).toEqual("An invalid credential manager was passed in to the factory function!");
        expect(testError.additionalDetails).toEqual(baseError.message);
        expect(testError.causeErrors).toBe(baseError);
    });
});
