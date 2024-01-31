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

import { AuthLoginCommandBuilder } from "../../../src/imperative/auth/builders/AuthLoginCommandBuilder";
import { Logger } from "../../../src/logger";
import { Constants } from "../../../src/constants";
import { minimalAuthConfig } from "./__data__/SampleAuthConfig";
import { ICommandDefinition } from "../../../src/cmd";


describe("AuthLoginCommandBuilder", () => {
    it("should build command successfully if valid auth config supplied", () => {
        const builder = new AuthLoginCommandBuilder("base", Logger.getImperativeLogger(), minimalAuthConfig);
        expect(builder.getAction()).toBe(Constants.LOGIN_ACTION);

        const cmdDef: ICommandDefinition = builder.buildFull();
        expect(cmdDef).toBeDefined();
        expect(cmdDef.name).toBe(minimalAuthConfig.serviceName);
    });

    it("should fail to initialize if missing auth config", () => {
        let caughtError;
        try {
            const builder = new AuthLoginCommandBuilder("base", Logger.getImperativeLogger(), null);
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain("No auth config was supplied.");
    });
});
