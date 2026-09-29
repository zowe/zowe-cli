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

import { ICommandArguments } from "@zowe/imperative";
import { SshSession } from "../../src/SshSession";

describe("SshSession", () => {
    describe("host key verification options", () => {
        it("should expose a host-key option in the SSH connection options", () => {
            const names = SshSession.SSH_CONNECTION_OPTIONS.map((opt) => opt.name);
            expect(names).toContain("host-key");
            expect(SshSession.SSH_OPTION_HOSTKEY.type).toBe("string");
            expect(SshSession.SSH_OPTION_HOSTKEY.group).toBe(SshSession.SSH_CONNECTION_OPTION_GROUP);
        });

        it("should expose an insecure option that defaults to false (verification on by default)", () => {
            const names = SshSession.SSH_CONNECTION_OPTIONS.map((opt) => opt.name);
            expect(names).toContain("insecure");
            expect(SshSession.SSH_OPTION_INSECURE.type).toBe("boolean");
            expect(SshSession.SSH_OPTION_INSECURE.defaultValue).toBe(false);
            expect(SshSession.SSH_OPTION_INSECURE.group).toBe(SshSession.SSH_CONNECTION_OPTION_GROUP);
        });
    });

    describe("createSshSessCfgFromArgs", () => {
        it("should map hostKey and insecure from args", () => {
            const args: ICommandArguments = {
                $0: "zowe",
                _: [],
                privateKey: "/path/to/key",
                keyPassphrase: "phrase",
                handshakeTimeout: 5000,
                hostKey: "AAAAB3NzaC1base64key",
                insecure: true
            };
            const cfg = SshSession.createSshSessCfgFromArgs(args);
            expect(cfg.hostKey).toBe("AAAAB3NzaC1base64key");
            expect(cfg.insecure).toBe(true);
        });

        it("should leave host key fields undefined when not provided", () => {
            const args: ICommandArguments = { $0: "zowe", _: [] };
            const cfg = SshSession.createSshSessCfgFromArgs(args);
            expect(cfg.hostKey).toBeUndefined();
            expect(cfg.insecure).toBeUndefined();
        });
    });
});
