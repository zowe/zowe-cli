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

import { ConfigManagementFacility } from "../ConfigManagementFacility";
import { UpdateImpConfig } from "../../UpdateImpConfig";

describe("ConfigManagementFacility Integration", () => {
    let addCmdGrpSpy: jest.SpyInstance;

    beforeEach(() => {
        addCmdGrpSpy = jest.spyOn(UpdateImpConfig, "addCmdGrp").mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should include export-redacted command in config group", () => {
        ConfigManagementFacility.instance.init();

        expect(addCmdGrpSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "config",
                type: "group",
                children: expect.arrayContaining([
                    expect.objectContaining({
                        name: "export-redacted",
                        aliases: ["er"]
                    })
                ])
            })
        );
    });

    it("should include all expected config commands", () => {
        ConfigManagementFacility.instance.init();

        const configGroup = addCmdGrpSpy.mock.calls[0][0];
        const commandNames = configGroup.children.map((cmd: any) => cmd.name);

        expect(commandNames).toContain("list");
        expect(commandNames).toContain("init");
        expect(commandNames).toContain("export-redacted");
        expect(commandNames).toContain("secure");
        expect(commandNames).toContain("set");
    });
});