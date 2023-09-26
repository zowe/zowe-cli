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

import * as spawn from "cross-spawn";
import { ExecUtils, GuiResult, ImperativeConfig, ProcessUtils } from "../../utilities";

jest.mock("cross-spawn");
jest.mock("opener");

describe("ProcessUtils tests", () => {
    describe("nextTick", () => {

        it("should invoke all next ticks in the proper order", async () => {
            const chicken = "chicken";
            const cat = "cat";
            const dog = "dog";
            const pig = "pig";
            const horse = "horse";

            let animal = chicken;

            const setCat = () => animal = cat;
            const setDog = () => animal = dog;
            const setPig = () => animal = pig;

            await ProcessUtils.nextTick(setCat);
            expect(animal).toBe(cat);

            animal = horse;
            const dogPromise = ProcessUtils.nextTick(setDog);
            expect(animal).toBe(horse);

            await dogPromise;
            expect(animal).toBe(dog);

            await ProcessUtils.nextTick(setPig);
            expect(animal).toBe(pig);
        });
    });

    describe("isGuiAvailable", () => {
        (process.platform !== "linux" ? it : it.skip)("should report a GUI on Windows or Mac", async () => {
            expect(ProcessUtils.isGuiAvailable()).toBe(GuiResult.GUI_AVAILABLE);
        });

        it("should report no GUI on an ssh connection", async () => {
            process.env.SSH_CONNECTION = "AnyValue";
            expect(ProcessUtils.isGuiAvailable()).toBe(GuiResult.NO_GUI_SSH);
        });

        it("should report a GUI if DISPLAY is set on Linux", async () => {
            const realPlatform = process.platform;
            Object.defineProperty(process, "platform", {
                value: "linux"
            });

            const realEnv = process.env;
            Object.defineProperty(process, "env", {
                value: {
                    DISPLAY: "xterm"
                }
            });

            expect(ProcessUtils.isGuiAvailable()).toBe(GuiResult.GUI_AVAILABLE);

            // restore values
            Object.defineProperty(process, "platform", {
                value: realPlatform
            });
            Object.defineProperty(process, "env", {
                value: realEnv
            });
        });

        it("should report no GUI if DISPLAY is not set on Linux", async () => {
            const realPlatform = process.platform;
            Object.defineProperty(process, "platform", {
                value: "linux"
            });

            const realEnv = process.env;
            Object.defineProperty(process, "env", {
                value: {
                    DISPLAY: ""
                }
            });

            process.env.DISPLAY = "";
            expect(ProcessUtils.isGuiAvailable()).toBe(GuiResult.NO_GUI_NO_DISPLAY);

            // restore values
            Object.defineProperty(process, "platform", {
                value: realPlatform
            });
            Object.defineProperty(process, "env", {
                value: realEnv
            });
        });
    });

    describe("getBasicSystemInfo", () => {
        let realPlatform: string;
        let realArch: string;

        beforeAll(() => {
            realPlatform = process.platform;
            realArch = process.arch;
        });

        afterEach(() => {
            Object.defineProperty(process, "platform", { value: realPlatform });
            Object.defineProperty(process, "arch", { value: realArch });
        });

        it("should report that the CPU architecture is arm", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "arm" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "arm", platform: "linux"});
        });

        it("should report that the CPU architecture is arm64", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "arm64" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "arm64", platform: "linux"});
        });

        it("should report that the CPU architecture is x86-32", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "ia32" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "ia32", platform: "linux"});
        });

        it("should report that the CPU architecture is mips", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "mips" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "mips", platform: "linux"});
        });

        it("should report that the CPU architecture is mips little endian", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "mipsel" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "mipsel", platform: "linux"});
        });

        it("should report that the CPU architecture is power pc", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "ppc" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "ppc", platform: "linux"});
        });

        it("should report that the CPU architecture is power pc 64", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "ppc64" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "ppc64", platform: "linux"});
        });

        it("should report that the CPU architecture is s390", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "s390" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "s390", platform: "linux"});
        });

        it("should report that the CPU architecture is s390x", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "s390x" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "s390x", platform: "linux"});
        });

        it("should report that the CPU architecture is x32", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "x32" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "x32", platform: "linux"});
        });

        it("should report that the CPU architecture is x64", () => {
            Object.defineProperty(process, "platform", { value: "linux" });
            Object.defineProperty(process, "arch", { value: "x64" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "x64", platform: "linux"});
        });

        it("should report that the platform is AIX", () => {
            Object.defineProperty(process, "platform", { value: "aix" });
            Object.defineProperty(process, "arch", { value: "x64" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "x64", platform: "aix"});
        });

        it("should report that the platform is Darwin", () => {
            Object.defineProperty(process, "platform", { value: "darwin" });
            Object.defineProperty(process, "arch", { value: "x64" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "x64", platform: "darwin"});
        });

        it("should report that the platform is FreeBSD", () => {
            Object.defineProperty(process, "platform", { value: "freebsd" });
            Object.defineProperty(process, "arch", { value: "x64" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "x64", platform: "freebsd"});
        });

        it("should report that the platform is OpenBSD", () => {
            Object.defineProperty(process, "platform", { value: "openbsd" });
            Object.defineProperty(process, "arch", { value: "x64" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "x64", platform: "openbsd"});
        });

        it("should report that the platform is SunOS/Solaris", () => {
            Object.defineProperty(process, "platform", { value: "sunos" });
            Object.defineProperty(process, "arch", { value: "x64" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "x64", platform: "sunos"});
        });

        it("should report that the platform is Windows", () => {
            Object.defineProperty(process, "platform", { value: "win32" });
            Object.defineProperty(process, "arch", { value: "x64" });
            expect(ProcessUtils.getBasicSystemInfo()).toEqual({arch: "x64", platform: "win32"});
        });
    });

    describe("openInDefaultApp", () => {
        it("should open file path in default app", () => {
            const mockOpener = require("opener");
            ProcessUtils.openInDefaultApp(__filename);
            expect(mockOpener).toHaveBeenCalledWith(__filename);
        });

        it("should open Internet URL in default app", () => {
            const mockOpener = require("opener");
            ProcessUtils.openInDefaultApp("https://example.com");
            expect(mockOpener).toHaveBeenCalledWith("https://example.com");
        });
    });

    describe("openInEditor", () => {
        it("should open file in graphical editor", async () => {
            jest.spyOn(ProcessUtils, "isGuiAvailable").mockReturnValueOnce(GuiResult.GUI_AVAILABLE);
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                loadedConfig: {
                    envVariablePrefix: "TEST_CLI"
                }
            } as any);
            const mockOpener = require("opener");
            await ProcessUtils.openInEditor("filePath");
            expect(mockOpener).toHaveBeenCalledWith("filePath");
        });

        it("should open file in custom graphical editor", async () => {
            jest.spyOn(ProcessUtils, "isGuiAvailable").mockReturnValueOnce(GuiResult.GUI_AVAILABLE);
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                loadedConfig: {
                    envVariablePrefix: "TEST_CLI"
                }
            } as any);
            const mockOpener = require("opener");
            try {
                process.env.TEST_CLI_EDITOR = "fakeEdit";
                await ProcessUtils.openInEditor("filePath");
            } finally {
                delete process.env.TEST_CLI_EDITOR;
            }
            expect(spawn.spawn).toHaveBeenCalledWith("fakeEdit", ["filePath"], { stdio: "inherit" });
        });

        it("should open file in custom command-line editor", async () => {
            jest.spyOn(ProcessUtils, "isGuiAvailable").mockReturnValueOnce(GuiResult.NO_GUI_NO_DISPLAY);
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                loadedConfig: {
                    envVariablePrefix: "TEST_CLI"
                }
            } as any);
            try {
                process.env.TEST_CLI_EDITOR = "fakeEdit";
                await ProcessUtils.openInEditor("filePath");
            } finally {
                delete process.env.TEST_CLI_EDITOR;
            }
            expect(spawn.spawn).toHaveBeenCalledWith("fakeEdit", ["filePath"], { stdio: "inherit" });
        });

        it("should open file in default command-line editor", async () => {
            jest.spyOn(ProcessUtils, "isGuiAvailable").mockReturnValueOnce(GuiResult.NO_GUI_NO_DISPLAY);
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                loadedConfig: {}
            } as any);
            await ProcessUtils.openInEditor("filePath");
            expect(spawn.spawn).toHaveBeenCalledWith("vi", ["filePath"], { stdio: "inherit" });
        });
    });

    // TODO: Remove this entire 'describe' section in V3 when the @deprecated execAndCheckOutput function is removed
    describe("execAndCheckOutput", () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it("should just pass through to ExecUtils.spawnAndGetOutput", () => {
            const message = "Hello world!";
            const options: any = { cwd: __dirname };
            const stdoutBuffer = Buffer.from(message + "\n");
            const spawnSpy = jest.spyOn(ExecUtils, "spawnAndGetOutput").mockReturnValueOnce(stdoutBuffer as any);
            const execOutput = ProcessUtils.execAndCheckOutput("echo", [message], options);
            expect(spawnSpy).toHaveBeenCalledWith("echo", [message], options);
            expect(execOutput).toBe(stdoutBuffer);
        });
    });
});