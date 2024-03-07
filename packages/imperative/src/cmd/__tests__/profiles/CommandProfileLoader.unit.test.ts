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

import { CommandProfileLoader } from "../../src/profiles/CommandProfileLoader";
import { ICommandDefinition } from "../../src/doc/ICommandDefinition";
import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { CommandProfiles } from "../../src/profiles/CommandProfiles";
import { ImperativeError } from "../../../error";
import { IProfile, IProfileLoaded } from "../../../profiles";

const PROFILE_BANANA_TYPE: string = "banana";

const SAMPLE_COMMAND_NO_PROFILE: ICommandDefinition = {
    name: PROFILE_BANANA_TYPE,
    description: "The banana command",
    type: "command"
};

const SAMPLE_COMMAND_PROFILE: ICommandDefinition = {
    name: PROFILE_BANANA_TYPE,
    description: "The banana command",
    type: "command",
    profile: {
        required: [PROFILE_BANANA_TYPE]
    }
};

describe("Command Profile Loader", () => {

    it("should allow us to create an instance", () => {
        const loader = CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_NO_PROFILE,
            logger: TestLogger.getTestLogger()
        });
        expect(loader).toBeDefined();
    });

    it("should allow us to create an instance and load nothing", async () => {
        const loaded: CommandProfiles = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_NO_PROFILE,
            logger: TestLogger.getTestLogger()
        }).loadProfiles({ _: undefined as any, $0: undefined as any });
        expect(loaded).toBeDefined();
    });

    it("should allow us to create an instance without a logger", () => {
        const loader = CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_NO_PROFILE,
        });
        expect(loader).toBeDefined();
    });

    it("should allow us to create an instance (directly with constructor)", () => {
        const loader = new CommandProfileLoader(SAMPLE_COMMAND_NO_PROFILE);
        expect(loader).toBeDefined();
    });

    it("should detect a bad logger instance", () => {
        let error;
        try {
            let logger: any = TestLogger.getTestLogger();
            logger = {bad: "logger"};
            CommandProfileLoader.loader({
                commandDefinition: SAMPLE_COMMAND_NO_PROFILE,
                logger
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain('Expect Error: Could not construct the profile loader. The "logger" supplied is not of type Logger.');
    });

    it("should detect missing command definitions when creating the loader", () => {
        let error;
        try {
            CommandProfileLoader.loader({
                commandDefinition: undefined as any,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Expect Error: Could not construct the profile loader. No command definition supplied.");
    });

    it("should never read V1 profiles", async () => {
        const emptyProfileMap: Map<string, IProfile[]> = new Map<string, IProfile[]>();
        const emptyProfileMetaMap: Map<string, IProfileLoaded[]> = new Map<string, IProfileLoaded[]>();
        const noProfilesLoaded = new CommandProfiles(emptyProfileMap, emptyProfileMetaMap);

        // because we have a team config, we should load no old-scemptyProfileMaphool profiles
        const loadedCmdProfiles: CommandProfiles = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_PROFILE,
            logger: TestLogger.getTestLogger()
        }).loadProfiles({ _: undefined as any, $0: undefined as any });

        expect(loadedCmdProfiles).toEqual(noProfilesLoaded);
    });
});
