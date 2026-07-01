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

import { ImperativeError, Session } from "@zowe/imperative";
import { Invoke, List, ZosFilesMessages } from "../../../../src";

describe("List.resolveAlias", () => {
    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should resolve a NONVSAM alias successfully", async () => {
        const amsSpy = jest.spyOn(Invoke, "ams").mockResolvedValue({
            success: true,
            commandResponse: "AMS command executed successfully.",
            apiResponse: {
                output: [
                    "LISTCAT ENTRIES('MY.ALIAS.NAME') ALL",
                    "ALIAS --------- MY.ALIAS.NAME",
                    "     IN-CAT --- CATALOG.MASTER",
                    "     HISTORY",
                    "       RELEASE----------2    CREATION-------2026.180",
                    "     ENCRYPTION",
                    "     DATA SET ENCRYPTION --- (NO)",
                    "   ASSOCIATIONS",
                    "     NONVSAM--- REAL.DATASET.NAME",
                    "   THE NUMBER OF ENTRIES PROCESSED WAS:",
                    "         NONVSAM ---------------0",
                    "         TOTAL"
                ]
            }
        });

        const response = await List.resolveAlias(dummySession, "MY.ALIAS.NAME");

        expect(response.success).toBe(true);
        expect(response.apiResponse.alias).toBe("MY.ALIAS.NAME");
        expect(response.apiResponse.targetDsn).toBe("REAL.DATASET.NAME");
        expect(response.commandResponse).toContain("MY.ALIAS.NAME");
        expect(response.commandResponse).toContain("REAL.DATASET.NAME");
        expect(amsSpy).toHaveBeenCalledTimes(1);
        expect(amsSpy).toHaveBeenCalledWith(
            dummySession,
            ["LISTCAT ENTRIES('MY.ALIAS.NAME') ALL"],
            undefined
        );
    });

    it("should resolve a VSAM alias successfully", async () => {
        jest.spyOn(Invoke, "ams").mockResolvedValue({
            success: true,
            commandResponse: "AMS command executed successfully.",
            apiResponse: {
                output: [
                    "ALIAS --------- MY.VSAM.ALIAS",
                    "     IN-CAT --- CATALOG.MASTER",
                    "   ASSOCIATIONS",
                    "     VSAM--- REAL.VSAM.CLUSTER",
                    "   THE NUMBER OF ENTRIES PROCESSED WAS:",
                    "         NONVSAM ---------------0"
                ]
            }
        });

        const response = await List.resolveAlias(dummySession, "MY.VSAM.ALIAS");

        expect(response.success).toBe(true);
        expect(response.apiResponse.alias).toBe("MY.VSAM.ALIAS");
        expect(response.apiResponse.targetDsn).toBe("REAL.VSAM.CLUSTER");
    });

    it("should convert alias name to uppercase", async () => {
        const amsSpy = jest.spyOn(Invoke, "ams").mockResolvedValue({
            success: true,
            commandResponse: "AMS command executed successfully.",
            apiResponse: {
                output: [
                    "   ASSOCIATIONS",
                    "     NONVSAM--- TARGET.DS"
                ]
            }
        });

        await List.resolveAlias(dummySession, "my.lowercase.alias");

        expect(amsSpy).toHaveBeenCalledWith(
            dummySession,
            ["LISTCAT ENTRIES('MY.LOWERCASE.ALIAS') ALL"],
            undefined
        );
    });

    it("should pass options to Invoke.ams", async () => {
        const amsSpy = jest.spyOn(Invoke, "ams").mockResolvedValue({
            success: true,
            commandResponse: "AMS command executed successfully.",
            apiResponse: {
                output: [
                    "   ASSOCIATIONS",
                    "     NONVSAM--- TARGET.DS"
                ]
            }
        });

        const options = { responseTimeout: 30 };
        await List.resolveAlias(dummySession, "MY.ALIAS", options);

        expect(amsSpy).toHaveBeenCalledWith(
            dummySession,
            ["LISTCAT ENTRIES('MY.ALIAS') ALL"],
            options
        );
    });

    it("should throw an error when alias name is not provided", async () => {
        let error: ImperativeError | undefined;
        try {
            await List.resolveAlias(dummySession, undefined as any);
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error?.message).toContain(ZosFilesMessages.missingDatasetName.message);
    });

    it("should throw an error when alias name is empty", async () => {
        let error: ImperativeError | undefined;
        try {
            await List.resolveAlias(dummySession, "");
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error?.message).toContain(ZosFilesMessages.missingDatasetName.message);
    });

    it("should throw an error when no target is found in output", async () => {
        jest.spyOn(Invoke, "ams").mockResolvedValue({
            success: true,
            commandResponse: "AMS command executed successfully.",
            apiResponse: {
                output: [
                    "ALIAS --------- MY.ALIAS.NAME",
                    "     IN-CAT --- CATALOG.MASTER",
                    "     HISTORY",
                    "       DATASET-OWNER-----(NULL)"
                ]
            }
        });

        let error: ImperativeError | undefined;
        try {
            await List.resolveAlias(dummySession, "MY.ALIAS.NAME");
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error?.message).toContain(ZosFilesMessages.aliasTargetNotFound.message);
    });

    it("should throw an error when AMS output is empty", async () => {
        jest.spyOn(Invoke, "ams").mockResolvedValue({
            success: true,
            commandResponse: "AMS command executed successfully.",
            apiResponse: {
                output: []
            }
        });

        let error: ImperativeError | undefined;
        try {
            await List.resolveAlias(dummySession, "MY.ALIAS.NAME");
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error?.message).toContain(ZosFilesMessages.aliasTargetNotFound.message);
    });

    it("should throw an error when AMS output is undefined", async () => {
        jest.spyOn(Invoke, "ams").mockResolvedValue({
            success: true,
            commandResponse: "AMS command executed successfully.",
            apiResponse: {}
        });

        let error: ImperativeError | undefined;
        try {
            await List.resolveAlias(dummySession, "MY.ALIAS.NAME");
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error?.message).toContain(ZosFilesMessages.aliasTargetNotFound.message);
    });

    it("should propagate errors from Invoke.ams", async () => {
        const amsError = new Error("Connection refused");
        jest.spyOn(Invoke, "ams").mockRejectedValue(amsError);

        let error: Error | undefined;
        try {
            await List.resolveAlias(dummySession, "MY.ALIAS.NAME");
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error?.message).toBe("Connection refused");
    });
});
