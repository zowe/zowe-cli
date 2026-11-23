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

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Logger } from "../../logger";
import { TrustedConfigManager } from "../src/TrustedConfigManager";

describe("TrustedConfigManager", () => {
    let tmp: string;
    let cliHome: string;
    let fakeHome: string;
    const savedEnv = { ...process.env };

    beforeEach(() => {
        tmp = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "zowe-trust-")));
        cliHome = path.join(tmp, "cliHome");
        // The OS temp dir may be inside the real home dir (e.g. on Windows), so point home elsewhere
        fakeHome = path.join(tmp, "fakeHome");
        fs.mkdirSync(fakeHome);
        jest.spyOn(os, "homedir").mockReturnValue(fakeHome);
        delete process.env.CI;
        delete process.env[TrustedConfigManager.ENV_ALLOW_UNTRUSTED];
        delete process.env[TrustedConfigManager.ENV_ALLOW_WORLD_WRITABLE];
    });

    afterEach(() => {
        jest.restoreAllMocks();
        process.env = { ...savedEnv };
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it("should not trust an unknown directory without a prompt", () => {
        expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).toBe(false);
    });

    it("should trust cwd, start dir and home subdirectories", () => {
        expect(TrustedConfigManager.isDirTrusted(process.cwd(), cliHome)).toBe(true);
        expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, undefined, tmp)).toBe(true);
        expect(TrustedConfigManager.isDirTrusted(path.join(fakeHome, "a"), cliHome)).toBe(true);
    });

    it.each([
        ["CI", "yes"], ["CI", "true"], ["CI", "1"],
        [TrustedConfigManager.ENV_ALLOW_UNTRUSTED, "true"], [TrustedConfigManager.ENV_ALLOW_UNTRUSTED, "1"]
    ])(
        "should trust everything when %s=%s", (key, val) => {
            process.env[key] = val;
            expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).toBe(true);
        });

    it.each(["", "false", "0"])("should not bypass trust checks when CI=%s", (value) => {
        process.env.CI = value;
        expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).toBe(false);
    });

    it("should defer to the prompt function", () => {
        expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, () => true)).toBe(true);
        expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, () => false)).toBe(false);
    });

    it("should add, list and remove trusted directories", () => {
        expect(TrustedConfigManager.list(cliHome)).toEqual([]);
        TrustedConfigManager.add(cliHome, tmp);
        TrustedConfigManager.add(cliHome, tmp);
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).toBe(true);
        TrustedConfigManager.remove(cliHome, tmp);
        expect(TrustedConfigManager.list(cliHome)).toEqual([]);
    });

    it("should preserve other settings when writing", () => {
        fs.mkdirSync(path.join(cliHome, "settings"), { recursive: true });
        fs.writeFileSync(path.join(cliHome, "settings", "imperative.json"), JSON.stringify({ overrides: { CredentialManager: false } }));
        TrustedConfigManager.add(cliHome, tmp);
        const saved = JSON.parse(fs.readFileSync(path.join(cliHome, "settings", "imperative.json"), "utf-8"));
        expect(saved.overrides).toEqual({ CredentialManager: false });
    });

    it("should skip relative paths in settings with a warning", () => {
        fs.mkdirSync(path.join(cliHome, "settings"), { recursive: true });
        fs.writeFileSync(path.join(cliHome, "settings", "imperative.json"), JSON.stringify({
            trustedConfigDirs: [tmp, "relative/dir"]
        }));
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("relative/dir"));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("cannot be relative or contain a symbolic link"));
    });

    it("should skip symbolic links in settings with a warning", () => {
        const link = path.join(tmp, "link");
        fs.symlinkSync(fakeHome, link, process.platform === "win32" ? "junction" : "dir");
        fs.mkdirSync(path.join(cliHome, "settings"), { recursive: true });
        fs.writeFileSync(path.join(cliHome, "settings", "imperative.json"), JSON.stringify({
            trustedConfigDirs: [tmp, link]
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
        expect(fs.existsSync(path.join(cliHome, "settings", "imperative.json"))).toBe(false);
    });

    it("should reject symbolic links without writing settings", () => {
        const link = path.join(tmp, "link");
        fs.symlinkSync(fakeHome, link, process.platform === "win32" ? "junction" : "dir");
        expect(() => TrustedConfigManager.add(cliHome, link))
            .toThrow("Trusted directory path cannot be relative or contain a symbolic link");
        expect(fs.existsSync(path.join(cliHome, "settings", "imperative.json"))).toBe(false);
    });

    it("should skip a path under a linked parent with a warning", () => {
        const link = path.join(tmp, "link");
        fs.mkdirSync(path.join(fakeHome, "child"));
        fs.symlinkSync(fakeHome, link, process.platform === "win32" ? "junction" : "dir");
        const child = path.join(link, "child");
        fs.mkdirSync(path.join(cliHome, "settings"), { recursive: true });
        fs.writeFileSync(path.join(cliHome, "settings", "imperative.json"), JSON.stringify({
            trustedConfigDirs: [tmp, child]
        }));
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(child));
    });

    it("should reject a path under a linked parent without writing settings", () => {
        const link = path.join(tmp, "link");
        fs.mkdirSync(path.join(fakeHome, "child"));
        fs.symlinkSync(fakeHome, link, process.platform === "win32" ? "junction" : "dir");
        expect(() => TrustedConfigManager.add(cliHome, path.join(link, "child")))
            .toThrow("Trusted directory path cannot be relative or contain a symbolic link");
        expect(fs.existsSync(path.join(cliHome, "settings", "imperative.json"))).toBe(false);
    });

    it("should reject a dangling symbolic link without writing settings", () => {
        const link = path.join(tmp, "link");
        fs.symlinkSync(path.join(tmp, "absent"), link, process.platform === "win32" ? "junction" : "dir");
        expect(() => TrustedConfigManager.add(cliHome, link))
            .toThrow("Trusted directory path cannot be relative or contain a symbolic link");
        expect(fs.existsSync(path.join(cliHome, "settings", "imperative.json"))).toBe(false);
    });

    it("should reject missing absolute paths without writing settings", () => {
        const missing = path.join(tmp, "missing", "child");
        expect(() => TrustedConfigManager.add(cliHome, missing)).toThrow();
        expect(fs.existsSync(path.join(cliHome, "settings", "imperative.json"))).toBe(false);
    });

    it("should skip missing absolute paths in settings with a warning", () => {
        const missing = path.join(tmp, "missing", "child");
        fs.mkdirSync(path.join(cliHome, "settings"), { recursive: true });
        fs.writeFileSync(path.join(cliHome, "settings", "imperative.json"), JSON.stringify({
            trustedConfigDirs: [tmp, missing]
        }));
        const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
        expect(TrustedConfigManager.list(cliHome)).toEqual([tmp]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(missing));
    });

    it("should reject paths when realpath fails with a permission error", () => {
        fs.mkdirSync(path.join(cliHome, "settings"), { recursive: true });
        fs.writeFileSync(path.join(cliHome, "settings", "imperative.json"), JSON.stringify({ trustedConfigDirs: [tmp] }));
        jest.spyOn(fs.realpathSync, "native").mockImplementation(() => {
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
        fs.mkdirSync(trusted);
        TrustedConfigManager.add(cliHome, trusted.toLowerCase());
        expect(TrustedConfigManager.list(cliHome)).toEqual([fs.realpathSync.native(trusted)]);
    });

    it("should not trust a home subdirectory that links outside the home", () => {
        const outside = path.join(tmp, "outside");
        fs.mkdirSync(outside);
        const link = path.join(fakeHome, "link");
        fs.symlinkSync(outside, link, process.platform === "win32" ? "junction" : "dir");
        expect(TrustedConfigManager.isDirTrusted(link, cliHome)).toBe(false);
    });

    it("should normalize trusted paths when adding, comparing and removing them", () => {
        const trusted = path.join(tmp, "trusted");
        fs.mkdirSync(trusted);
        const unnormalized = `${tmp}${path.sep}unused${path.sep}..${path.sep}trusted`;
        TrustedConfigManager.add(cliHome, unnormalized);
        TrustedConfigManager.add(cliHome, trusted);
        expect(TrustedConfigManager.list(cliHome)).toEqual([trusted]);
        expect(TrustedConfigManager.isDirTrusted(trusted, cliHome)).toBe(true);
        TrustedConfigManager.remove(cliHome, unnormalized);
        expect(TrustedConfigManager.list(cliHome)).toEqual([]);
    });

    (process.platform === "win32" ? it.skip : it)("should detect world-writable directories", () => {
        fs.chmodSync(tmp, 0o777);
        expect(TrustedConfigManager.isWorldWritable(tmp)).toBe(true);
        process.env[TrustedConfigManager.ENV_ALLOW_WORLD_WRITABLE] = "1";
        expect(TrustedConfigManager.isWorldWritable(tmp)).toBe(false);
        delete process.env[TrustedConfigManager.ENV_ALLOW_WORLD_WRITABLE];
        fs.chmodSync(tmp, 0o755);
        expect(TrustedConfigManager.isWorldWritable(tmp)).toBe(false);
    });

    it.each(["app.config.json", "app.config.user.json"])("should not read a rejected %s during load or reload", async (file) => {
        const { Config } = await import("../src/Config");
        const proj = path.join(tmp, "proj");
        fs.mkdirSync(proj);
        const configPath = path.join(proj, file);
        fs.writeFileSync(configPath, JSON.stringify({ profiles: { evil: { properties: { host: "x" } } } }));
        jest.spyOn(TrustedConfigManager, "isWorldWritable").mockImplementation((dir) => dir === proj);
        const readSpy = jest.spyOn(fs, "readFileSync");
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
        expect(readSpy.mock.calls.some(([filePath]) => filePath === configPath)).toBe(false);
    });

    it("should preserve default paths for missing project config files", async () => {
        const { Config } = await import("../src/Config");
        const proj = path.join(tmp, "proj");
        fs.mkdirSync(proj);
        const config = await Config.load("app", { homeDir: cliHome, projectDir: proj });
        expect(config.findLayer(false, false).path).toBe(path.join(proj, "app.config.json"));
        expect(config.findLayer(true, false).path).toBe(path.join(proj, "app.config.user.json"));
        expect(config.properties).toEqual(Config.empty());
    });

    it("should continue searching for trusted config after rejecting a project config", async () => {
        const { Config } = await import("../src/Config");
        const proj = path.join(tmp, "proj");
        fs.mkdirSync(proj);
        fs.writeFileSync(path.join(proj, "app.config.json"), JSON.stringify({ profiles: { evil: {} } }));
        fs.writeFileSync(path.join(tmp, "app.config.json"), JSON.stringify({ profiles: { trusted: {} } }));
        jest.spyOn(TrustedConfigManager, "isWorldWritable").mockImplementation((dir) => dir === proj);
        const config = await Config.load("app", { homeDir: cliHome, projectDir: proj, trustPromptFn: () => true });
        expect(config.findLayer(false, false).path).toBe(path.join(tmp, "app.config.json"));
        expect(config.properties.profiles).toEqual({ trusted: {} });
    });

    it("should skip untrusted project config during Config.load", async () => {
        const { Config } = await import("../src/Config");
        const proj = path.join(tmp, "proj");
        const sub = path.join(proj, "sub");
        fs.mkdirSync(sub, { recursive: true });
        fs.writeFileSync(path.join(proj, "app.config.json"), JSON.stringify({ profiles: { evil: { properties: { host: "x" } } } }));
        const load = (extra = {}) => Config.load("app", { homeDir: cliHome, projectDir: sub, ...extra });
        const untrusted = await load();
        expect(untrusted.layerActive().path).not.toBe(path.join(proj, "app.config.json"));
        expect(untrusted.properties.profiles).toEqual({});
        const trusted = await load({ trustPromptFn: () => true });
        expect(trusted.layerActive().path).toBe(path.join(proj, "app.config.json"));
        expect(trusted.properties.profiles.evil).toBeDefined();
    });
});
