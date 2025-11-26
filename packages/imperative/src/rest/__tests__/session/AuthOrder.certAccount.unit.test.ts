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
import { CredentialManagerFactory } from "../../../security";
import { AuthOrder } from "../../src/session/AuthOrder";
import { ISession } from "../../src/session/doc/ISession";

describe("AuthOrder certAccount handling", () => {
    const _origManager: any = undefined;
    const _origInit: any = undefined;

    let managerSpy: jest.SpyInstance | undefined;
    let initSpy: jest.SpyInstance | undefined;

    afterEach(() => {
        if (managerSpy) managerSpy.mockRestore();
        if (initSpy) initSpy.mockRestore();
    });

    it("should prefer certAccount and certKeyAccount when loading certs (async)", async () => {
        // mock manager
        const fakeManager = {
            async loadCertificate(acct: string, optional?: boolean) {
                if (acct === "my-cert-account") return Buffer.from("CERT-BYTES");
                return null;
            },
            async loadCertificateKey(acct: string, optional?: boolean) {
                if (acct === "my-key-account") return Buffer.from("KEY-BYTES");
                return null;
            }
        } as any;
    managerSpy = jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue(fakeManager);
    initSpy = jest.spyOn(CredentialManagerFactory, "initialized", "get").mockReturnValue(true);

        const sess: ISession & any = {
            profile: "p",
            account: "a",
            certAccount: "my-cert-account",
            certKeyAccount: "my-key-account",
            authTypeOrder: [],
            _authCache: undefined
        };

        await AuthOrder.addCredsToSessionAsync(sess as ISession);

        expect(sess._authCache).toBeDefined();
        expect(sess._authCache.availableCreds).toBeDefined();
        expect(typeof sess._authCache.availableCreds.cert).toBe("string");
        expect(typeof sess._authCache.availableCreds.certKey).toBe("string");
        // files should exist
        expect(fs.existsSync(sess._authCache.availableCreds.cert)).toBeTruthy();
        expect(fs.existsSync(sess._authCache.availableCreds.certKey)).toBeTruthy();

        // cleanup temp files
        const authCacheAny: any = sess._authCache;
        if (Array.isArray(authCacheAny._tempFiles)) {
            for (const tmp of authCacheAny._tempFiles) {
                try { fs.unlinkSync(tmp); } catch (_e) { /**/ }
            }
        }
    });

    it("should resolve promise-like certAccount and certKeyAccount values (async)", async () => {
        // mock manager
        const fakeManager = {
            async loadCertificate(acct: string, optional?: boolean) {
                if (acct === "my-cert-account") return Buffer.from("CERT-BYTES");
                return null;
            },
            async loadCertificateKey(acct: string, optional?: boolean) {
                if (acct === "my-key-account") return Buffer.from("KEY-BYTES");
                return null;
            }
        } as any;
        managerSpy = jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue(fakeManager);
        initSpy = jest.spyOn(CredentialManagerFactory, "initialized", "get").mockReturnValue(true);

        const sess: ISession & any = {
            profile: "p",
            account: "a",
            // values returned from secure loaders may be Promises; ensure we handle that
            certAccount: Promise.resolve("my-cert-account"),
            certKeyAccount: Promise.resolve("my-key-account"),
            authTypeOrder: [],
            _authCache: undefined
        };

        await AuthOrder.addCredsToSessionAsync(sess as ISession);

        expect(sess._authCache).toBeDefined();
        expect(sess._authCache.availableCreds).toBeDefined();
        expect(typeof sess._authCache.availableCreds.cert).toBe("string");
        expect(typeof sess._authCache.availableCreds.certKey).toBe("string");
        expect(fs.existsSync(sess._authCache.availableCreds.cert)).toBeTruthy();
        expect(fs.existsSync(sess._authCache.availableCreds.certKey)).toBeTruthy();

        // cleanup temp files
        const authCacheAny: any = sess._authCache;
        if (Array.isArray(authCacheAny._tempFiles)) {
            for (const tmp of authCacheAny._tempFiles) {
                try { fs.unlinkSync(tmp); } catch (_e) { /**/ }
            }
        }
    });

    it("should prefer certAccount and certKeyAccount when loading certs (sync)", () => {
        // mock manager with sync loader
        const fakeManager = {
            loadCertificateSync(acct: string, optional?: boolean) {
                if (acct === "sync-cert-account") return Buffer.from("CERT-BYTES");
                return null;
            },
            loadCertificateKeySync(acct: string, optional?: boolean) {
                if (acct === "sync-key-account") return Buffer.from("KEY-BYTES");
                return null;
            }
        } as any;
    managerSpy = jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue(fakeManager);
    initSpy = jest.spyOn(CredentialManagerFactory, "initialized", "get").mockReturnValue(true);

        const sess: ISession & any = {
            profile: "p",
            account: "a",
            certAccount: "sync-cert-account",
            certKeyAccount: "sync-key-account",
            authTypeOrder: [],
            _authCache: undefined
        };

        AuthOrder.addCredsToSession(sess as ISession);

        expect(sess._authCache).toBeDefined();
        expect(sess._authCache.availableCreds).toBeDefined();
        expect(typeof sess._authCache.availableCreds.cert).toBe("string");
        expect(typeof sess._authCache.availableCreds.certKey).toBe("string");
        expect(fs.existsSync(sess._authCache.availableCreds.cert)).toBeTruthy();
        expect(fs.existsSync(sess._authCache.availableCreds.certKey)).toBeTruthy();

        // cleanup temp files
        const authCacheAny: any = sess._authCache;
        if (Array.isArray(authCacheAny._tempFiles)) {
            for (const tmp of authCacheAny._tempFiles) {
                try { fs.unlinkSync(tmp); } catch (_e) { /**/ }
            }
        }
    });

    it("should fallback to profile/account when explicit certAccount returns null", async () => {
        // explicit certAccount returns null, but profile/account provide certs
        const fakeManager = {
            async loadCertificate(acct: string, optional?: boolean) {
                if (acct === "p") return Buffer.from("PROFILE-CERT");
                return null;
            },
            async loadCertificateKey(acct: string, optional?: boolean) {
                if (acct === "a") return Buffer.from("ACCOUNT-KEY");
                return null;
            }
        } as any;
        managerSpy = jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue(fakeManager);
        initSpy = jest.spyOn(CredentialManagerFactory, "initialized", "get").mockReturnValue(true);

        const sess: ISession & any = {
            profile: "p",
            account: "a",
            certAccount: "explicit-nope",
            certKeyAccount: "explicit-nope-key",
            authTypeOrder: [],
            _authCache: undefined
        };

        await AuthOrder.addCredsToSessionAsync(sess as ISession);

        expect(sess._authCache).toBeDefined();
        expect(sess._authCache.availableCreds).toBeDefined();
        // cert should come from profile, and certKey should come from account (per our candidate order)
        expect(typeof sess._authCache.availableCreds.cert).toBe("string");
        expect(typeof sess._authCache.availableCreds.certKey).toBe("string");
        expect(fs.existsSync(sess._authCache.availableCreds.cert)).toBeTruthy();
        expect(fs.existsSync(sess._authCache.availableCreds.certKey)).toBeTruthy();

        // cleanup
        const authCacheAny: any = sess._authCache;
        if (Array.isArray(authCacheAny._tempFiles)) {
            for (const tmp of authCacheAny._tempFiles) {
                try { fs.unlinkSync(tmp); } catch (_e) { /**/ }
            }
        }
    });

    it("should not create temp cert files when no candidates return certs", async () => {
        const fakeManager = {
            async loadCertificate(_acct: string, _optional?: boolean): Promise<Buffer | null> {
                return null;
            },
            loadCertificateSync(_acct: string, _optional?: boolean): Buffer | null {
                return null;
            }
        } as any;
        managerSpy = jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue(fakeManager);
        initSpy = jest.spyOn(CredentialManagerFactory, "initialized", "get").mockReturnValue(true);

        const sess: ISession & any = {
            profile: "p",
            account: "a",
            authTypeOrder: [],
            _authCache: undefined
        };

        await AuthOrder.addCredsToSessionAsync(sess as ISession);
        expect(sess._authCache).toBeDefined();
        expect(sess._authCache.availableCreds).toBeDefined();
        expect(sess._authCache.availableCreds.cert).toBeUndefined();
        expect(sess._authCache.availableCreds.certKey).toBeUndefined();
    });
});
