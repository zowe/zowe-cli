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

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { SshSession } from "./SshSession";

/** Result of checking a server key against an OpenSSH known_hosts file. */
export interface IKnownHostsVerification {
    status: "trusted" | "unknown" | "changed" | "revoked";
    /** Fingerprint of a conflicting key of the same algorithm, when available. */
    knownFingerprint?: string;
}

/** Read-only verification against OpenSSH known_hosts files. */
export class SshKnownHosts {
    /**
     * Check the raw public key presented during the SSH handshake. Supports literal hosts, hashed
     * hosts, comma-separated patterns, negation, and [host]:port entries. A matching @revoked key
     * overrides trust; @cert-authority entries are ignored (certificate validation is not supported).
     * Missing files return unknown; other read errors are thrown. This method never writes a file.
     * @param hostname Hostname or IP address used to connect (no DNS lookup is performed)
     * @param key Raw SSH public key blob, not a fingerprint or public-key text line
     * @param port SSH port
     * @param filePath File to read, defaulting to ~/.ssh/known_hosts
     * @returns Trust status and, for a changed key, the previous key's fingerprint
     */
    public static verify(hostname: string, key: Buffer, port = SshSession.DEFAULT_SSH_PORT,
        filePath = join(homedir(), ".ssh", "known_hosts")): IKnownHostsVerification {
        let contents: string;
        try {
            contents = readFileSync(filePath, "utf8");
        } catch (err) {
            if (err.code === "ENOENT" || err.code === "ENOTDIR") {
                return { status: "unknown" };
            }
            throw new Error(`Could not read SSH known hosts file '${filePath}': ${err.message}`);
        }

        const host = hostname.toLowerCase();
        const target = port === SshSession.DEFAULT_SSH_PORT ? host : `[${host}]:${port}`;
        const algorithm = this.getKeyAlgorithm(key);
        let result: IKnownHostsVerification = { status: "unknown" };
        for (const line of contents.split(/\r?\n/)) {
            const fields = line.trim().split(/\s+/);
            if (fields[0] === "" || fields[0].startsWith("#")) {
                continue;
            }
            const marker = fields[0].startsWith("@") ? fields.shift() : undefined;
            const [hosts, keyType, encodedKey] = fields;
            if (encodedKey == null || marker != null && marker !== "@revoked" ||
                !this.matchesHost(hosts, target)) {
                continue;
            }
            const storedKey = this.decodeBase64(encodedKey);
            if (storedKey == null || this.getKeyAlgorithm(storedKey) !== keyType) {
                continue;
            }
            if (storedKey.equals(key)) {
                if (marker === "@revoked") {
                    return { status: "revoked" };
                }
                result = { status: "trusted" };
            } else if (marker == null && keyType === algorithm && result.status !== "trusted") {
                const digest = createHash("sha256").update(storedKey).digest("base64").replace(/=+$/, "");
                result = { status: "changed", knownFingerprint: `SHA256:${digest}` };
            }
        }
        return result;
    }

    private static matchesHost(patterns: string, target: string): boolean {
        if (patterns.startsWith("|")) {
            const [prefix, version, saltText, hashText, extra] = patterns.split("|");
            // OpenSSH's version 1 hashes use HMAC-SHA1 with a 20-byte salt and digest.
            const sha1Length = 20;
            if (prefix !== "" || version !== "1" || hashText == null || extra != null) {
                return false;
            }
            const salt = this.decodeBase64(saltText);
            const expected = this.decodeBase64(hashText);
            if (salt?.length !== sha1Length || expected?.length !== sha1Length) {
                return false;
            }
            return timingSafeEqual(createHmac("sha1", salt).update(target).digest(), expected);
        }

        let matched = false;
        for (const item of patterns.split(",")) {
            const negated = item.startsWith("!");
            const pattern = negated ? item.slice(1) : item;
            const expression = pattern.toLowerCase().split("").map((character) => {
                if (character === "*") { return ".*"; }
                if (character === "?") { return "."; }
                return character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            }).join("");
            if (new RegExp(`^${expression}$`).test(target)) {
                if (negated) { return false; }
                matched = true;
            }
        }
        return matched;
    }

    private static decodeBase64(value: string): Buffer | undefined {
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
            return undefined;
        }
        const decoded = Buffer.from(value, "base64");
        return decoded.toString("base64").replace(/=+$/, "") === value.replace(/=+$/, "") ? decoded : undefined;
    }

    private static getKeyAlgorithm(key: Buffer): string | undefined {
        const lengthBytes = 4;
        if (key.length < lengthBytes) { return undefined; }
        const length = key.readUInt32BE(0);
        if (length === 0 || length >= key.length - lengthBytes) { return undefined; }
        return key.subarray(lengthBytes, lengthBytes + length).toString("ascii");
    }
}
