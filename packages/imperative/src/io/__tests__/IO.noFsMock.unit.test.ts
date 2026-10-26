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

import { IO } from "../../io";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

const skipOnWin = process.platform === 'win32' ? it.skip : it;
const skipOnPosix = process.platform !== 'win32' ? it.skip : it;

describe("IO tests", () => {
    describe("isSubPath", () => {
        it("should not flag a subpath", () => {
            const parent = path.join(__dirname, "parent");
            const child = path.join(__dirname, "parent", "child");
            const result = IO.isSubPath(parent, child);
            expect(result).toEqual(true);
        });

        it("should flag a subpath with backtracking", () => {
            const parent = path.join(__dirname, "parent");
            const child = path.join(__dirname, "parent", "..", "child");
            const result = IO.isSubPath(parent, child);
            expect(result).toEqual(false);
        });

        it("should flag a subpath that is absolute", () => {
            const rootDir = __dirname.split(path.sep)[0];
            const parent = "fakedir";
            const child = rootDir;
            const result = IO.isSubPath(parent, child);
            expect(result).toEqual(false);
        });

        describe("real filesystem containment", () => {
            let tempDir: string;
            let parent: string;
            let external: string;

            beforeEach(() => {
                tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zowe-io-containment-"));
                parent = path.join(tempDir, "parent");
                external = path.join(tempDir, "external");
                fs.mkdirSync(parent);
                fs.mkdirSync(external);
            });

            afterEach(() => {
                fs.rmSync(tempDir, { recursive: true, force: true });
            });

            it("should reject an external directory junction", () => {
                const link = path.join(parent, "link");
                fs.symlinkSync(external, link, "junction");
                expect(IO.isSubPath(parent, link)).toEqual(false);
            });

            it("should reject missing descendants of an external directory junction", () => {
                const link = path.join(parent, "link");
                fs.symlinkSync(external, link, "junction");
                expect(IO.isSubPath(parent, path.join(link, "missing", "schema.json"))).toEqual(false);
            });

            // Windows file symlinks require privileges; directory junction cases run on all platforms.
            skipOnWin("should reject an external file symlink", () => {
                const target = path.join(external, "schema.json");
                const link = path.join(parent, "schema.json");
                fs.writeFileSync(target, "{}");
                fs.symlinkSync(target, link, "file");
                expect(IO.isSubPath(parent, link)).toEqual(false);
            });

            it("should allow missing descendants of an existing parent", () => {
                expect(IO.isSubPath(parent, path.join(parent, "missing", "schema.json"))).toEqual(true);
            });

            it("should allow missing parents and their descendants", () => {
                const missingParent = path.join(parent, "missing", "parent");
                expect(IO.isSubPath(missingParent, path.join(missingParent, "child", "schema.json"))).toEqual(true);
            });

            it("should allow descendants when the parent is itself a junction", () => {
                const linkedParent = path.join(tempDir, "linked-parent");
                fs.symlinkSync(parent, linkedParent, "junction");
                fs.writeFileSync(path.join(parent, "schema.json"), "{}");
                expect(IO.isSubPath(linkedParent, path.join(linkedParent, "schema.json"))).toEqual(true);
                expect(IO.isSubPath(linkedParent, path.join(linkedParent, "missing", "schema.json"))).toEqual(true);
            });

            it("should reject the same root", () => {
                expect(IO.isSubPath(parent, parent)).toEqual(false);
            });

            it("should reject a descendant junction resolving to the parent root", () => {
                const link = path.join(parent, "link");
                fs.symlinkSync(parent, link, "junction");
                expect(IO.isSubPath(parent, link)).toEqual(false);
            });

            it.each(["", path.join("missing", "schema.json")])("should reject a dangling junction with suffix '%s'", (suffix) => {
                const link = path.join(parent, "link");
                fs.symlinkSync(external, link, "junction");
                fs.rmdirSync(external);
                expect(IO.isSubPath(parent, path.join(link, suffix))).toEqual(false);
            });

            it("should reject a dangling parent junction", () => {
                const linkedParent = path.join(tempDir, "linked-parent");
                fs.symlinkSync(parent, linkedParent, "junction");
                fs.rmdirSync(parent);
                expect(IO.isSubPath(linkedParent, path.join(linkedParent, "schema.json"))).toEqual(false);
            });

            it("should allow internal directory junctions and their descendants", () => {
                const target = path.join(parent, "target");
                const link = path.join(parent, "link");
                fs.mkdirSync(target);
                fs.writeFileSync(path.join(target, "schema.json"), "{}");
                fs.symlinkSync(target, link, "junction");
                expect(IO.isSubPath(parent, link)).toEqual(true);
                expect(IO.isSubPath(parent, path.join(link, "schema.json"))).toEqual(true);
                expect(IO.isSubPath(parent, path.join(link, "missing", "schema.json"))).toEqual(true);
            });

            it("should retain lexical containment when an external junction points inside", () => {
                const link = path.join(external, "link");
                fs.symlinkSync(parent, link, "junction");
                expect(IO.isSubPath(parent, path.join(link, "schema.json"))).toEqual(false);
            });

            it("should reject a non-directory ancestor", () => {
                const file = path.join(parent, "file");
                fs.writeFileSync(file, "{}");
                expect(IO.isSubPath(parent, path.join(file, "schema.json"))).toEqual(false);
            });
        });
    });
    describe("containsBacktrack", () => {
        it("should return true if path contains backtracking", () => {
            expect(IO.containsBacktrack("path" + path.sep +  ".." + path.sep + "backtracked")).toEqual(true);
        });
        it("should return true if path contains recursive backtracking", () => {
            expect(IO.containsBacktrack("path" + path.sep +  ".." + path.sep + ".." + path.sep + "backtracked")).toEqual(true);
        });
        it("should return true if path contains posix backtracking", () => {
            expect(IO.containsBacktrack("path/../backtracked")).toEqual(true);
        });
        it("should return true if path contains recursive posix backtracking", () => {
            expect(IO.containsBacktrack("path/../../backtracked")).toEqual(true);
        });
        it("should return false if path does not contain backtracking", () => {
            expect(IO.containsBacktrack("path" + path.sep + "backtracked")).toEqual(false);
        });
        it("should return false if path is just one element", () => {
            expect(IO.containsBacktrack("path")).toEqual(false);
        });
    });
    describe("fileEvaluatesToDir", () => {
        it("should flag an element containing a path seperator", () => {
            expect(IO.fileEvaluatesToDir("some" + path.sep + "path")).toEqual(true);
        });
        it("should not flag an element that does not contain a path seperator", () => {
            expect(IO.fileEvaluatesToDir("somepath")).toEqual(false);
        });
        skipOnWin("should not flag an element containing a Windows path seperator", () => {
            expect(IO.fileEvaluatesToDir("some" + path.win32.sep + "path")).toEqual(false);
        });
    });
    describe("isRootDir", () => {
        skipOnWin("should return true (posix)", () => {
            expect(IO.isRootDir("/")).toEqual(true);
        });
        skipOnWin("should return false for windows on posix", () => {
            const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
            for (const letter of alphabet) {
                expect(IO.isRootDir(`${letter}:\\`)).toEqual(false);
            }
        });
        skipOnPosix("should return true (windows)", () => {
            const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
            for (const letter of alphabet) {
                expect(IO.isRootDir(`${letter}:\\`)).toEqual(true);
            }
        });
        skipOnPosix("should return true for posix on windows", () => {
            expect(IO.isRootDir("/")).toEqual(true);
        });
    });
});