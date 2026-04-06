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

import { KeychainAgent } from "../../../../src/rest/src/client/KeychainAgent";
import * as https from "https";

describe("KeychainAgent", () => {
    const mockCertAccount = "test-cert";
    const mockCliHome = "/test/cli/home";

    describe("constructor", () => {
        it("should create an instance with required parameters", () => {
            const agent = new KeychainAgent(mockCertAccount, mockCliHome);

            expect(agent).toBeInstanceOf(KeychainAgent);
        });

        it("should create an instance with custom options", () => {
            const options: https.AgentOptions = {
                keepAlive: true,
                maxSockets: 10,
                rejectUnauthorized: false
            };

            const agent = new KeychainAgent(mockCertAccount, mockCliHome, options);

            expect(agent).toBeInstanceOf(KeychainAgent);
            expect((agent as any).options.rejectUnauthorized).toBe(false);
        });
    });

    describe("connect", () => {
        let agent: KeychainAgent;
        let mockSocket: any;
        let mockTlsSocket: any;
        let mockKeyring: any;

        beforeEach(() => {
            agent = new KeychainAgent(mockCertAccount, mockCliHome);

            // Mock socket
            mockSocket = {
                connect: jest.fn((port, host, cb) => { if (cb) cb(); }),
                on: jest.fn(),
                once: jest.fn()
            };

            // Mock TLS socket
            mockTlsSocket = {
                once: jest.fn()
            };

            mockKeyring = {
                getPrivateKey: jest.fn().mockResolvedValue(Buffer.from("fake-key")),
                getCertificate: jest.fn().mockResolvedValue(Buffer.from("fake-cert")),
                createTlsPipe: jest.fn().mockResolvedValue("/tmp/test-pipe.sock")
            };

            jest.spyOn(agent as any, "keyring", "get").mockReturnValue(mockKeyring);
            jest.spyOn(require("net"), "Socket").mockImplementation(() => mockSocket);
            jest.spyOn(require("tls"), "connect").mockImplementation(() => mockTlsSocket);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should use buildPipeSocket on Windows", async () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, "platform", { value: "win32" });

            const options = { host: "example.com", port: 443 };
            const result = await agent.connect(null as any, options);

            expect(mockKeyring.createTlsPipe).toHaveBeenCalledWith("example.com", 443, mockCertAccount, true);
            expect(mockSocket.connect).toHaveBeenCalledWith("/tmp/test-pipe.sock", expect.any(Function));
            expect(result).toBe(mockSocket);

            Object.defineProperty(process, "platform", { value: originalPlatform });
        });

        it("should use buildExportableTlsSocket when key is exportable (non-Windows)", async () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, "platform", { value: "darwin" });

            const options = { host: "example.com", port: 443 };
            
            const result = await agent.connect(null as any, options);

            expect(mockKeyring.getPrivateKey).toHaveBeenCalled();
            expect(mockKeyring.getCertificate).toHaveBeenCalled();
            expect(require("tls").connect).toHaveBeenCalled();
            expect(result).toBe(mockTlsSocket);

            Object.defineProperty(process, "platform", { value: originalPlatform });
        });

        it("should fall back to buildPipeSocket when key is non-exportable (non-Windows)", async () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, "platform", { value: "darwin" });

            mockKeyring.getPrivateKey.mockRejectedValue(new Error("Key is non-exportable"));

            const options = { host: "example.com", port: 443 };
            const result = await agent.connect(null as any, options);

            expect(mockKeyring.createTlsPipe).toHaveBeenCalled();
            expect(mockSocket.connect).toHaveBeenCalled();
            expect(result).toBe(mockSocket);

            Object.defineProperty(process, "platform", { value: originalPlatform });
        });
    });

    describe("derToPem", () => {
        let agent: KeychainAgent;

        beforeEach(() => {
            agent = new KeychainAgent(mockCertAccount, mockCliHome);
        });

        it("should convert DER buffer to PEM format for certificate", () => {
            const derBuffer = Buffer.from("test certificate data");
            const expectedBase64 = derBuffer.toString("base64");

            const pem = (agent as any).derToPem(derBuffer, "CERTIFICATE");

            expect(pem).toContain("-----BEGIN CERTIFICATE-----");
            expect(pem).toContain("-----END CERTIFICATE-----");
            expect(pem).toContain(expectedBase64);
        });

        it("should convert DER buffer to PEM format for private key", () => {
            const derBuffer = Buffer.from("test private key data");
            const expectedBase64 = derBuffer.toString("base64");

            const pem = (agent as any).derToPem(derBuffer, "PRIVATE KEY");

            expect(pem).toContain("-----BEGIN PRIVATE KEY-----");
            expect(pem).toContain("-----END PRIVATE KEY-----");
            expect(pem).toContain(expectedBase64);
        });

        it("should split base64 into 64-character lines", () => {
            // Create a buffer that will result in >64 chars of base64
            const derBuffer = Buffer.alloc(100, "a");

            const pem = (agent as any).derToPem(derBuffer, "CERTIFICATE");
            const lines = pem.split("\n");

            // Check that middle lines (not BEGIN/END) are <= 64 chars
            for (let i = 1; i < lines.length - 1; i++) {
                if (!lines[i].startsWith("-----")) {
                    expect(lines[i].length).toBeLessThanOrEqual(64);
                }
            }
        });

        it("should handle empty buffer", () => {
            const derBuffer = Buffer.alloc(0);

            const pem = (agent as any).derToPem(derBuffer, "CERTIFICATE");

            expect(pem).toContain("-----BEGIN CERTIFICATE-----");
            expect(pem).toContain("-----END CERTIFICATE-----");
        });

        it("should handle small buffer (< 64 chars base64)", () => {
            const derBuffer = Buffer.from("small");

            const pem = (agent as any).derToPem(derBuffer, "CERTIFICATE");
            const lines = pem.split("\n");

            expect(lines.length).toBe(3); // BEGIN, content, END
            expect(lines[0]).toBe("-----BEGIN CERTIFICATE-----");
            expect(lines[2]).toBe("-----END CERTIFICATE-----");
        });
    });
});
