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
import { Utilities, Tag, Upload, Create, Download } from "../../../../../src/api";
import { getUniqueDatasetName, getTag } from "../../../../../../../__tests__/__src__/TestUtils";

let REAL_SESSION: AbstractSession;
let testEnvironment: ITestEnvironment;

describe.only("USS Utilities", () => {

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

        const isBin = await Utilities.isFileTagBinOrAscii(REAL_SESSION,ussname);
        expect(isBin).toBe(true);
    });

    it("Should tag a text file", async () => {
        await Upload.fileToUSSFile(REAL_SESSION,localfile,ussname);
        await Utilities.chtag(REAL_SESSION,ussname,Tag.TEXT, "ISO8859-1");
        const tag = await getTag(REAL_SESSION, ussname);
        expect(tag).toMatch("t ISO8859-1");

        const isBin = await Utilities.isFileTagBinOrAscii(REAL_SESSION,ussname);
        expect(isBin).toBe(true);
    });

    it("Should flag an EBCDIC file as text", async () => {
        await Upload.fileToUSSFile(REAL_SESSION,localfile,ussname);
        await Utilities.chtag(REAL_SESSION,ussname,Tag.TEXT, "IBM-1047");
        const tag = await getTag(REAL_SESSION, ussname);
        expect(tag).toMatch("t IBM-1047");

        const isBin = await Utilities.isFileTagBinOrAscii(REAL_SESSION,ussname);
        expect(isBin).toBe(false);
    });

    it("should rename USS file", async () => {
        const defaultSystem = testEnvironment.systemTestProperties;

        let createdName = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.CREATED`);
        createdName = createdName.replace(/\./g, "");
        createdName = `${defaultSystem.unix.testdir}/${createdName}`;

        let newName = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.RENAMED`);
        newName = newName.replace(/\./g, "");
        newName = `${defaultSystem.unix.testdir}/${newName}`;

        Imperative.console.info("Uploading file with name: " + createdName);
        await Create.uss(REAL_SESSION, createdName, "file");
        Imperative.console.info("Should rename to: " + newName);
        await Utilities.renameUSSFile(REAL_SESSION, createdName, newName);
        const result = await Download.ussFile(REAL_SESSION, newName);
        expect(result.success).toBe(true);
    });
});
