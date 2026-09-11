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

import { Mount, IMountFsMode, IMountFsOptions } from "../../../../src";
import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { ZosFilesMessages } from "../../../../src/constants/ZosFiles.messages";


describe("Mount FS", () => {
    const dummySession: any = {};
    const fileSystemName = "TEST.ZFS";
    const mountPoint="/u/ibmuser/mount";

    it("should succeed with correct parameters", async () => {
        (ZosmfRestClient as any).putExpectString = jest.fn(() => {
            // Do nothing
        });
        const mode: IMountFsMode = "rdonly";
        const options: IMountFsOptions = {
            "fs-type":"ZFS",
            "mode":mode
        };
        await Mount.fs(dummySession, fileSystemName, mountPoint, options);
        expect(ZosmfRestClient.putExpectString).toHaveBeenCalledTimes(1);
    });

    it("should succeed with responseTimeout", async () => {
        (ZosmfRestClient as any).putExpectString = jest.fn(() => {
            // Do nothing
        });
        const mode: IMountFsMode = "rdonly";
        const options: IMountFsOptions = {
            "fs-type":"ZFS",
            "mode":mode,
            "responseTimeout":5
        };
        await Mount.fs(dummySession, fileSystemName, mountPoint, options);
        expect(ZosmfRestClient.putExpectString).toHaveBeenCalledTimes(1);
    });

    it("should succeed with tsoAccount and tsoProcedure", async () => {
        const putExpectStringSpy = jest.fn((..._args: any[]) => {
            // Do nothing
        });
        (ZosmfRestClient as any).putExpectString = putExpectStringSpy;
        const mode: IMountFsMode = "rdonly";
        const options: IMountFsOptions = {
            "fs-type": "ZFS",
            "mode": mode,
            "tsoAccount": "TSO1234",
            "tsoProcedure": "MYPROC"
        };
        await Mount.fs(dummySession, fileSystemName, mountPoint, options);

        expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
        const [session, , headers, jsonContent] = putExpectStringSpy.mock.calls[0];
        expect(session).toBe(dummySession);
        expect(headers).toEqual([
            { "Content-Length": jsonContent.length },
            ZosmfHeaders.ACCEPT_ENCODING,
            { "X-IBM-Request-Acctnum": "TSO1234" },
            { "X-IBM-Request-Proc": "MYPROC" }
        ]);
        expect(JSON.parse(jsonContent)).toEqual({
            "fs-type": "ZFS",
            "mode": mode,
            "tsoAccount": "TSO1234",
            "tsoProcedure": "MYPROC",
            "action": "mount",
            "mount-point": mountPoint
        });
    });

    it("should fail with a bad option", async () => {
        let caughtError;
        (ZosmfRestClient as any).putExpectString = jest.fn(() => {
            // Do nothing
        });
        const mode: IMountFsMode = "rdonly";
        const options = {
            "fs-type":"ZFS",
            "mode":mode,
            "moed":"rw"
        };
        try {
            await Mount.fs(dummySession, fileSystemName, mountPoint, options);
        } catch (e) {
            caughtError = e;
        }
        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain(ZosFilesMessages.invalidFilesMountOption.message);
    });

    it("should fail if REST client throws error", async () => {
        const error = new Error("This is a test");

        let caughtError;
        (ZosmfRestClient as any).putExpectString = jest.fn(() => {
            throw error;
        });
        const mode: IMountFsMode = "rdonly";
        const options = {
            "fs-type":"ZFS",
            "mode":mode
        };

        try {
            await Mount.fs(dummySession, fileSystemName, mountPoint, options);
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError).toBe(error);
    });
});
