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

/*
* Test that ConnectionPropsForSessCfg.resolveSessCfgProps resolves thenable certAccount
* values and uses the credential manager to populate cert files, avoiding prompting for certFile.
*/

import * as fs from "fs";
import { CredentialManagerFactory } from "../../../security";
import { ConnectionPropsForSessCfg } from "../../src/session/ConnectionPropsForSessCfg";
import { ISession } from "../../src/session/doc/ISession";

describe("ConnectionPropsForSessCfg certAccount integration", () => {
    let managerSpy: jest.SpyInstance | undefined;
    let initSpy: jest.SpyInstance | undefined;

    afterEach(() => {
        if (managerSpy) managerSpy.mockRestore();
        if (initSpy) initSpy.mockRestore();
    });

    it("should not prompt for certFile when certAccount certs are available (thenable)", async () => {
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
            // thenable values as might be returned from secure loaders
            certAccount: Promise.resolve("my-cert-account"),
            certKeyAccount: Promise.resolve("my-key-account"),
            authTypeOrder: [],
            _authCache: undefined
        };

        // Provide connOpts.parms that has a prompt implementation which would fail test if called
        const connOpts: any = {
            // disable actual prompting during the unit test to avoid interactive hangs
            doPrompting: false,
            parms: {
                response: {
                    console: {
                        prompt: jest.fn(async () => { throw new Error("prompt was called unexpectedly"); }),
                        log: jest.fn()
                    }
                }
            }
        };

    // Call resolver which should populate _authCache.availableCreds via async cred lookup
    await ConnectionPropsForSessCfg.resolveSessCfgProps(sess as ISession, { $0: "NameNotUsed", _: [] }, connOpts);

        expect(sess._authCache).toBeDefined();
        expect(sess._authCache.availableCreds).toBeDefined();
        expect(typeof sess._authCache.availableCreds.cert).toBe("string");
        expect(typeof sess._authCache.availableCreds.certKey).toBe("string");
        expect(fs.existsSync(sess._authCache.availableCreds.cert)).toBeTruthy();
        expect(fs.existsSync(sess._authCache.availableCreds.certKey)).toBeTruthy();

        // Ensure prompt was not invoked
        expect(connOpts.parms.response.console.prompt).not.toHaveBeenCalled();

        // cleanup temp files
        const authCacheAny: any = sess._authCache;
        if (Array.isArray(authCacheAny._tempFiles)) {
            for (const tmp of authCacheAny._tempFiles) {
                try { fs.unlinkSync(tmp); } catch (_e) { /**/ }
            }
        }
    });
});
