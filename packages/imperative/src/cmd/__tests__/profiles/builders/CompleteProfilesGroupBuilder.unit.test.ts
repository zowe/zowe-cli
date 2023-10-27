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

jest.mock("../../../../utilities/src/ImperativeConfig");

import { ImperativeConfig } from "../../../../utilities";
import { deleteHandlerPaths, testBuilderProfiles } from "./ProfileBuilderTestConstants";
import { TestLogger } from "../../../../../__tests__/src/TestLogger";
import { CompleteProfilesGroupBuilder } from "../../../../imperative/src/profiles/builders/CompleteProfilesGroupBuilder";

describe("Complete Profiles Group Builder", () => {
    const logger = TestLogger.getTestLogger();

    // pretend that we have a team config
    (ImperativeConfig.instance.config as any) = {
        exists: true,
        formMainConfigPathNm: jest.fn(() => {
            return "zowe.config.json";
        })
    };

    it("should provide a valid command definition for the " +
        "complete auto generated profile group if passed a valid " +
        "profile configuration document", () => {
        let commands = CompleteProfilesGroupBuilder.getProfileGroup(testBuilderProfiles, logger);
        commands = deleteHandlerPaths(commands);
        expect(commands).toMatchSnapshot();
    });
});
