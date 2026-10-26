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

import { IHostKeyVerificationInfo, SshHostKeyVerifier, SshSession } from "../../src";

describe("SshHostKeyVerifier", () => {
    const keyInfo: IHostKeyVerificationInfo = { fingerprint: "SHA256:presented", key: "presented-key", changed: false };

    it.each([false, true])("rejects changed keys without confirming or saving (knownHosts=%s)", async (knownHosts) => {
        const session = new SshSession({ hostKey: "old-key" });
        const options = { confirm: jest.fn(), save: jest.fn(), onChanged: jest.fn() };
        SshHostKeyVerifier.attach(session, options);
        const info = { ...keyInfo, changed: true, knownHosts, pinnedFingerprint: "SHA256:previous" };
        expect(await session.hostKeyVerifier(info)).toBe(false);
        expect(options.onChanged).toHaveBeenCalledWith(info);
        expect(options.confirm).not.toHaveBeenCalled();
        expect(options.save).not.toHaveBeenCalled();
        expect(session.ISshSession.hostKey).toBe("old-key");
    });

    it("rejects changed keys when no reporting callback is supplied", async () => {
        const session = new SshSession({});
        const confirm = jest.fn();
        SshHostKeyVerifier.attach(session, { confirm });
        expect(await session.hostKeyVerifier({ ...keyInfo, changed: true })).toBe(false);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("pins an accepted key before saving it", async () => {
        const session = new SshSession({});
        const confirm = jest.fn().mockResolvedValue(true);
        const save = jest.fn(async (key) => {
            expect(key).toBe(keyInfo.key);
            expect(session.ISshSession.hostKey).toBe(keyInfo.key);
        });
        SshHostKeyVerifier.attach(session, { confirm, save });
        expect(await session.hostKeyVerifier(keyInfo)).toBe(true);
        expect(confirm).toHaveBeenCalledWith(keyInfo);
        expect(save).toHaveBeenCalledTimes(1);
    });

    it("does not pin or save a declined key", async () => {
        const session = new SshSession({});
        const save = jest.fn();
        SshHostKeyVerifier.attach(session, { confirm: jest.fn().mockResolvedValue(false), save });
        expect(await session.hostKeyVerifier(keyInfo)).toBe(false);
        expect(session.ISshSession.hostKey).toBeUndefined();
        expect(save).not.toHaveBeenCalled();
    });

    it("allows session-only acceptance without a persistence callback", async () => {
        const session = new SshSession({});
        SshHostKeyVerifier.attach(session, { confirm: jest.fn().mockResolvedValue(true) });
        expect(await session.hostKeyVerifier(keyInfo)).toBe(true);
        expect(session.ISshSession.hostKey).toBe(keyInfo.key);
    });

    it.each([false, true])("keeps acceptance when saving fails (reporting=%s)", async (reporting) => {
        const session = new SshSession({});
        const error = new Error("Save failed");
        const report = jest.fn();
        SshHostKeyVerifier.attach(session, {
            confirm: jest.fn().mockResolvedValue(true),
            save: jest.fn().mockRejectedValue(error),
            onSaveError: reporting ? report : undefined
        });
        expect(await session.hostKeyVerifier(keyInfo)).toBe(true);
        expect(session.ISshSession.hostKey).toBe(keyInfo.key);
        expect(report).toHaveBeenCalledTimes(reporting ? 1 : 0);
        if (reporting) { expect(report).toHaveBeenCalledWith(error); }
    });

    it("removes an existing hook and warns when verification is disabled", () => {
        const session = new SshSession({ insecure: true });
        session.hostKeyVerifier = jest.fn();
        const options = { confirm: jest.fn(), save: jest.fn(), onInsecure: jest.fn() };
        SshHostKeyVerifier.attach(session, options);
        expect(session.hostKeyVerifier).toBeUndefined();
        expect(options.onInsecure).toHaveBeenCalledTimes(1);
        expect(options.confirm).not.toHaveBeenCalled();
        expect(options.save).not.toHaveBeenCalled();
    });
});
