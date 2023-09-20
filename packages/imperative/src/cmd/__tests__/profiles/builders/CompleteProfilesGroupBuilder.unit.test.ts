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

import { deleteHandlerPaths, testBuilderProfiles } from "./ProfileBuilderTestConstants";
import { TestLogger } from "../../../../../__tests__/TestLogger";
import { CompleteProfilesGroupBuilder } from "../../../../imperative/src/profiles/builders/CompleteProfilesGroupBuilder";

describe("Complete Profiles Group Builder", () => {
    const logger = TestLogger.getTestLogger();
    it("should provide a valid command definition for the " +
        "complete auto generated profile group if passed a valid " +
        "profile configuration document", () => {
        let commands = CompleteProfilesGroupBuilder.getProfileGroup(testBuilderProfiles, logger);
        commands = deleteHandlerPaths(commands);
        expect(commands).toMatchSnapshot();
    });
});
