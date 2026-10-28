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

import { createHmac } from "crypto";
import * as fs from "fs";
import { tmpdir } from "os";
import * as os from "os";
import { join } from "path";
import { Client } from "ssh2";
import { Shell, SshKnownHosts, SshSession } from "../../src";

describe("SshKnownHosts", () => {
    let directory: string;
    let file: string;
    const hostname = "mainframe.example.com";
    const makeKey = (algorithm = "ssh-ed25519", material = "key-material"): Buffer => {
        const length = Buffer.alloc(4);
        length.writeUInt32BE(algorithm.length);
        return Buffer.concat([length, Buffer.from(algorithm), Buffer.from(material)]);
    };
    const key = makeKey();
    const otherKey = makeKey("ssh-ed25519", "other-key-material");
    const entry = (hosts = hostname, blob = key) => `${hosts} ${Shell.getHostKeyAlgorithm(blob)} ${blob.toString("base64")}`;
    const hashed = (host: string) => {
        const salt = Buffer.alloc(20, 1);
        const hash = createHmac("sha1", salt).update(host).digest("base64");
        return `|1|${salt.toString("base64")}|${hash}`;
    };

    beforeEach(() => {
        directory = fs.mkdtempSync(join(tmpdir(), "zowe-known-hosts-"));
        file = join(directory, "known_hosts");
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(directory, { recursive: true, force: true });
    });

    it("reads ~/.ssh/known_hosts by default and leaves it unchanged", () => {
        jest.spyOn(os, "homedir").mockReturnValue(directory);
        fs.mkdirSync(join(directory, ".ssh"));
        const defaultFile = join(directory, ".ssh", "known_hosts");
        const contents = `# comment\r\n\r\n${entry()} comment\r\n`;
        fs.writeFileSync(defaultFile, contents);
        const write = jest.spyOn(fs, "writeFileSync");
        expect(SshKnownHosts.verify(hostname, key)).toEqual({ status: "trusted" });
        const session = new SshSession({ hostname });
        session.hostKeyVerifier = jest.fn();
        const callback = jest.fn();
        Shell.hostVerifier(session)(key, callback);
        expect(callback).toHaveBeenCalledWith(true);
        expect(session.hostKeyVerifier).not.toHaveBeenCalled();
        expect(session.ISshSession.hostKey).toBeUndefined();
        expect(fs.readFileSync(defaultFile, "utf8")).toBe(contents);
        expect(write).not.toHaveBeenCalled();
    });

    it.each([
        [hostname, hostname, 22, "trusted"],
        [hostname.toUpperCase(), hostname, 22, "trusted"],
        [hostname, hostname.toUpperCase(), 22, "trusted"],
        [`alias,${hostname},192.0.2.1`, hostname, 22, "trusted"],
        [hostname, "other.example.com", 22, "unknown"],
        [hostname, hostname, 2222, "unknown"],
        [`[${hostname}]:2222`, hostname, 2222, "trusted"],
        [`[${hostname}]:2222`, hostname, 22, "unknown"],
        ["[2001:db8::1]:2222", "2001:db8::1", 2222, "trusted"],
        ["2001:db8::1", "2001:db8::1", 22, "trusted"],
        ["*.example.com", hostname, 22, "trusted"],
        ["mainfram?.example.com", hostname, 22, "trusted"],
        [`*.example.com,!${hostname}`, hostname, 22, "unknown"],
        [`!${hostname},*.example.com`, hostname, 22, "unknown"],
        [`!${hostname}`, "other.example.com", 22, "unknown"],
        ["mainframe.example.com", "mainframeXexample.com", 22, "unknown"],
        [hashed(hostname), hostname, 22, "trusted"],
        [hashed(hostname), "other.example.com", 22, "unknown"],
        [hashed(`[${hostname}]:2222`), hostname, 2222, "trusted"],
        [hashed(`[${hostname}]:2222`), hostname, 22, "unknown"],
        ["|1|invalid|hash", hostname, 22, "unknown"],
        [hashed(hostname).replace("|1|", "|2|"), hostname, 22, "unknown"]
    ])("matches %s for %s:%s as %s", (hosts, host, port, status) => {
        fs.writeFileSync(file, entry(hosts));
        expect(SshKnownHosts.verify(host, key, port, file).status).toBe(status);
        expect(SshKnownHosts.getHostKeyAlgorithms(host, port, file)).toEqual(status === "trusted" ? ["ssh-ed25519"] : []);
    });

    it("reports a changed key and its previous fingerprint", () => {
        fs.writeFileSync(file, entry(hostname, otherKey));
        expect(SshKnownHosts.verify(hostname, key, 22, file)).toEqual({
            status: "changed", knownFingerprint: Shell.getHostKeyFingerprint(otherKey)
        });
    });

    it("does not treat another key algorithm as a changed key", () => {
        fs.writeFileSync(file, entry(hostname, makeKey("ssh-rsa")));
        expect(SshKnownHosts.verify(hostname, key, 22, file).status).toBe("unknown");
    });

    it("prefers a trusted RSA key over another offered algorithm without prompting", async () => {
        jest.spyOn(os, "homedir").mockReturnValue(directory);
        fs.mkdirSync(join(directory, ".ssh"));
        const defaultFile = join(directory, ".ssh", "known_hosts");
        const rsaKey = makeKey("ssh-rsa");
        fs.writeFileSync(defaultFile, entry(`[${hostname}]:2222`, rsaKey));
        // A different algorithm is still unknown; it must not become implicitly trusted.
        expect(SshKnownHosts.verify(hostname, key, 2222).status).toBe("unknown");

        const { generateAlgorithmList } = require("ssh2/lib/utils");
        const { DEFAULT_SERVER_HOST_KEY, SUPPORTED_SERVER_HOST_KEY } = require("ssh2/lib/protocol/constants");
        const session = new SshSession({ hostname, port: 2222 });
        const connect = jest.spyOn(Client.prototype, "connect").mockImplementation(function(config) {
            // Use ssh2's actual algorithm ordering logic with a server offering both key types.
            const algorithms: string[] = generateAlgorithmList(config.algorithms.serverHostKey,
                DEFAULT_SERVER_HOST_KEY, SUPPORTED_SERVER_HOST_KEY);
            expect(algorithms.slice(0, 3)).toEqual(["rsa-sha2-512", "rsa-sha2-256", "ssh-rsa"]);
            expect(algorithms).toContain("ecdsa-sha2-nistp256");
            const offered = new Map([["ssh-ed25519", key], ["rsa-sha2-512", rsaKey]]);
            const selected = algorithms.find((algorithm) => offered.has(algorithm));
            expect(selected).toBe("rsa-sha2-512");
            (config.hostVerifier as (key: Buffer, callback: (valid: boolean) => void) => void)(offered.get(selected), (valid) => {
                expect(valid).toBe(true);
                this.emit(valid ? "ready" : "error", new Error("Host key verification failed"));
            });
            return this;
        });
        jest.spyOn(Client.prototype, "end").mockReturnThis();
        await expect(Shell.isConnectionValid(session)).resolves.toBe(true);
        expect(connect).toHaveBeenCalledTimes(1);
        expect(session.ISshSession.hostKey).toBeUndefined();
    });

    it("lists unique trusted algorithms and excludes revoked keys regardless of order", () => {
        const rsaKey = makeKey("ssh-rsa");
        const lines = [entry(), entry(hostname, rsaKey), entry(), `@revoked ${entry()}`];
        for (const contents of [lines, [...lines].reverse()]) {
            fs.writeFileSync(file, contents.join("\n"));
            expect(SshKnownHosts.getHostKeyAlgorithms(hostname, 22, file)).toEqual(["ssh-rsa"]);
        }
    });

    it("retains an algorithm when only a different key of the same type is revoked", () => {
        fs.writeFileSync(file, `${entry()}\n@revoked ${entry(hostname, otherKey)}`);
        expect(SshKnownHosts.getHostKeyAlgorithms(hostname, 22, file)).toEqual(["ssh-ed25519"]);
    });

    it.each([false, true])("accepts any matching key among conflicting entries (reverse=%s)", (reverse) => {
        const lines = [entry(), entry(hostname, otherKey)];
        fs.writeFileSync(file, (reverse ? lines.reverse() : lines).join("\n"));
        expect(SshKnownHosts.verify(hostname, key, 22, file).status).toBe("trusted");
    });

    it.each([false, true])("revocation overrides trust regardless of order (reverse=%s)", (reverse) => {
        const lines = [entry(), `@revoked ${entry()}`];
        fs.writeFileSync(file, (reverse ? lines.reverse() : lines).join("\n"));
        expect(SshKnownHosts.verify(hostname, key, 22, file).status).toBe("revoked");
    });

    it("does not reject an unrelated revoked key", () => {
        fs.writeFileSync(file, `${entry()}\n@revoked ${entry(hostname, otherKey)}`);
        expect(SshKnownHosts.verify(hostname, key, 22, file).status).toBe("trusted");
    });

    it.each([
        "", "# comment", hostname, `${hostname} ssh-ed25519`,
        `${hostname} ssh-ed25519 !!!`, `${hostname} ssh-ed25519 AAAA`,
        `${hostname} ssh-rsa ${key.toString("base64")}`,
        `@cert-authority ${entry()}`, `@unsupported ${entry()}`
    ])("does not trust malformed or unsupported entries: %s", (contents) => {
        fs.writeFileSync(file, contents);
        expect(SshKnownHosts.verify(hostname, key, 22, file).status).toBe("unknown");
        expect(SshKnownHosts.getHostKeyAlgorithms(hostname, 22, file)).toEqual([]);
    });

    it("returns unknown for missing files without creating them", () => {
        expect(SshKnownHosts.verify(hostname, key, 22, file).status).toBe("unknown");
        expect(SshKnownHosts.getHostKeyAlgorithms(hostname, 22, file)).toEqual([]);
        expect(fs.existsSync(file)).toBe(false);
    });

    it.each([undefined, null, "", " \t ", 22])("rejects a missing or invalid hostname: %p", (host) => {
        fs.writeFileSync(file, entry("*"));
        expect(() => SshKnownHosts.verify(host as string, key, 22, file))
            .toThrow("The SSH hostname must be a non-empty string.");
        expect(() => SshKnownHosts.getHostKeyAlgorithms(host as string, 22, file))
            .toThrow("The SSH hostname must be a non-empty string.");
    });

    it("requires a hostname even when the known_hosts file is missing", () => {
        expect(() => SshKnownHosts.verify(undefined, key, 22, file))
            .toThrow("The SSH hostname must be a non-empty string.");
        expect(() => SshKnownHosts.getHostKeyAlgorithms(undefined, 22, file))
            .toThrow("The SSH hostname must be a non-empty string.");
    });

    it("throws on read errors instead of treating the host as new", () => {
        jest.spyOn(fs, "readFileSync").mockImplementation(() => { throw new Error("Permission denied"); });
        expect(() => SshKnownHosts.verify(hostname, key, 22, file)).toThrow("Could not read SSH known hosts file");
        expect(() => SshKnownHosts.getHostKeyAlgorithms(hostname, 22, file)).toThrow("Could not read SSH known hosts file");
    });
});
