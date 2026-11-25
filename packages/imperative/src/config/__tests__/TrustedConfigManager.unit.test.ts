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

jest.mock("fs", () => jest.createMockFromModule("fs"));

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Logger } from "../../logger";
import { Config } from "../src/Config";
import { TrustedConfigManager } from "../src/TrustedConfigManager";

describe("TrustedConfigManager", () => {
    const tmp = path.resolve(path.sep, "zowe-trust");
    const cliHome = path.join(tmp, "cliHome");
    const fakeHome = path.join(tmp, "fakeHome");
    const settingsFile = path.join(cliHome, "settings", "imperative.json");
    const files = new Map<string, string>();
    const savedEnv = { ...process.env };

    beforeEach(() => {
        jest.resetAllMocks();
        files.clear();
        jest.mocked(fs.readFileSync).mockImplementation((file) => files.get(String(file)) ?? "{}");
        jest.mocked(fs.writeFileSync).mockImplementation((file, data) => files.set(String(file), String(data)));
        jest.mocked(fs.existsSync).mockImplementation((file) => files.has(String(file)));
        jest.mocked(fs.statSync).mockReturnValue({ mode: 0o755, isDirectory: () => true } as fs.Stats);
        jest.mocked(fs.realpathSync.native).mockImplementation((file) => String(file));
        jest.spyOn(Logger.prototype, "warn").mockImplementation();
        jest.spyOn(os, "homedir").mockReturnValue(fakeHome);
        delete process.env.CI;
        delete process.env[TrustedConfigManager.ENV_ALLOW_UNTRUSTED];
        delete process.env[TrustedConfigManager.ENV_ALLOW_WORLD_WRITABLE];
    });

    afterEach(() => {
        jest.restoreAllMocks();
        process.env = { ...savedEnv };
    });

    it("should not trust an unknown directory without a prompt", async () => {
        await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).resolves.toBe(false);
    });

    it("should trust cwd, start dir and home subdirectories", async () => {
        await expect(TrustedConfigManager.isDirTrusted(process.cwd(), cliHome)).resolves.toBe(true);
        await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, undefined, tmp)).resolves.toBe(true);
        await expect(TrustedConfigManager.isDirTrusted(path.join(fakeHome, "a"), cliHome)).resolves.toBe(true);
    });

    it.each([
        ["CI", "yes"], ["CI", "true"], ["CI", "1"],
        [TrustedConfigManager.ENV_ALLOW_UNTRUSTED, "true"], [TrustedConfigManager.ENV_ALLOW_UNTRUSTED, "1"]
    ])(
        "should trust everything when %s=%s", async (key, val) => {
            process.env[key] = val;
            await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).resolves.toBe(true);
        });

    it.each(["", "false", "0"])("should not bypass trust checks when CI=%s", async (value) => {
        process.env.CI = value;
        await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).resolves.toBe(false);
    });

    it("should defer to the prompt function", async () => {
        await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, () => true)).resolves.toBe(true);
        await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, () => false)).resolves.toBe(false);
    });

    it("should await an asynchronous prompt function", async () => {
        await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, async () => true)).resolves.toBe(true);
        await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, async () => false)).resolves.toBe(false);
    });

    it("should propagate an asynchronous prompt failure", async () => {
        await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, async () => {
            throw new Error("Prompt failed");
        })).rejects.toThrow("Prompt failed");
    });

    it("should add, list and remove trusted directories", async () => {
        expect(TrustedConfigManager.list(cliHome)).toEqual([]);
        TrustedConfigManager.add(cliHome, tmp);
        TrustedConfigManager.add(cliHome, tmp);
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        await expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).resolves.toBe(true);
        TrustedConfigManager.remove(cliHome, tmp);
        expect(TrustedConfigManager.list(cliHome)).toEqual([]);
    });

    it("should preserve other settings when writing", () => {
        files.set(settingsFile, JSON.stringify({ overrides: { CredentialManager: false } }));
        TrustedConfigManager.add(cliHome, tmp);
        const saved = JSON.parse(files.get(settingsFile));
        expect(saved.overrides).toEqual({ CredentialManager: false });
    });

    it("should skip relative paths in settings with a warning", () => {
        files.set(settingsFile, JSON.stringify({
            trustedProjectDirs: [tmp, "relative/dir"]
        }));
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("relative/dir"));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("cannot be relative or contain a symbolic link"));
    });

    it("should skip symbolic links in settings with a warning", () => {
        const link = path.join(tmp, "link");
        jest.mocked(fs.realpathSync.native).mockImplementation((file) => file === link ? fakeHome : String(file));
        files.set(settingsFile, JSON.stringify({
            trustedProjectDirs: [tmp, link]
        }));
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(link));
    });

    it("should not warn when saved trusted paths are valid", () => {
        TrustedConfigManager.add(cliHome, tmp);
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        expect(warn).not.toHaveBeenCalled();
    });

    it("should reject relative paths without writing settings", () => {
        expect(() => TrustedConfigManager.add(cliHome, "relative/dir"))
            .toThrow("Trusted directory path cannot be relative or contain a symbolic link");
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("should reject symbolic links without writing settings", () => {
        const link = path.join(tmp, "link");
        jest.mocked(fs.realpathSync.native).mockImplementation((file) => file === link ? fakeHome : String(file));
        expect(() => TrustedConfigManager.add(cliHome, link))
            .toThrow("Trusted directory path cannot be relative or contain a symbolic link");
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("should skip a path under a linked parent with a warning", () => {
        const link = path.join(tmp, "link");
        const child = path.join(link, "child");
        jest.mocked(fs.realpathSync.native).mockImplementation((file) => file === child ? path.join(fakeHome, "child") : String(file));
        files.set(settingsFile, JSON.stringify({
            trustedProjectDirs: [tmp, child]
        }));
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(child));
    });

    it("should reject a path under a linked parent without writing settings", () => {
        const link = path.join(tmp, "link");
        const child = path.join(link, "child");
        jest.mocked(fs.realpathSync.native).mockImplementation((file) => file === child ? path.join(fakeHome, "child") : String(file));
        expect(() => TrustedConfigManager.add(cliHome, child))
            .toThrow("Trusted directory path cannot be relative or contain a symbolic link");
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("should reject a dangling symbolic link without writing settings", () => {
        const link = path.join(tmp, "link");
        jest.mocked(fs.realpathSync.native).mockImplementation(() => {
            throw Object.assign(new Error("Dangling symbolic link"), { code: "ENOENT" });
        });
        expect(() => TrustedConfigManager.add(cliHome, link))
            .toThrow("Trusted directory path cannot be relative or contain a symbolic link");
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("should reject missing absolute paths without writing settings", () => {
        const missing = path.join(tmp, "missing", "child");
        jest.mocked(fs.realpathSync.native).mockImplementation(() => {
            throw Object.assign(new Error("Directory not found"), { code: "ENOENT" });
        });
        expect(() => TrustedConfigManager.add(cliHome, missing)).toThrow();
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("should skip missing absolute paths in settings with a warning", () => {
        const missing = path.join(tmp, "missing", "child");
        jest.mocked(fs.realpathSync.native).mockImplementation((file) => {
            if (file === missing) throw Object.assign(new Error("Directory not found"), { code: "ENOENT" });
            return String(file);
        });
        files.set(settingsFile, JSON.stringify({
            trustedProjectDirs: [tmp, missing]
        }));
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(missing));
    });

    it("should reject paths when realpath fails with a permission error", () => {
        files.set(settingsFile, JSON.stringify({ trustedProjectDirs: [tmp] }));
        jest.mocked(fs.realpathSync.native).mockImplementation(() => {
            throw Object.assign(new Error("Cannot resolve path"), { code: "EACCES" });
        });
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
        expect(TrustedConfigManager.list(cliHome)).toEqual([]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(tmp));
        expect(() => TrustedConfigManager.add(cliHome, tmp))
            .toThrow("Trusted directory path cannot be relative or contain a symbolic link");
    });

    (process.platform === "win32" ? it : it.skip)("should accept Windows paths with different casing", () => {
        const trusted = path.join(tmp, "MixedCase");
        jest.mocked(fs.realpathSync.native).mockImplementation((file) =>
            String(file).toLowerCase() === trusted.toLowerCase() ? trusted : String(file));
        TrustedConfigManager.add(cliHome, trusted.toLowerCase());
        expect(TrustedConfigManager.list(cliHome)).toEqual([fs.realpathSync.native(trusted)]);
    });

    it("should not trust a home subdirectory that links outside the home", async () => {
        const outside = path.join(tmp, "outside");
        const link = path.join(fakeHome, "link");
        jest.mocked(fs.realpathSync.native).mockImplementation((file) => file === link ? outside : String(file));
        await expect(TrustedConfigManager.isDirTrusted(link, cliHome)).resolves.toBe(false);
    });

    it("should normalize trusted paths when adding, comparing and removing them", async () => {
        const trusted = path.join(tmp, "trusted");
        const unnormalized = `${tmp}${path.sep}unused${path.sep}..${path.sep}trusted`;
        TrustedConfigManager.add(cliHome, unnormalized);
        TrustedConfigManager.add(cliHome, trusted);
        expect(TrustedConfigManager.list(cliHome)).toEqual([trusted]);
        await expect(TrustedConfigManager.isDirTrusted(trusted, cliHome)).resolves.toBe(true);
        TrustedConfigManager.remove(cliHome, unnormalized);
        expect(TrustedConfigManager.list(cliHome)).toEqual([]);
    });

    (process.platform === "win32" ? it.skip : it)("should detect world-writable directories", () => {
        jest.mocked(fs.statSync).mockReturnValueOnce({ mode: 0o777 } as fs.Stats);
        expect(TrustedConfigManager.isWorldWritable(tmp)).toBe(true);
        process.env[TrustedConfigManager.ENV_ALLOW_WORLD_WRITABLE] = "1";
        expect(TrustedConfigManager.isWorldWritable(tmp)).toBe(false);
        delete process.env[TrustedConfigManager.ENV_ALLOW_WORLD_WRITABLE];
        expect(TrustedConfigManager.isWorldWritable(tmp)).toBe(false);
    });

    it.each(["app.config.json", "app.config.user.json"])("should not read a rejected %s during load or reload", async (file) => {
        const proj = path.join(tmp, "proj");
        const configPath = path.join(proj, file);
        files.set(configPath, JSON.stringify({ profiles: { evil: { properties: { host: "x" } } } }));
        jest.spyOn(TrustedConfigManager, "isWorldWritable").mockImplementation((dir) => dir === proj);
        const readMock = jest.mocked(fs.readFileSync);
        const opts = { homeDir: cliHome, projectDir: proj };
        const config = await Config.load("app", opts);
        const user = file === "app.config.user.json";

        expect(config.findLayer(user, false).path).toBe("");
        expect(config.findLayer(user, false).exists).toBe(false);
        expect(config.properties).toEqual(Config.empty());

        config.api.layers.read({ user, global: false });
        await config.reload(opts);
        expect(config.findLayer(user, false).path).toBe("");
        expect(config.findLayer(user, false).exists).toBe(false);
        expect(config.properties).toEqual(Config.empty());
        expect(readMock.mock.calls.some(([filePath]) => filePath === configPath)).toBe(false);
    });

    it("should preserve default paths for missing project config files", async () => {
        const proj = path.join(tmp, "proj");
        const config = await Config.load("app", { homeDir: cliHome, projectDir: proj });
        expect(config.findLayer(false, false).path).toBe(path.join(proj, "app.config.json"));
        expect(config.findLayer(true, false).path).toBe(path.join(proj, "app.config.user.json"));
        expect(config.properties).toEqual(Config.empty());
    });

    it("should continue searching for trusted config after rejecting a project config", async () => {
        const proj = path.join(tmp, "proj");
        const sub = path.join(proj, "sub");
        files.set(path.join(proj, "app.config.json"), JSON.stringify({ profiles: { evil: {} } }));
        files.set(path.join(tmp, "app.config.json"), JSON.stringify({ profiles: { trusted: {} } }));
        const config = await Config.load("app", { homeDir: cliHome, projectDir: sub, trustPromptFn: async (dir) => dir === tmp });
        expect(config.findLayer(false, false).path).toBe(path.join(tmp, "app.config.json"));
        expect(config.properties.profiles).toEqual({ trusted: {} });
    });

    it("should skip untrusted project config during Config.load", async () => {
        const proj = path.join(tmp, "proj");
        const sub = path.join(proj, "sub");
        files.set(path.join(proj, "app.config.json"), JSON.stringify({ profiles: { evil: { properties: { host: "x" } } } }));
        const load = (extra = {}) => Config.load("app", { homeDir: cliHome, projectDir: sub, ...extra });
        const untrusted = await load();
        expect(untrusted.layerActive().path).not.toBe(path.join(proj, "app.config.json"));
        expect(untrusted.properties.profiles).toEqual({});
        const trusted = await load({ trustPromptFn: async () => true });
        expect(trusted.layerActive().path).toBe(path.join(proj, "app.config.json"));
        expect(trusted.properties.profiles.evil).toBeDefined();
    });

    it("should not read project config rejected by an asynchronous prompt during load or reload", async () => {
        const proj = path.join(tmp, "proj");
        const sub = path.join(proj, "sub");
        const configPath = path.join(proj, "app.config.json");
        const userConfigPath = path.join(proj, "app.config.user.json");
        files.set(configPath, JSON.stringify({ profiles: { evil: {} } }));
        files.set(userConfigPath, JSON.stringify({ profiles: { evil: {} } }));
        const trustPromptFn = jest.fn(async () => false);
        const readMock = jest.mocked(fs.readFileSync);
        const opts = { homeDir: cliHome, projectDir: sub };
        const config = await Config.load("app", { ...opts, trustPromptFn });
        expect(trustPromptFn).toHaveBeenCalledWith(proj);
        expect(config.properties).toEqual(Config.empty());

        trustPromptFn.mockClear();
        await config.reload(opts);
        expect(trustPromptFn).toHaveBeenCalledWith(proj);
        expect(config.findLayer(false, false).path).toBe("");
        expect(config.findLayer(true, false).path).toBe("");
        expect(config.properties).toEqual(Config.empty());
        expect(readMock.mock.calls.some(([file]) => file === configPath || file === userConfigPath)).toBe(false);
    });
});
