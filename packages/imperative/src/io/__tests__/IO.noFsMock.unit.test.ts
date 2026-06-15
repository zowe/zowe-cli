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
            expect(IO.isRootDir("/")).toEqual(false);
        });
    });
});