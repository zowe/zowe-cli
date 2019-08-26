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

import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { Create } from "../../../../../src/api/methods/create";
import { Mount, IMountFsOptions } from "../../../../../src/api/methods/mount";
import { Unmount } from "../../../../../src/api/methods/unmount";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Delete } from "../../../../../src/api/methods/delete";
import { ZosFilesMessages } from "../../../../..";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { ICreateZfsOptions } from "../../../../../src/api/methods/create/doc/ICreateZfsOptions";
import { SshSession, Shell } from "../../../../../../zosuss/";
import { List } from "../../../../../src/api";


let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let REAL_SESSION: Session;
let volume: string;

const LONGER_TIMEOUT = 10000;

describe("Mount and unmount a file system", () => {
    let fsname: string;
    let mountPoint: string;

    const zfsOptions: ICreateZfsOptions = {} as any;
    const perms = 755;
    const cylsPri = 10;
    const cylsSec = 2;
    const timeout = 20;

    const mountOptions: IMountFsOptions = {} as any;
    const fsType = "ZFS";
    const mode = "rdonly";

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_mount_unmount_fs"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        const thisSshSession = new SshSession({
            hostname:defaultSystem.ssh.host,
            port:defaultSystem.ssh.port,
            user:defaultSystem.ssh.user,
            password:defaultSystem.ssh.password,
        });
        volume = defaultSystem.datasets.vol;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        fsname = getUniqueDatasetName(defaultSystem.zosmf.user);
        const dirname = getUniqueDatasetName(defaultSystem.zosmf.user).split(".")[1];
        mountPoint = "/tmp/" + dirname;

        let error;

        // Execute SSH to add mountpoint to temp directory, in case of delete failure
        try {
            await Shell.executeSsh(thisSshSession, "mkdir " + mountPoint, jest.fn());
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        // Create a ZFS
        zfsOptions.perms = perms;
        zfsOptions.cylsPri = cylsPri;
        zfsOptions.cylsSec = cylsSec;
        zfsOptions.timeout = timeout;
        zfsOptions.volumes = [volume];

        try {
            await Create.zfs(REAL_SESSION, fsname, zfsOptions);
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    afterAll(async () => {
        defaultSystem = testEnvironment.systemTestProperties;
        const thisSshSession = new SshSession({
            hostname:defaultSystem.ssh.host,
            port:defaultSystem.ssh.port,
            user:defaultSystem.ssh.user,
            password:defaultSystem.ssh.password,
        });

        // Delete the ZFS
        try {
            await Delete.zfs(REAL_SESSION, fsname);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
        await TestEnvironment.cleanUp(testEnvironment);

        // Remove the mount point
        try {
            await Shell.executeSsh(thisSshSession, "rmdir " + mountPoint, jest.fn());
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    it("should mount a FS to a mount point and then unmount", async () => {
        let response;
        let error;
        mountOptions["fs-type"] = fsType;
        mountOptions.mode = mode;

        try {
            response = await Mount.fs(REAL_SESSION, fsname, mountPoint, mountOptions);
            Imperative.console.info("Response: " + inspect(response));
        } catch (e) {
            error = e;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeUndefined();
        expect(response).toBeTruthy();
        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.fsMountedSuccessfully.message);

        try{
            response = await List.zfs(REAL_SESSION, {fsname});
            Imperative.console.info("Response: " + inspect(response));
        } catch (e) {
            error = e;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeUndefined();
        expect(response).toBeTruthy();
        expect(response.success).toBe(true);
        expect(response.apiResponse.items.length).toBe(1);
        expect(response.apiResponse.items[0].mountpoint).toContain(mountPoint);

        try {
            response = await Unmount.fs(REAL_SESSION, fsname);
            Imperative.console.info("Response: " + inspect(response));
        } catch (e) {
            error = e;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeUndefined();
        expect(response).toBeTruthy();
        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.fsUnmountedSuccessfully.message);

        try{
            response = await List.zfs(REAL_SESSION, {fsname});
            Imperative.console.info("Response: " + inspect(response));
        } catch (e) {
            error = e;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeDefined();
        expect(response).toBeTruthy();
        expect(response.success).toBe(true);
    }, LONGER_TIMEOUT);
});
