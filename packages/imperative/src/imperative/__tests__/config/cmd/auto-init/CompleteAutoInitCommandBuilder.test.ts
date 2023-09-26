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

import { CompleteAutoInitCommandBuilder } from "../../../../src/config/cmd/auto-init/builders/CompleteAutoInitCommandBuilder";
import { Logger } from "../../../../../logger";
import { ICommandDefinition } from "../../../../../cmd";
import { fakeAutoInitConfig } from "./__data__/SampleAutoInitConfig";
import { IImperativeAutoInitCommandConfig } from "../../../../src/doc/IImperativeAutoInitCommandConfig";

const autoInitCommandConfig: IImperativeAutoInitCommandConfig = {
    autoInitConfig: fakeAutoInitConfig
};

describe("CompleteAutoInitCommandBuilder", () => {
    it("should create complete auth group given only an auto init config object", () => {
        const cmdDef: ICommandDefinition = CompleteAutoInitCommandBuilder.getAutoInitCommand(autoInitCommandConfig.autoInitConfig,
            Logger.getImperativeLogger());
        expect(cmdDef).toMatchSnapshot();
    });
});
