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

import { AutoInitCommandBuilder } from "../../../../src/config/cmd/auto-init/builders/AutoInitCommandBuilder";
import { Logger } from "../../../../../logger";
import { Constants } from "../../../../../constants";
import { minimalAutoInitConfig } from "./__data__/SampleAutoInitConfig";
import { ICommandDefinition } from "../../../../../cmd";

describe("AutoInitCommandBuilder", () => {
    it("should build command successfully if valid auto init config supplied with buildFull", () => {
        const builder = new AutoInitCommandBuilder(Logger.getImperativeLogger(), minimalAutoInitConfig, "base");
        expect(builder.getAction()).toBe(Constants.AUTO_INIT_ACTION);

        const cmdDef: ICommandDefinition = builder.buildFull();
        expect(cmdDef).toBeDefined();
        expect(cmdDef.name).toBe("auto-init");
    });

    it("should build command successfully if valid auto init config supplied with build", () => {
        const builder = new AutoInitCommandBuilder(Logger.getImperativeLogger(), minimalAutoInitConfig, "base");
        expect(builder.getAction()).toBe(Constants.AUTO_INIT_ACTION);

        const cmdDef: ICommandDefinition = builder.build();
        expect(cmdDef).toBeDefined();
        expect(cmdDef.name).toBe("auto-init");
    });

    it("should fail to initialize if missing auto init config", () => {
        let caughtError;
        try {
            new AutoInitCommandBuilder(Logger.getImperativeLogger(), null, "base");
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain("No auto-init config was supplied.");
    });
});
