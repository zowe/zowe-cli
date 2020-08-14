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

import { Unmount, ZosFilesMessages } from "../../../..";

import { ZosmfRestClient } from "../../../../../rest";

describe("Unmount", () => {
    const dummySession: any = {};

    describe("fs", () => {
        const fileSystemName = "TEST.ZFS";

        it("should succeed with correct parameters", async () => {
            (ZosmfRestClient as any).putExpectString = jest.fn(() => {
                // Do nothing
            });
            await Unmount.fs(dummySession, fileSystemName);
            expect(ZosmfRestClient.putExpectString).toHaveBeenCalledTimes(1);
        });

        it("should fail if fileSystemName is missing or blank", async () => {
            let caughtError;
            (ZosmfRestClient as any).putExpectString = jest.fn(() => {
                // Do nothing
            });

            // TEST AGAINST EMPTY STRING
            try {
                await Unmount.fs(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingFileSystemName.message);

            caughtError = undefined;

            // TEST AGAINST NULL
            try {
                await Unmount.fs(dummySession, null as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingFileSystemName.message);

            caughtError = undefined;

            // TEST AGAINST UNDEFINED
            try {
                await Unmount.fs(dummySession, undefined as any);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingFileSystemName.message);
        });

        it("should handle an error from the ZosmfRestClient", async () => {
            const error = new Error("This is a test");

            let caughtError;
            (ZosmfRestClient as any).putExpectString = jest.fn(() => {
                throw error;
            });

            try {
                await Unmount.fs(dummySession, fileSystemName);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError).toBe(error);
        });
    });
});
