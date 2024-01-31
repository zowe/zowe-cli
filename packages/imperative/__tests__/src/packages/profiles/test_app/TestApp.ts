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

import { TestProfileLoader } from "./TestProfileLoader";
import { TestAppImperativeConfig } from "../src/constants/ProfileInfoConstants";
import { Logger } from "../../../../../src/logger/Logger";
import * as path from "path";

/* Logic from the now-removed BasicProfileManager.initialize() function. We never create
 * the old v1 profile structure in the product, but we might for tests. In V3, we maintain
 * the ability to read V1 profiles for the purpose of converting them to a team config.
 */
const setupOldProfiles = async (projectDir: string) => {
    const parms: any = {
        configuration: TestAppImperativeConfig.profiles,
        profileRootDirectory: path.join(projectDir, "profiles"),
    };

    // Create the profile root directory (if necessary)
    ProfileIO.createProfileDirs(parms.profileRootDirectory);

    // Iterate through the types and create this types configuration document - create a new instance of the
    // Manager to create the other types
    const responses: any[] = [];
    for(const config of parms.configuration) {

        // Construct the profile type directory
        const profileTypeRootDir = parms.profileRootDirectory + "/" + config.type + "/";
        ProfileIO.createProfileDirs(profileTypeRootDir);

        // Meta file path and name
        const metaFilePath = profileTypeRootDir + config.type
            + AbstractProfileManager.META_FILE_SUFFIX + AbstractProfileManager.PROFILE_EXTENSION;

        // Construct the default meta file
        const defaultMetaFile: IMetaProfile<IProfileTypeConfiguration> = {
            defaultProfile: undefined,
            configuration: config
        };

        // If the directory doesn't exist, create it and the default meta file for this type
        // If the directory exists and re-init was specified, write out the default meta file
        // If it exists and re-init was not specified, leave it alone
        if (!ProfileIO.exists(metaFilePath)) {
            ProfileIO.writeMetaFile(defaultMetaFile, metaFilePath);
            responses.push({
                message: `Profile environment initialized for type "${config.type}".`
            });
        } else if (parms.reinitialize) {
            ProfileIO.writeMetaFile(defaultMetaFile, metaFilePath);
            responses.push({
                message: `Profile environment re-initialized for type "${config.type}".`
            });
        }
    }

    return responses;
};

const log = (logger: Logger, msg: string, ...args: any) => {
    const loggerFunctions: string[] = ["trace", "debug", "simple", "info", "warn", "error", "fatal"];
    for (const fName of loggerFunctions) {
        (logger[fName as keyof Logger] as any)(msg, ...args);
    }
};

/**
 * Test application for integration test purposes.
 * This test application focuses on the ProfileInfo API usage.
 * node --require "ts-node/register" <rootDir>/__tests__/src/packages/profiles/test_app/TestApp.ts <TestEnvironment.workingDir>
 * node --require "ts-node/register" /root/gh/zowe/imperative/__tests__/src/packages/profiles/test_app/TestApp.ts /root/gh/test/del/del2
 */
(async (args: string[]) => {
    const projectDir = args[2];

    // Just in case we want to write integration tests for ProfileInfo APIs for OLD profiles
    await setupOldProfiles(projectDir);

    const loader = new TestProfileLoader(projectDir);

    const profile = await loader.defaultProfile();
    log(loader.appLogger, "default profile:", profile);
    log(loader.impLogger, "default profile:", profile);

    const mergedArgs = loader.getProperties(profile);
    log(loader.appLogger, "merged args:", mergedArgs);
    log(loader.impLogger, "merged args:", mergedArgs);

    // eslint-disable-next-line no-console
    console.log("Done!\nPlease check the logs at:", projectDir + "/logs");
})(process.argv);
