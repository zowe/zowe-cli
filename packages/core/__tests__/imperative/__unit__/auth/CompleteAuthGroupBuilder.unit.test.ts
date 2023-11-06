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

import { CompleteAuthGroupBuilder } from "../../../../src/imperative/auth/builders/CompleteAuthGroupBuilder";
import { Logger } from "../../../../src/logger/Logger";
import { ICommandProfileAuthConfig } from "../../../../src/cmd/doc/profiles/definition/ICommandProfileAuthConfig";
import { ICommandDefinition } from "../../../../src/cmd/doc/ICommandDefinition";
import { fakeAuthConfig } from "./__data__/SampleAuthConfig";
import { IImperativeAuthGroupConfig } from "../../../../src/imperative/doc/IImperativeAuthGroupConfig";

const authConfigs: {[key: string]: ICommandProfileAuthConfig[]} = {
    base: [ fakeAuthConfig ]
};

const authGroupConfig: IImperativeAuthGroupConfig = {
    authGroup: {
        summary: "Fake auth group summary"
    },
    loginGroup: {
        summary: "Fake login group summary"
    },
    logoutGroup: {
        summary: "Fake logout group summary"
    }
};

describe("CompleteAuthGroupBuilder", () => {
    it("should create complete auth group given only an auth config object", () => {
        const cmdDef: ICommandDefinition = CompleteAuthGroupBuilder.getAuthGroup(authConfigs, Logger.getImperativeLogger());
        expect(cmdDef).toMatchSnapshot();
    });

    it("should create complete auth group given an auth config object and an auth group config object", () => {
        const cmdDef: ICommandDefinition = CompleteAuthGroupBuilder.getAuthGroup(authConfigs, Logger.getImperativeLogger(), authGroupConfig);
        expect(cmdDef).toMatchSnapshot();
    });
});
