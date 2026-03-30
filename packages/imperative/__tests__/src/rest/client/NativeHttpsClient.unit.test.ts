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

import { NativeHttpsClient } from "../../../../src/rest/src/client/NativeHttpsClient";
import { ImperativeError } from "../../../../src/error";
import { ImperativeConfig } from "../../../../src/utilities";

describe("NativeHttpsClient", () => {
    const originalPlatform = process.platform;

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.ZOWE_MACOS_NATIVE_HTTPS;
    });

    afterEach(() => {
        Object.defineProperty(process, "platform", {
            value: originalPlatform
        });
    });

    describe("isEnabled", () => {
        it("should return false when not on macOS", () => {
            Object.defineProperty(process, "platform", {
                value: "win32"
            });

            const session = { certAccount: "test-cert" };
            const result = NativeHttpsClient.isEnabled(session as any);

            expect(result).toBe(false);
        });

        it("should return false when certAccount is null", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });

            const session: any = { certAccount: null };
            const result = NativeHttpsClient.isEnabled(session);

            expect(result).toBe(false);
        });

        it("should return false when certAccount is undefined", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });

            const session = {};
            const result = NativeHttpsClient.isEnabled(session as any);

            expect(result).toBe(false);
        });

        it("should return true when on macOS with certAccount and env flag enabled", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });
            process.env.ZOWE_MACOS_NATIVE_HTTPS = "true";

            const session = { certAccount: "test-cert" };
            const result = NativeHttpsClient.isEnabled(session as any);

            expect(result).toBe(true);
        });

        it("should return true when env flag is '1'", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });
            process.env.ZOWE_MACOS_NATIVE_HTTPS = "1";

            const session = { certAccount: "test-cert" };
            const result = NativeHttpsClient.isEnabled(session as any);

            expect(result).toBe(true);
        });

        it("should return true when _useNativeHttpsForNonExportable is true", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });

            const session = {
                certAccount: "test-cert",
                _useNativeHttpsForNonExportable: true
            };
            const result = NativeHttpsClient.isEnabled(session as any);

            expect(result).toBe(true);
        });

        it("should return false when env flag is false and _useNativeHttpsForNonExportable is false", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });
            process.env.ZOWE_MACOS_NATIVE_HTTPS = "false";

            const session = {
                certAccount: "test-cert",
                _useNativeHttpsForNonExportable: false
            };
            const result = NativeHttpsClient.isEnabled(session as any);

            expect(result).toBe(false);
        });
    });

    describe("request", () => {
        beforeEach(() => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });
        });

        it("should throw error when certAccount is null", async () => {
            const options = {
                hostname: "example.com",
                port: 443,
                path: "/api",
                method: "GET"
            };
            const session: any = { certAccount: null };

            await expect(NativeHttpsClient.request(options as any, session as any))
                .rejects.toThrow(ImperativeError);
        });

        it("should throw error when secrets SDK is not available", async () => {
            const options = {
                hostname: "example.com",
                port: 443,
                path: "/api",
                method: "GET"
            };
            const session = { certAccount: "test-cert" };

            jest.mock("@zowe/secrets-for-zowe-sdk", () => {
                throw new Error("Module not found");
            });

            await expect(NativeHttpsClient.request(options as any, session as any))
                .rejects.toThrow(ImperativeError);
        });

        it("should normalize array headers to comma-separated strings", async () => {
            const mockNativeRequest = jest.fn().mockResolvedValue({
                statusCode: 200,
                headers: {},
                body: Buffer.from("")
            });

            jest.spyOn(NativeHttpsClient as any, "loadNativeRequestFn")
                .mockReturnValue(mockNativeRequest);
            jest.spyOn(ImperativeConfig, "instance", "get")
                .mockReturnValue({ cliHome: "/test/home" } as any);

            const options = {
                hostname: "example.com",
                port: 443,
                path: "/api",
                method: "GET",
                headers: {
                    "Accept": ["application/json", "text/plain"]
                }
            };
            const session = { certAccount: "test-cert" };

            await NativeHttpsClient.request(options as any, session as any);

            expect(mockNativeRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: expect.objectContaining({
                        "Accept": "application/json, text/plain"
                    })
                })
            );
        });

        it("should convert non-string header values to strings", async () => {
            const mockNativeRequest = jest.fn().mockResolvedValue({
                statusCode: 200,
                headers: {},
                body: Buffer.from("")
            });

            jest.spyOn(NativeHttpsClient as any, "loadNativeRequestFn")
                .mockReturnValue(mockNativeRequest);
            jest.spyOn(ImperativeConfig, "instance", "get")
                .mockReturnValue({ cliHome: "/test/home" } as any);

            const options = {
                hostname: "example.com",
                port: 443,
                path: "/api",
                method: "GET",
                headers: {
                    "Content-Length": 123
                }
            };
            const session = { certAccount: "test-cert" };

            await NativeHttpsClient.request(options as any, session as any);

            expect(mockNativeRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: expect.objectContaining({
                        "Content-Length": "123"
                    })
                })
            );
        });

        it("should use default port when not specified", async () => {
            const mockNativeRequest = jest.fn().mockResolvedValue({
                statusCode: 200,
                headers: {},
                body: Buffer.from("")
            });

            jest.spyOn(NativeHttpsClient as any, "loadNativeRequestFn")
                .mockReturnValue(mockNativeRequest);
            jest.spyOn(ImperativeConfig, "instance", "get")
                .mockReturnValue({ cliHome: "/test/home" } as any);

            const options = {
                hostname: "example.com",
                path: "/api",
                method: "GET"
            };
            const session = { certAccount: "test-cert" };

            await NativeHttpsClient.request(options as any, session as any);

            expect(mockNativeRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    port: undefined
                })
            );
        });

        it("should include request body when provided", async () => {
            const mockNativeRequest = jest.fn().mockResolvedValue({
                statusCode: 200,
                headers: {},
                body: Buffer.from("")
            });

            jest.spyOn(NativeHttpsClient as any, "loadNativeRequestFn")
                .mockReturnValue(mockNativeRequest);
            jest.spyOn(ImperativeConfig, "instance", "get")
                .mockReturnValue({ cliHome: "/test/home" } as any);

            const options = {
                hostname: "example.com",
                port: 443,
                path: "/api",
                method: "POST"
            };
            const session = { certAccount: "test-cert" };
            const writeData = "test body";

            await NativeHttpsClient.request(options as any, session as any, writeData);

            expect(mockNativeRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: writeData
                })
            );
        });
    });

    describe("isKeyExportable", () => {
        const originalPlatform = process.platform;

        beforeEach(() => {
            // Mock platform as darwin (macOS) to avoid Windows early return
            Object.defineProperty(process, "platform", {
                value: "darwin",
                configurable: true
            });
        });

        afterEach(() => {
            // Restore original platform
            Object.defineProperty(process, "platform", {
                value: originalPlatform,
                configurable: true
            });
            jest.resetModules();
        });

        it("should return false on Windows platform", async () => {
            Object.defineProperty(process, "platform", {
                value: "win32",
                configurable: true
            });

            const result = await NativeHttpsClient.isKeyExportable("test-cert", "/test/home");

            expect(result).toBe(false);
        });

        it("should return true when key is exportable", async () => {
            const mockGetPrivateKey = jest.fn().mockResolvedValue(Buffer.from("key data"));
            
            jest.doMock("@zowe/secrets-for-zowe-sdk", () => ({
                keyring: {
                    getPrivateKey: mockGetPrivateKey
                }
            }), { virtual: true });

            // Need to re-import after mocking
            jest.resetModules();
            const { NativeHttpsClient: TestClient } = require("../../../../src/rest/src/client/NativeHttpsClient");
            
            const result = await TestClient.isKeyExportable("test-cert", "/test/home");

            expect(result).toBe(true);
            expect(mockGetPrivateKey).toHaveBeenCalledWith("/test/home", "test-cert");
        });

        it("should return false when key is non-exportable", async () => {
            const mockGetPrivateKey = jest.fn().mockRejectedValue(
                new Error("Private key cannot be exported (non-exportable)")
            );

            jest.doMock("@zowe/secrets-for-zowe-sdk", () => ({
                keyring: {
                    getPrivateKey: mockGetPrivateKey
                }
            }), { virtual: true });

            jest.resetModules();
            const { NativeHttpsClient: TestClient } = require("../../../../src/rest/src/client/NativeHttpsClient");

            const result = await TestClient.isKeyExportable("test-cert", "/test/home");

            expect(result).toBe(false);
        });

        it("should return true when secrets SDK is not available", async () => {
            jest.doMock("@zowe/secrets-for-zowe-sdk", () => {
                throw new Error("Module not found");
            }, { virtual: true });

            jest.resetModules();
            const { NativeHttpsClient: TestClient } = require("../../../../src/rest/src/client/NativeHttpsClient");

            const result = await TestClient.isKeyExportable("test-cert", "/test/home");

            expect(result).toBe(true);
        });

        it("should return true when getPrivateKey function is not available", async () => {
            jest.doMock("@zowe/secrets-for-zowe-sdk", () => ({
                keyring: {}
            }), { virtual: true });

            jest.resetModules();
            const { NativeHttpsClient: TestClient } = require("../../../../src/rest/src/client/NativeHttpsClient");

            const result = await TestClient.isKeyExportable("test-cert", "/test/home");

            expect(result).toBe(true);
        });
    });
});
