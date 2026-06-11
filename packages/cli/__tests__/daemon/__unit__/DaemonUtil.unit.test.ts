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

import * as os from "os";
import * as path from "path";
import { IO } from "@zowe/imperative";
import { DaemonUtil } from "../../../src/daemon/DaemonUtil";

describe("DaemonUtil tests", () => {
    let existsSyncSpy: jest.SpyInstance;
    let createDirSyncSpy: jest.SpyInstance;
    let giveAccessOnlyToOwnerSpy: jest.SpyInstance;

    beforeEach(() => {
        existsSyncSpy = jest.spyOn(IO, "existsSync");
        createDirSyncSpy = jest.spyOn(IO, "createDirSync").mockImplementation(() => {
            return;
        });
        giveAccessOnlyToOwnerSpy = jest.spyOn(IO, "giveAccessOnlyToOwner").mockImplementation(() => {
            return;
        });
    });

    afterEach(() => {
        delete process.env.ZOWE_DAEMON_DIR;
        jest.restoreAllMocks();
    });

    it("should use the ZOWE_DAEMON_DIR environment variable when set", () => {
        const customDir = path.normalize("./testOutput/customDaemonDir");
        process.env.ZOWE_DAEMON_DIR = customDir;
        existsSyncSpy.mockReturnValue(true);

        expect(DaemonUtil.getDaemonDir()).toBe(customDir);
    });

    it("should default to ~/.zowe/daemon when no environment variable is set", () => {
        existsSyncSpy.mockReturnValue(true);

        expect(DaemonUtil.getDaemonDir()).toBe(path.join(os.homedir(), ".zowe", "daemon"));
    });

    it("should create the daemon directory and restrict access to the owner when it does not exist", () => {
        const customDir = path.normalize("./testOutput/newDaemonDir");
        process.env.ZOWE_DAEMON_DIR = customDir;
        existsSyncSpy.mockReturnValue(false);

        const daemonDir = DaemonUtil.getDaemonDir();

        expect(daemonDir).toBe(customDir);
        expect(createDirSyncSpy).toHaveBeenCalledWith(customDir);
        expect(giveAccessOnlyToOwnerSpy).toHaveBeenCalledWith(customDir);
    });

    it("should re-restrict but not re-create the daemon directory when it already exists", () => {
        const customDir = path.normalize("./testOutput/existingDaemonDir");
        process.env.ZOWE_DAEMON_DIR = customDir;
        existsSyncSpy.mockReturnValue(true);

        DaemonUtil.getDaemonDir();

        expect(createDirSyncSpy).not.toHaveBeenCalled();
        expect(giveAccessOnlyToOwnerSpy).toHaveBeenCalledWith(customDir);
    });

    it("should throw an error when the daemon directory cannot be created or secured", () => {
        const customDir = path.normalize("./testOutput/failDaemonDir");
        process.env.ZOWE_DAEMON_DIR = customDir;
        existsSyncSpy.mockReturnValue(false);

        const badStuffMsg = "Some awful permission error";
        giveAccessOnlyToOwnerSpy.mockImplementation(() => {
            throw new Error(badStuffMsg);
        });

        let error: Error;
        try {
            DaemonUtil.getDaemonDir();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("Failed to create directory");
        expect(error.message).toContain(customDir);
        expect(error.message).toContain(badStuffMsg);
    });
});
