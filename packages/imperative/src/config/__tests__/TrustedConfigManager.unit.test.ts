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
    const savedEnv = { ...process.env };

    beforeEach(() => {
        tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "zowe-trust-")));
        cliHome = path.join(tmp, "home");
        delete process.env.CI;
        delete process.env[TrustedConfigManager.ENV_ALLOW_UNTRUSTED];
        delete process.env[TrustedConfigManager.ENV_ALLOW_WORLD_WRITABLE];
    });

    afterEach(() => {
        process.env = { ...savedEnv };
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it("should not trust an unknown directory without a prompt", () => {
        expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).toBe(false);
    });

    it("should trust cwd, start dir and home subdirectories", () => {
        expect(TrustedConfigManager.isDirTrusted(process.cwd(), cliHome)).toBe(true);
        expect(TrustedConfigManager.isDirTrusted(tmp, cliHome, undefined, tmp)).toBe(true);
        jest.spyOn(os, "homedir").mockReturnValueOnce(tmp);
        expect(TrustedConfigManager.isDirTrusted(path.join(tmp, "a"), cliHome)).toBe(true);
    });

    it.each([["CI", "yes"], [TrustedConfigManager.ENV_ALLOW_UNTRUSTED, "true"], [TrustedConfigManager.ENV_ALLOW_UNTRUSTED, "1"]])(
        "should trust everything when %s=%s", (key, val) => {
            process.env[key] = val;
            expect(TrustedConfigManager.isDirTrusted(tmp, cliHome)).toBe(true);
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

    (process.platform === "win32" ? it.skip : it)("should skip untrusted project config during Config.load", async () => {
        const { Config } = await import("../src/Config");
        const proj = path.join(tmp, "proj");
        const sub = path.join(proj, "sub");
        fs.mkdirSync(sub, { recursive: true });
        fs.writeFileSync(path.join(proj, "app.config.json"), JSON.stringify({ profiles: { evil: { properties: { host: "x" } } } }));
        const load = (extra = {}) => Config.load("app", { homeDir: cliHome, projectDir: sub, noLoad: true, ...extra });
        // Start directory itself is trusted, but parent holding the config is not
        expect((await load()).layerActive().path).not.toBe(path.join(proj, "app.config.json"));
        expect((await load({ trustPromptFn: () => true })).layerActive().path).toBe(path.join(proj, "app.config.json"));
    });
});
