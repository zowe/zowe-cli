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
import * as path from "path";
import { ZosFilesAttributes, TransferMode } from "../../../src/utils/ZosFilesAttributes";

const sampleAttributesFile = `# pattern local-encoding remote-encoding
*.json -
*.bin binary
*.jcl IBM-1047 IBM-1047
*.md UTF-8 UTF-8
*.txt UTF-8 IBM-1047`;
const sampleAttributesMap = new Map(Object.entries({
    "*.json": { ignore: true },
    "*.bin": { ignore: false, localEncoding: "binary" },
    "*.jcl": { ignore: false, localEncoding: "IBM-1047", remoteEncoding: "IBM-1047" },
    "*.md": { ignore: false, localEncoding: "UTF-8", remoteEncoding: "UTF-8" },
    "*.txt": { ignore: false, localEncoding: "UTF-8", remoteEncoding: "IBM-1047" }
}));

describe("ZosFilesAttributes", () => {
    describe("Loading from file", () => {
        const existsSpy = jest.spyOn(fs, "existsSync");
        const readFileSpy = jest.spyOn(fs, "readFileSync");

        afterEach(() => {
            existsSpy.mockClear();
            readFileSpy.mockClear();
        });

        it("successfully parses .zosattributes file in current directory", () => {
            existsSpy.mockReturnValueOnce(true);
            readFileSpy.mockReturnValueOnce(sampleAttributesFile);
            const attributesLoaded = ZosFilesAttributes.loadFromFile();
            expect(readFileSpy).toHaveBeenCalledWith(path.join(process.cwd(), ".zosattributes"));
            expect((attributesLoaded as any).attributes).toEqual(sampleAttributesMap);
        });

        it("successfully parses custom attributes file", () => {
            existsSpy.mockReturnValueOnce(true);
            readFileSpy.mockReturnValueOnce(sampleAttributesFile);
            const attributesLoaded = ZosFilesAttributes.loadFromFile("../testAttributes");
            expect(readFileSpy).toHaveBeenCalledWith("../testAttributes");
            expect((attributesLoaded as any).attributes).toEqual(sampleAttributesMap);
        });

        it("successfully parses .zosattributes file in custom directory", () => {
            existsSpy.mockReturnValueOnce(true);
            readFileSpy.mockReturnValueOnce(sampleAttributesFile);
            const attributesLoaded = ZosFilesAttributes.loadFromFile(undefined, __dirname);
            expect(readFileSpy).toHaveBeenCalledWith(path.join(__dirname, ".zosattributes"));
            expect((attributesLoaded as any).attributes).toEqual(sampleAttributesMap);
        });

        it("skips parsing .zosattributes file that does not exist", () => {
            existsSpy.mockReturnValueOnce(false);
            let attributesLoaded;
            let caughtError;
            try {
                attributesLoaded = ZosFilesAttributes.loadFromFile();
            } catch (error) {
                caughtError = error;
            }
            expect(attributesLoaded).toBeUndefined();
            expect(caughtError).toBeUndefined();
        });

        it("fails to parse custom attributes file that does not exist", () => {
            existsSpy.mockReturnValueOnce(false);
            let caughtError;
            try {
                ZosFilesAttributes.loadFromFile("badAttributes");
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError.message).toBe("Attributes file badAttributes does not exist");
        });

        it("fails to parse attributes file that cannot be read", () => {
            const errMsg = "invalid attributes";
            existsSpy.mockReturnValueOnce(true);
            readFileSpy.mockImplementationOnce(() => {
                throw new Error(errMsg);
            });
            let caughtError;
            try {
                ZosFilesAttributes.loadFromFile();
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError.message).toContain("Could not read attributes file");
            expect(caughtError.message).toContain(errMsg);
        });

        it("fails to parse attributes file when there is unknown error", () => {
            const errMsg = "invalid attributes";
            existsSpy.mockReturnValueOnce(true);
            readFileSpy.mockReturnValueOnce(sampleAttributesFile);
            jest.spyOn(ZosFilesAttributes.prototype as any, "parse").mockImplementationOnce(() => {
                throw new Error(errMsg);
            });
            let caughtError;
            try {
                ZosFilesAttributes.loadFromFile();
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError.message).toContain("Error parsing attributes file");
            expect(caughtError.message).toContain(errMsg);
        });
    });

    describe("Ignoring", () => {
        it("does not ignore files not mentioned in .zosattributes", () => {
            const testable = new ZosFilesAttributes("fred -");
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeTruthy();
            expect(testable.fileShouldBeIgnored("foo.stuff")).toBeFalsy();
        });

        it("does not ignore files marked with an encoding", () => {
            const attributesFileContents = "foo.stuff ISO8859-1 ISO8859-1";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeTruthy();
        });

        it("ignores a single file marked with -", () => {
            const attributesFileContents = "foo.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldBeIgnored("foo.stuff")).toBeTruthy();
        });

        it("ignores a file marked with - and not a file marked with an encoding", () => {
            const attributesFileContents = "foo.stuff -\nbar.stuff ISO8859-1 ISO8859-1";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldBeUploaded("bar.stuff")).toBeTruthy();

        });

        it("appends base path when matching patterns", () => {
            const attributesFileContents = "bar/foo.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents, "/my/test/dir");
            expect(testable.fileShouldBeUploaded("/my/test/dir/bar/foo.stuff")).toBeFalsy();
        });

        it("ignores files matched by a *", () => {
            const attributesFileContents = "*.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldBeUploaded("bar.stuff")).toBeFalsy();
        });

        it("ignores files within directories matched by a *", () => {
            const attributesFileContents = "*.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("/a/nestted/path/to/foo.stuff")).toBeFalsy();
        });

        it("ignores files within directories matched by a * with basepath", () => {
            const attributesFileContents = "*.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents, "/a/nested");
            expect(testable.fileShouldBeUploaded("/a/nestted/path/to/foo.stuff")).toBeFalsy();
        });

        it("ignores a nested directory", () => {
            const attributesFileContents = "foo/bar/baz -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo/bar/baz")).toBeFalsy();
        });

        it("ignores files matched files when there are multiple patterns", () => {
            const attributesFileContents = "*.stuff -\n*.bin -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldBeUploaded("bar.bin")).toBeFalsy();
        });

        it("ignores files according to the last matching pattern", () => {
            const attributesFileContents = "*.stuff -\n"  +
                                           "foo.stuff binary binary";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeTruthy();
            expect(testable.fileShouldBeUploaded("bar.stuff")).toBeFalsy();
        });

    });
    describe("Transfer mode", () => {
        it("gives binary transfer for a single file specifying binary", () => {
            const testable = new ZosFilesAttributes("foo.binary binary binary");
            expect(testable.getFileTransferMode("foo.binary")).toBe(TransferMode.BINARY);
        });

        it("gives binary transfer when the same local and remote encodings are used", () => {
            const testable = new ZosFilesAttributes("foo.binary ISO8859-1 ISO8859-1");
            expect(testable.getFileTransferMode("foo.binary")).toBe(TransferMode.BINARY);
        });

        it("gives text transfer when different local and remote encodings are used", () => {
            const testable = new ZosFilesAttributes("foo.text ISO8859-1 EBCDIC");
            expect(testable.getFileTransferMode("foo.text")).toBe(TransferMode.TEXT);
        });

        it("gives binary transfer with a paterrn", () => {
            const testable = new ZosFilesAttributes("*.binary ISO8859-1 ISO8859-1");
            expect(testable.getFileTransferMode("foo.binary")).toBe(TransferMode.BINARY);
        });

        it("let last pattern determine transfer mode", () => {
            const testable = new ZosFilesAttributes("*.binary ISO8859-1 ISO8859-1\n" +
            "not.binary ISO8859-1 EBCDIC");
            expect(testable.getFileTransferMode("foo.binary")).toBe(TransferMode.BINARY);
            expect(testable.getFileTransferMode("not.binary")).toBe(TransferMode.TEXT);
        });

        it("should default to text if no pattern is matched", () => {
            const testable = new ZosFilesAttributes("*.stuff ISO8859-1 EBCDIC");
            expect(testable.getFileTransferMode("foo.text")).toBe(TransferMode.TEXT);
        });
    });

    describe("Remote encoding", () => {
        it("shuld return the remote encoding", () => {
            const testable = new ZosFilesAttributes("*.ascii ISO8859-1 ISO8859-1");
            expect(testable.getRemoteEncoding("foo.ascii")).toBe("ISO8859-1");
        });

        it("tags hidden files as specified",  () => {
            const attributesFileContents = "*.hidden binary binary";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.getRemoteEncoding(".hidden")).toBe("binary");
        });
        it("should return the remote encoding with base path", () => {
            const testable = new ZosFilesAttributes("foo.ascii ISO8859-1 ISO8859-1","/base/path");
            expect(testable.getRemoteEncoding("/base/path/foo.ascii")).toBe("ISO8859-1");
        });

        it("should default to EBCDIC if no pattern is matched", () => {
            const testable = new ZosFilesAttributes("*.stuff binary binary");
            expect(testable.getRemoteEncoding("foo.ascii")).toBeUndefined();
        });

        it("should parse EBCDIC as default encoding", () => {
            const testable = new ZosFilesAttributes("foo.ascii ISO8859-1 EBCDIC");
            expect(testable.getRemoteEncoding("foo.ascii")).toBeUndefined();
        });
    });

    describe("Local encoding", () => {
        it("should default to ISO8859-1 if no pattern is matched", () => {
            const testable = new ZosFilesAttributes("*.stuff binary binary");
            expect(testable.getLocalEncoding("foo.ascii")).toBe("ISO8859-1");
        });

        it("should return the local encoding", () => {
            const testable = new ZosFilesAttributes("*.ucs2 UCS-2 UTF-8");
            expect(testable.getLocalEncoding("foo.ucs2")).toBe("UCS-2");
        });
    });

    describe("File syntax", () => {
        it("should treat lines beginning with # as comments", () => {
            const testable = new ZosFilesAttributes("#foo.stuff -");
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeTruthy();
        });

        it("should treat lines beginning with # as comments in the middle of the file", () => {
            const testable = new ZosFilesAttributes("foo.stuff - \n # Ignore files called baz.stuff - \n baz.stuff -");
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldBeUploaded("bar.stuff")).toBeTruthy();
            expect(testable.fileShouldBeUploaded("baz.stuff")).toBeFalsy();


        });

        it("should ignore leading whitespace", () => {
            const testable = new ZosFilesAttributes("   foo.stuff -");
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
        });

        it("should ignore trailing whitespace", () => {
            const testable = new ZosFilesAttributes("foo.stuff ISO8859-1 ISO8859-1    ");
            expect(testable.getRemoteEncoding("foo.stuff")).toBe("ISO8859-1");
        });

        it("should ignore blanks lines", () => {
            const testable = new ZosFilesAttributes("foo.stuff ISO8859-1 ISO8859-1\n\n");
            expect(testable.getRemoteEncoding("foo.stuff")).toBe("ISO8859-1");
        });

        it("should complain if there are more than 3 fields per line", () => {
            let error: Error;
            try {
                const attributes = new ZosFilesAttributes("foo.stuff ISO8859-1 ISO8859-1\n" +
                                        "bar binary binary breakme");
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe("Syntax error on line 2 - expected <pattern> <local encoding> <remote encoding>.");
        });

        it("should complain if there are less than 2 fields per line", () => {
            let error: Error;
            try {
                const attributes = new ZosFilesAttributes("foo.stuff ISO8859-1 ISO8859-1\n" +
                                        "breakme");
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe("Syntax error on line 2 - expected <pattern> <local encoding> <remote encoding>.");
        });
    });
});
