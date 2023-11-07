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

jest.mock("../../../../../src/utilities/src/ImperativeConfig");

import * as TestUtil from "../../../TestUtil";
import { BasicProfileManager } from "../../../../../../src/profiles/BasicProfileManager";
import { TestLogger } from "../../../../src/TestLogger";
import { PROFILE_TYPE, getConfig } from "../src/constants/BasicProfileManagerTestConstants";
import * as fs from "fs";

const profileDirectory = TestUtil.createUniqueTestDataDir("profile-manager-initialize");

describe("Basic Profile Manager Initialize", () => {
    it("Should allow us to initialize the environment and create a profile manager", async () => {
        const config = getConfig(profileDirectory);

        const responses = BasicProfileManager.initialize({
            configuration: config.profiles,
            profileRootDirectory: profileDirectory
        });
        try {
            // Ensure the type directories created
            const dirs = fs.readdirSync(profileDirectory);
            const profTypes = Object.keys(PROFILE_TYPE).sort().map((keyType: string): string => keyType.toLocaleLowerCase());

            expect(dirs).toEqual(profTypes);

            for (let i = 0; i < dirs.length; i++) {
                // Ensure that the directories contain the meta files
                const profDir = fs.readdirSync(profileDirectory + "/" + dirs[i]);
                expect(profDir).toEqual([profTypes[i] + "_meta.yaml"]);

                const profMeta = fs.readFileSync(profileDirectory + "/" + dirs[i] + "/" + profDir[0]).toString();
                expect(profMeta).toMatchSnapshot();
            }

            // Create a manager instance
            const manager = new BasicProfileManager({
                profileRootDirectory: profileDirectory,
                logger: TestLogger.getTestLogger(),
                type: PROFILE_TYPE.BANANA
            });
        } catch (e) {
            TestLogger.error(e);
            throw e;
        }
    });
});
