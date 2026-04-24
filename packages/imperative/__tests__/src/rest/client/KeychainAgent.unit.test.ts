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

    describe("constructor", () => {
        it("should create an instance with required parameters", () => {
            const agent = new KeychainAgent(mockCertAccount);

            expect(agent).toBeInstanceOf(KeychainAgent);
        });

        it("should create an instance with custom options", () => {
            const options: https.AgentOptions = {
                keepAlive: true,
                maxSockets: 10,
                rejectUnauthorized: false
            };

            const agent = new KeychainAgent(mockCertAccount, options);

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
            agent = new KeychainAgent(mockCertAccount);

            // Mock socket
            mockSocket = {
                connect: jest.fn((_path, cb) => { if (cb) cb(); }),
                on: jest.fn(),
                once: jest.fn()
            };

            // Mock TLS socket
            mockTlsSocket = {
                once: jest.fn()
            };

            mockKeyring = {
                createTlsPipe: jest.fn().mockResolvedValue("/tmp/test-pipe.sock")
            };

            jest.spyOn(agent as any, "keyring", "get").mockReturnValue(mockKeyring);
            jest.spyOn(require("net"), "Socket").mockImplementation(() => mockSocket);
            jest.spyOn(require("tls"), "connect").mockImplementation(() => mockTlsSocket);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should create TLS pipe socket for secure connections", async () => {
            const options = { host: "example.com", port: 443 };
            const result = await agent.connect(null as any, options);

            expect(mockKeyring.createTlsPipe).toHaveBeenCalledWith("example.com", 443, mockCertAccount, true);
            expect(mockSocket.connect).toHaveBeenCalledWith("/tmp/test-pipe.sock", expect.any(Function));
            expect(result).toBe(mockSocket);
        });
    });
});
