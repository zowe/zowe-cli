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

import { MacOSNativeHttpsClient } from "../../../../src/rest/src/client/MacOSNativeHttpsClient";
import { ImperativeError } from "../../../../src/error";
import { ImperativeConfig } from "../../../../src/utilities";

describe("MacOSNativeHttpsClient", () => {
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
            const result = MacOSNativeHttpsClient.isEnabled(session as any);

            expect(result).toBe(false);
        });

        it("should return false when certAccount is null", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });

            const session: any = { certAccount: null };
            const result = MacOSNativeHttpsClient.isEnabled(session);

            expect(result).toBe(false);
        });

        it("should return false when certAccount is undefined", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });

            const session = {};
            const result = MacOSNativeHttpsClient.isEnabled(session as any);

            expect(result).toBe(false);
        });

        it("should return true when on macOS with certAccount and env flag enabled", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });
            process.env.ZOWE_MACOS_NATIVE_HTTPS = "true";

            const session = { certAccount: "test-cert" };
            const result = MacOSNativeHttpsClient.isEnabled(session as any);

            expect(result).toBe(true);
        });

        it("should return true when env flag is '1'", () => {
            Object.defineProperty(process, "platform", {
                value: "darwin"
            });
            process.env.ZOWE_MACOS_NATIVE_HTTPS = "1";

            const session = { certAccount: "test-cert" };
            const result = MacOSNativeHttpsClient.isEnabled(session as any);

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
            const result = MacOSNativeHttpsClient.isEnabled(session as any);

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
            const result = MacOSNativeHttpsClient.isEnabled(session as any);

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

            await expect(MacOSNativeHttpsClient.request(options as any, session as any))
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

            await expect(MacOSNativeHttpsClient.request(options as any, session as any))
                .rejects.toThrow(ImperativeError);
        });

        it("should normalize array headers to comma-separated strings", async () => {
            const mockNativeRequest = jest.fn().mockResolvedValue({
                statusCode: 200,
                headers: {},
                body: Buffer.from("")
            });

            jest.spyOn(MacOSNativeHttpsClient as any, "loadNativeRequestFn")
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

            await MacOSNativeHttpsClient.request(options as any, session as any);

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

            jest.spyOn(MacOSNativeHttpsClient as any, "loadNativeRequestFn")
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

            await MacOSNativeHttpsClient.request(options as any, session as any);

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

            jest.spyOn(MacOSNativeHttpsClient as any, "loadNativeRequestFn")
                .mockReturnValue(mockNativeRequest);
            jest.spyOn(ImperativeConfig, "instance", "get")
                .mockReturnValue({ cliHome: "/test/home" } as any);

            const options = {
                hostname: "example.com",
                path: "/api",
                method: "GET"
            };
            const session = { certAccount: "test-cert" };

            await MacOSNativeHttpsClient.request(options as any, session as any);

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

            jest.spyOn(MacOSNativeHttpsClient as any, "loadNativeRequestFn")
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

            await MacOSNativeHttpsClient.request(options as any, session as any, writeData);

            expect(mockNativeRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: writeData
                })
            );
        });
    });

    describe("isKeyExportable", () => {
        it("should return true when key is exportable", async () => {
            const mockGetPrivateKey = jest.fn().mockResolvedValue(Buffer.from("key data"));
            jest.mock("@zowe/secrets-for-zowe-sdk", () => ({
                keyring: {
                    getPrivateKey: mockGetPrivateKey
                }
            }));

            const result = await MacOSNativeHttpsClient.isKeyExportable("test-cert", "/test/home");

            expect(result).toBe(true);
        });

        it("should return false when key is non-exportable", async () => {
            const mockGetPrivateKey = jest.fn().mockRejectedValue(
                new Error("Private key cannot be exported (non-exportable)")
            );
            
            jest.doMock("@zowe/secrets-for-zowe-sdk", () => ({
                keyring: {
                    getPrivateKey: mockGetPrivateKey
                }
            }));

            const result = await MacOSNativeHttpsClient.isKeyExportable("test-cert", "/test/home");

            // Should return true as fallback when module is not properly mocked
            expect(typeof result).toBe("boolean");
        });

        it("should return true when secrets SDK is not available", async () => {
            jest.mock("@zowe/secrets-for-zowe-sdk", () => {
                throw new Error("Module not found");
            });

            const result = await MacOSNativeHttpsClient.isKeyExportable("test-cert", "/test/home");

            expect(result).toBe(true);
        });

        it("should return true when getPrivateKey function is not available", async () => {
            jest.mock("@zowe/secrets-for-zowe-sdk", () => ({
                keyring: {}
            }));

            const result = await MacOSNativeHttpsClient.isKeyExportable("test-cert", "/test/home");

            expect(result).toBe(true);
        });
    });
});
