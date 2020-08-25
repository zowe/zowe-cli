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


import { ZosFilesAttributes, TransferMode } from "../../../";


describe("ZosFilesAttributes", () => {
    describe("Ignoring", () => {
        it("does not ignore files not mentioned in .zosattributes", () => {
            const testable = new ZosFilesAttributes("fred -");
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeTruthy();
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

        it("should default to binary if no pattern is matched", () => {
            const testable = new ZosFilesAttributes("*.stuff ISO8859-1 EBCDIC");
            expect(testable.getFileTransferMode("foo.binary")).toBe(TransferMode.BINARY);
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
        it("shuld return the remote encoding with base path", () => {
            const testable = new ZosFilesAttributes("foo.ascii ISO8859-1 ISO8859-1","/base/path");
            expect(testable.getRemoteEncoding("/base/path/foo.ascii")).toBe("ISO8859-1");
        });

        it("should default to ISO8859-1 if no pattern is matched", () => {
            const testable = new ZosFilesAttributes("*.stuff binary binary");
            expect(testable.getRemoteEncoding("foo.ascii")).toBe("ISO8859-1");
        });
    });

    describe("Local encoding", () => {
        it("should default to ISO8859-1 if no pattern is matched", () => {
            const testable = new ZosFilesAttributes("*.stuff binary binary");
            expect(testable.getLocalEncoding("foo.ascii")).toBe("ISO8859-1");
        });

        it("shuld return the local encoding", () => {
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
