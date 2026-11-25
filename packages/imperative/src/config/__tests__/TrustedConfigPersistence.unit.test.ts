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
import { AppSettings } from "../../settings/src/AppSettings";
import { JSONSettingsFilePersistence } from "../../settings/src/persistance/JSONSettingsFilePersistence";
import { ISettingsFile } from "../../settings/src/doc/ISettingsFile";
import { Logger } from "../../logger";

describe("Trusted config persistence", () => {
    let cliHome: string;
    let settingsFile: string;

    beforeEach(() => {
        cliHome = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "zowe-trust-settings-")));
        settingsFile = path.join(cliHome, "settings", "imperative.json");
        jest.spyOn(Logger.prototype, "warn").mockImplementation();
    });

    afterEach(() => {
        fs.rmSync(cliHome, { recursive: true, force: true });
        jest.restoreAllMocks();
    });

    it("preserves trust additions and removals when an existing settings instance saves other options", () => {
        const defaults: ISettingsFile = { overrides: { CredentialManager: false } };
        const persistence = new JSONSettingsFilePersistence(settingsFile);
        fs.mkdirSync(path.dirname(settingsFile));
        persistence.write(defaults);
        const settings = new AppSettings(persistence, persistence.read());
        TrustedConfigManager.add(cliHome, cliHome);
        settings.set("overrides", "CredentialManager", "plugin");
        expect(persistence.read().trustedProjectDirs).toEqual([cliHome]);
        TrustedConfigManager.remove(cliHome, cliHome);
        settings.set("overrides", "CredentialManager", false);
        expect(persistence.read().trustedProjectDirs).toEqual([]);
        expect(persistence.read().overrides.CredentialManager).toBe(false);
    });

    (process.platform === "win32" ? describe.skip : describe)("Unix allow list protection", () => {
        it("creates the allow list with mode 0600 and preserves existing permissions on read and update", () => {
            TrustedConfigManager.add(cliHome, cliHome);
            expect(fs.statSync(settingsFile).mode & 0o777).toBe(0o600);
            fs.chmodSync(settingsFile, 0o664);
            expect(TrustedConfigManager.list(cliHome)).toEqual([cliHome]);
            expect(fs.statSync(settingsFile).mode & 0o777).toBe(0o664);
            const project = path.join(cliHome, "project");
            fs.mkdirSync(project);
            TrustedConfigManager.add(cliHome, project);
            expect(fs.statSync(settingsFile).mode & 0o777).toBe(0o664);
            TrustedConfigManager.remove(cliHome, cliHome);
            expect(TrustedConfigManager.list(cliHome)).toEqual([project]);
            expect(fs.statSync(settingsFile).mode & 0o777).toBe(0o664);
        });

        it("creates AppSettings with mode 0600 and preserves existing permissions on read and write", () => {
            fs.mkdirSync(path.dirname(settingsFile));
            const persistence = new JSONSettingsFilePersistence(settingsFile);
            const settings: ISettingsFile = { overrides: { CredentialManager: false } };
            persistence.write(settings);
            expect(fs.statSync(settingsFile).mode & 0o777).toBe(0o600);
            fs.chmodSync(settingsFile, 0o664);
            expect(persistence.read()).toEqual(settings);
            expect(fs.statSync(settingsFile).mode & 0o777).toBe(0o664);
            const updated: ISettingsFile = { overrides: { CredentialManager: "plugin" } };
            persistence.write(updated);
            expect(persistence.read()).toEqual(updated);
            expect(fs.statSync(settingsFile).mode & 0o777).toBe(0o664);
        });

        it("does not read or overwrite a linked allow list", () => {
            const target = path.join(cliHome, "target.json");
            const contents = JSON.stringify({ trustedProjectDirs: [cliHome] });
            fs.writeFileSync(target, contents);
            fs.mkdirSync(path.dirname(settingsFile));
            fs.symlinkSync(target, settingsFile);
            expect(TrustedConfigManager.list(cliHome)).toEqual([]);
            expect(() => TrustedConfigManager.add(cliHome, cliHome)).toThrow("symbolic link");
            expect(fs.readFileSync(target, "utf8")).toBe(contents);
            expect(Logger.getImperativeLogger().warn).toHaveBeenCalledWith(expect.stringContaining("symbolic link"));
        });

        it("does not create the target of a dangling settings link", () => {
            const target = path.join(cliHome, "missing.json");
            fs.mkdirSync(path.dirname(settingsFile));
            fs.symlinkSync(target, settingsFile);
            expect(() => TrustedConfigManager.add(cliHome, cliHome)).toThrow("symbolic link");
            expect(fs.existsSync(target)).toBe(false);
        });
    });
});
