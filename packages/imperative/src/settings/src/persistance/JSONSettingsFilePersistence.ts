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

import { ISettingsFile } from "../doc/ISettingsFile";
import { readFileSync, writeFileSync } from "jsonfile";
import { ISettingsFilePersistence } from "./ISettingsFilePersistence";
import { lstatSync } from "fs";

export class JSONSettingsFilePersistence implements ISettingsFilePersistence {
    private static readonly PRIVATE_MODE = 0o600;
    /** Check that an existing Unix settings path is a regular file. @internal */
    public static checkSettingsFile(file: string): void {
        if (process.platform !== "win32") {
            let stat: ReturnType<typeof lstatSync>;
            try {
                stat = lstatSync(file);
            } catch (err) {
                if (err.code === "ENOENT") return;
                throw err;
            }
            if (!stat.isFile()) {
                throw new Error(`Settings file '${file}' must be a regular file, not a symbolic link`);
            }
        }
    }

    private readonly path: string;

    constructor(private readonly settingsFile: string) {
        this.path = settingsFile;
    }

    public read(): ISettingsFile {
        JSONSettingsFilePersistence.checkSettingsFile(this.path);
        return readFileSync(this.path);
    }

    public write(settings: ISettingsFile): void {
        JSONSettingsFilePersistence.checkSettingsFile(this.path);
        // The mode applies only when the write creates the file.
        writeFileSync(this.path, settings, {
            spaces: 2,
            mode: JSONSettingsFilePersistence.PRIVATE_MODE
        });
    }
}
