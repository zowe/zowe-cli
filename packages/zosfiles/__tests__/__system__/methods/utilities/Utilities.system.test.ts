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

import { posix } from "path";
import { ITestEnvironment, TestEnvironment } from "@zowe/cli-test-utils";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { AbstractSession, Imperative, IO } from "@zowe/imperative";
import { Utilities, Tag, Upload, Create, Download } from "../../../../src";
import { getUniqueDatasetName, getTag } from "../../../../../../__tests__/__src__/TestUtils";

let REAL_SESSION: AbstractSession;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

describe("USS Utilities", () => {
    const localfile = __dirname + "/__data__/tagfile.txt";
    let ussname: string;

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_files_utilities"
        }, REAL_SESSION = await TestEnvironment.createSession());

        const defaultSystem = testEnvironment.systemTestProperties;
        let dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.UPLOAD`);
        dsname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${dsname}`;
        Imperative.console.info("Using ussDir:" + ussname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should tag a binary file", async () => {
        const fileResponse = await Upload.fileToUssFile(REAL_SESSION, localfile, ussname);
        const fileName = fileResponse.apiResponse.to;
        await Utilities.chtag(REAL_SESSION, ussname, Tag.BINARY);
        const tag = await getTag(REAL_SESSION, ussname);
        expect(tag).toMatch("b binary");

        const isBin = await Utilities.isFileTagBinOrAscii(REAL_SESSION, ussname);
        expect(isBin).toBe(true);
        testEnvironment.resources.files.push(fileName);
    });

    it("should tag a text file", async () => {
        const fileResponse = await Upload.fileToUssFile(REAL_SESSION, localfile, ussname);
        const fileName = fileResponse.apiResponse.to;
        await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "ISO8859-1");
        const tag = await getTag(REAL_SESSION, ussname);
        expect(tag).toMatch("t ISO8859-1");

        const isBin = await Utilities.isFileTagBinOrAscii(REAL_SESSION, ussname);
        expect(isBin).toBe(true);
        testEnvironment.resources.files.push(fileName);
    });

    it("should flag an EBCDIC file as text", async () => {
        const fileResponse = await Upload.fileToUssFile(REAL_SESSION, localfile, ussname);
        const fileName = fileResponse.apiResponse.to;
        await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "IBM-1047");
        const tag = await getTag(REAL_SESSION, ussname);
        expect(tag).toMatch("t IBM-1047");

        const isBin = await Utilities.isFileTagBinOrAscii(REAL_SESSION, ussname);
        expect(isBin).toBe(false);
        testEnvironment.resources.files.push(fileName);
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

        // Delete created local file
        IO.deleteFile(posix.basename(newName));
        testEnvironment.resources.files.push(newName);
    });

    it("should rename USS file - encoded", async () => {
        const defaultSystem = testEnvironment.systemTestProperties;

        let createdName = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.ENCO#ED.CREATED`);
        createdName = createdName.replace(/\./g, "");
        createdName = `${defaultSystem.unix.testdir}/${createdName}`;

        let newName = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.ENCO#ED.RENAMED`);
        newName = newName.replace(/\./g, "");
        newName = `${defaultSystem.unix.testdir}/${newName}`;

        Imperative.console.info("Uploading file with name: " + createdName);
        await Create.uss(REAL_SESSION, createdName, "file");
        Imperative.console.info("Should rename to: " + newName);
        await Utilities.renameUSSFile(REAL_SESSION, createdName, newName);
        const result = await Download.ussFile(REAL_SESSION, newName);
        expect(result.success).toBe(true);

        // Delete created local file
        IO.deleteFile(posix.basename(newName));
        testEnvironment.resources.files.push(newName);
    });

    describe("applyTaggedEncoding", () => {
        let fileName: string;
        beforeAll(async () => {
            const fileResponse = await Upload.fileToUssFile(REAL_SESSION, localfile, ussname);
            fileName = fileResponse.apiResponse.to;
        });

        afterAll(async () => {
            testEnvironment.resources.files.push(fileName);
        });

        it("should set binary property if file is tagged as binary", async () => {
            await Utilities.chtag(REAL_SESSION, ussname, Tag.BINARY);
            const options: any = {};
            await Utilities.applyTaggedEncoding(REAL_SESSION, ussname, options);
            expect(options.binary).toBe(true);
            expect(options.encoding).toBeUndefined();
        });

        it("should set binary property if file encoding is ISO8859-1", async () => {
            await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "ISO8859-1");
            const options: any = {};
            await Utilities.applyTaggedEncoding(REAL_SESSION, ussname, options);
            expect(options.binary).toBe(true);
            expect(options.encoding).toBeUndefined();
        });

        it("should set binary property if file encoding is UCS-2", async () => {
            await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "UCS-2");
            const options: any = {};
            await Utilities.applyTaggedEncoding(REAL_SESSION, ussname, options);
            expect(options.binary).toBe(true);
            expect(options.encoding).toBeUndefined();
        });

        it("should set binary property if file encoding is UTF-8", async () => {
            await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "UTF-8");
            const options: any = {};
            await Utilities.applyTaggedEncoding(REAL_SESSION, ussname, options);
            expect(options.binary).toBe(true);
            expect(options.encoding).toBeUndefined();
        });

        it("should set encoding property if file encoding has IBM prefix", async () => {
            await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "IBM-1047");
            const options: any = {};
            await Utilities.applyTaggedEncoding(REAL_SESSION, ussname, options);
            expect(options.binary).toBeUndefined();
            expect(options.encoding).toBe("IBM-1047");
        });

        it("should do nothing if file is untagged", async () => {
            await Utilities.putUSSPayload(REAL_SESSION, ussname,
                { request: "chtag", action: "remove" });
            const options: any = {};
            await Utilities.applyTaggedEncoding(REAL_SESSION, ussname, options);
            expect(options.binary).toBeUndefined();
            expect(options.encoding).toBeUndefined();
        });
    });
});
