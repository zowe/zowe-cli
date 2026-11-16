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
