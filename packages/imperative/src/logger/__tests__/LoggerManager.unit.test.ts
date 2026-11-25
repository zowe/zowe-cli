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
import { LoggerManager } from "../src/LoggerManager";

describe("LoggerManager console fallback", () => {
    let manager: LoggerManager;
    let stderr: jest.SpyInstance;
    let stdout: jest.SpyInstance;

    beforeEach(() => {
        manager = new LoggerManager();
        stderr = jest.spyOn(process.stderr, "write").mockReturnValue(true);
        stdout = jest.spyOn(process.stdout, "write").mockReturnValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should emit warnings to stderr before logger initialization", () => {
        manager.queueMessage("imperative", "warn", "Skipped untrusted config");
        expect(stderr).toHaveBeenCalledWith(expect.stringContaining("[WARN]"));
        expect(stderr).toHaveBeenCalledWith(expect.stringContaining("Skipped untrusted config"));
        expect(stdout).not.toHaveBeenCalled();
    });

    it("should emit errors to stderr before logger initialization", () => {
        manager.queueMessage("imperative", "error", "Failed to load config");
        expect(stderr).toHaveBeenCalledWith(expect.stringContaining("[ERROR]"));
        expect(stderr).toHaveBeenCalledWith(expect.stringContaining("Failed to load config"));
        expect(stdout).not.toHaveBeenCalled();
    });

    it("should continue filtering messages below the default warning threshold", () => {
        manager.queueMessage("imperative", "info", "Informational message");
        manager.queueMessage("imperative", "debug", "Debug message");
        expect(stdout).not.toHaveBeenCalled();
        expect(stderr).not.toHaveBeenCalled();
    });

    it("should ignore messages with level off in the console fallback", () => {
        manager.queueMessage("imperative", "off", "Disabled message");
        expect(stdout).not.toHaveBeenCalled();
        expect(stderr).not.toHaveBeenCalled();
    });

    it("should not queue messages with level off", () => {
        const append = jest.spyOn(fs, "appendFileSync").mockImplementation(() => undefined);
        manager.logInMemory = true;
        manager.queueMessage("imperative", "off", "Disabled message");
        expect(manager.QueuedMessages).toEqual([]);
        manager.dumpQueuedMessages("queued.log");
        expect(append).not.toHaveBeenCalled();
        expect(stdout).not.toHaveBeenCalled();
        expect(stderr).not.toHaveBeenCalled();
    });

    it("should preserve severity and order when dumping queued messages", () => {
        const append = jest.spyOn(fs, "appendFileSync").mockImplementation(() => undefined);
        manager.logInMemory = true;
        manager.queueMessage("imperative", "warn", "First warning");
        manager.queueMessage("imperative", "error", "Second error");
        manager.dumpQueuedMessages("queued.log");

        expect(stderr).toHaveBeenNthCalledWith(1, expect.stringContaining("[WARN]"));
        expect(stderr).toHaveBeenNthCalledWith(2, expect.stringContaining("[ERROR]"));
        expect(append).toHaveBeenNthCalledWith(1, "queued.log", "First warning\n");
        expect(append).toHaveBeenNthCalledWith(2, "queued.log", "Second error\n");
        expect(stdout).not.toHaveBeenCalled();
    });

    it("should report a queued-message file-write failure as an error", () => {
        jest.spyOn(fs, "appendFileSync").mockImplementation(() => {
            throw new Error("Permission denied");
        });
        manager.logInMemory = true;
        manager.queueMessage("imperative", "info", "Queued informational message");
        manager.dumpQueuedMessages("queued.log");

        expect(stderr).toHaveBeenCalledWith(expect.stringContaining("[ERROR]"));
        expect(stderr).toHaveBeenCalledWith(expect.stringContaining("Permission denied"));
        expect(stdout).not.toHaveBeenCalled();
    });
});
