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
import { join } from "path";

describe("AbstractPluginLifeCycle", () => {
    it("should have the right class definition", () => {
        const absLifeCycleClass: string = fs.readFileSync(
            join(__dirname, "../../src/plugins/AbstractPluginLifeCycle.ts"),
            "utf8"
        );
        expect(absLifeCycleClass).toContain("export abstract class AbstractPluginLifeCycle");
        expect(absLifeCycleClass).toContain("public abstract postInstall(): Promise<void> | void;");
        expect(absLifeCycleClass).toContain("public abstract preUninstall(): Promise<void> | void;");
    });
});
