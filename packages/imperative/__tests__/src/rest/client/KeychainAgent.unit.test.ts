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
            expect(agent).toBeInstanceOf(https.Agent);
        });

        it("should create an instance with custom options", () => {
            const options: https.AgentOptions = {
                keepAlive: true,
                maxSockets: 10,
                rejectUnauthorized: false
            };
            
            const agent = new KeychainAgent(mockCertAccount, mockCliHome, options);
            
            expect(agent).toBeInstanceOf(KeychainAgent);
        });

        it("should default rejectUnauthorized to true when not specified", () => {
            const agent = new KeychainAgent(mockCertAccount, mockCliHome);
            
            // Access private property for testing
            expect((agent as any).options.rejectUnauthorized).toBe(true);
        });

        it("should respect rejectUnauthorized option when provided", () => {
            const agent = new KeychainAgent(mockCertAccount, mockCliHome, {
                rejectUnauthorized: false
            });
            
            expect((agent as any).options.rejectUnauthorized).toBe(false);
        });
    });

    describe("createConnection", () => {
        let agent: KeychainAgent;
        let mockSocket: any;

        beforeEach(() => {
            agent = new KeychainAgent(mockCertAccount, mockCliHome);
            
            // Mock socket
            mockSocket = {
                connect: jest.fn(),
                on: jest.fn()
            };
            
            // Mock Socket constructor
            jest.spyOn(require("net"), "Socket").mockImplementation(() => mockSocket);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should create a socket and attempt to connect", () => {
            const options = {
                host: "example.com",
                port: 443
            };
            
            agent.createConnection(options);
            
            expect(mockSocket.connect).toHaveBeenCalledWith(443, "example.com", expect.any(Function));
        });

        it("should register error handler on socket", () => {
            const options = {
                host: "example.com",
                port: 443
            };
            
            agent.createConnection(options);
            
            expect(mockSocket.on).toHaveBeenCalledWith("error", expect.any(Function));
        });

        it("should call callback with error when socket errors", () => {
            const options = {
                host: "example.com",
                port: 443
            };
            const mockError = new Error("Connection failed");
            const callback = jest.fn();
            
            agent.createConnection(options, callback);
            
            // Simulate socket error
            const errorHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === "error")[1];
            errorHandler(mockError);
            
            expect(callback).toHaveBeenCalledWith(mockError);
        });

        it("should return the created socket", () => {
            const options = {
                host: "example.com",
                port: 443
            };
            
            const result = agent.createConnection(options);
            
            expect(result).toBe(mockSocket);
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
