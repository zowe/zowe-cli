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
import { AbstractSession, Imperative } from "@brightside/imperative";
import { Utilities, Tag, Upload } from "../../../../../src/api";
import { getUniqueDatasetName, getTag } from "../../../../../../../__tests__/__src__/TestUtils";

let REAL_SESSION: AbstractSession;
let testEnvironment: ITestEnvironment;

describe("USS Utllites", () => {

    const localfile = "./packages/zosfiles/__tests__/__system__/api/methods/utilities/__data__/tagfile.txt";
    let ussname: string;
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_files_utilities"
        });
        const defaultSystem = testEnvironment.systemTestProperties;

        let dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.UPLOAD`);
        dsname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${dsname}`;
        Imperative.console.info("Using ussDir:" + ussname);


        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

    });
    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("Should tag a binary file", async () => {
        await Upload.fileToUSSFile(REAL_SESSION,localfile,ussname);
        await Utilities.chtag(REAL_SESSION,ussname,Tag.BINARY);
        const tag = await getTag(REAL_SESSION, ussname);
        expect(tag).toMatch("b binary");
    });

    it("Should tag a text file", async () => {
        await Upload.fileToUSSFile(REAL_SESSION,localfile,ussname);
        await Utilities.chtag(REAL_SESSION,ussname,Tag.TEXT, "ISO8859-1");
        const tag = await getTag(REAL_SESSION, ussname);
        expect(tag).toMatch("t ISO8859-1");
    });

});
