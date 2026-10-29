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

interface IKnownHostEntry {
    key: Buffer;
    keyType: string;
    revoked: boolean;
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
        const algorithm = this.getKeyAlgorithm(key);
        let result: IKnownHostsVerification = { status: "unknown" };
        for (const entry of this.readEntries(hostname, port, filePath)) {
            if (entry.key.equals(key)) {
                if (entry.revoked) {
                    return { status: "revoked" };
                }
                result = { status: "trusted" };
            } else if (!entry.revoked && entry.keyType === algorithm && result.status !== "trusted") {
                const digest = createHash("sha256").update(entry.key).digest("base64").replace(/=+$/, "");
                result = { status: "changed", knownFingerprint: `SHA256:${digest}` };
            }
        }
        return result;
    }

    /**
     * Get key algorithms already trusted for an endpoint, excluding revoked keys. Uses the same host
     * matching and entry validation as verify. Missing files return an empty list; other read errors
     * are thrown. These preferences do not replace verification of the key presented by the server.
     * @param hostname Hostname or IP address used to connect
     * @param port SSH port
     * @param filePath File to read, defaulting to ~/.ssh/known_hosts
     * @returns Unique trusted key algorithms, in file order
     */
    public static getHostKeyAlgorithms(hostname: string, port = SshSession.DEFAULT_SSH_PORT,
        filePath = join(homedir(), ".ssh", "known_hosts")): string[] {
        const entries = this.readEntries(hostname, port, filePath);
        const revoked = new Set(entries.filter((entry) => entry.revoked).map((entry) => entry.key.toString("base64")));
        return [...new Set(entries.filter((entry) => !entry.revoked && !revoked.has(entry.key.toString("base64")))
            .map((entry) => entry.keyType))];
    }

    private static readEntries(hostname: string, port: number, filePath: string): IKnownHostEntry[] {
        if (typeof hostname !== "string" || hostname.trim() === "") {
            throw new Error("The SSH hostname must be a non-empty string.");
        }
        let contents: string;
        try {
            contents = readFileSync(filePath, "utf8");
        } catch (err) {
            if (err.code === "ENOENT" || err.code === "ENOTDIR") {
                return [];
            }
            throw new Error(`Could not read SSH known hosts file '${filePath}': ${err.message}`);
        }

        const host = hostname.toLowerCase();
        const target = port === SshSession.DEFAULT_SSH_PORT ? host : `[${host}]:${port}`;
        const entries: IKnownHostEntry[] = [];
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
            entries.push({ key: storedKey, keyType, revoked: marker === "@revoked" });
        }
        return entries;
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
