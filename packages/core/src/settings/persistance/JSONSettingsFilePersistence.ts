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

import { readFileSync, writeFileSync } from "jsonfile";

import { ISettingsFile } from "../doc/ISettingsFile";
import { ISettingsFilePersistence } from "./ISettingsFilePersistence";

export class JSONSettingsFilePersistence implements ISettingsFilePersistence {
    private readonly path: string;

    constructor(private readonly settingsFile: string) {
        this.path = settingsFile;
    }

    public read(): ISettingsFile {
        return readFileSync(this.path);
    }

    public write(settings: ISettingsFile): void {
        writeFileSync(this.path, settings, {
            spaces: 2
        });
    }
}
