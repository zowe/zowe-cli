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

import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { Session } from "@brightside/imperative";
import { Utilities, Tag } from "../../../../../src/api";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;

describe("USS Utllites", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_files_utilities"
        });

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

    });
    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("Should tag an existing file", async () => {
        await Utilities.chtag(REAL_SESSION,"/u/wilson/zowe-tests/WILSONZOSFILEUPLOADA1551361A174405/bar.binary",Tag.BINARY);
    });
});
