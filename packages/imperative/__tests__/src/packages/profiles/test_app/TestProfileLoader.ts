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

import { Logger } from "../../../../../src/logger/src/Logger";
import { ProfileInfo } from "../../../../../src/config/src/ProfileInfo";
import { Log4jsConfig } from "../src/constants/ProfileInfoConstants";
import { IProfAttrs } from "../../../../../src";
import * as path from "path";

export class TestProfileLoader {
    private mProfileInfo: ProfileInfo;

    public appLogger: Logger;
    public impLogger: Logger;
    public projectDir: string = null;
    public appName = "test_app";
    constructor(projectDir: string) {
        this.projectDir = projectDir;
        this.initLogger();
        this.appLogger = Logger.getAppLogger();
        this.impLogger = Logger.getImperativeLogger();
        this.mProfileInfo = new ProfileInfo(this.appName);
    }

    public initLogger() {
        const loggerConfig = Log4jsConfig;
        for (const appenderName in loggerConfig.log4jsConfig.appenders) {
            loggerConfig.log4jsConfig.appenders[appenderName].filename = path.join(
                this.projectDir, Log4jsConfig.log4jsConfig.appenders[appenderName].filename);
        }
        Logger.initLogger(loggerConfig);
    }

    public async defaultProfile() {
        await this.mProfileInfo.readProfilesFromDisk({ projectDir: this.projectDir });
        const profile = this.mProfileInfo.getDefaultProfile(this.appName);
        return profile;
    }

    public getProperties(profile: IProfAttrs) {
        return this.mProfileInfo.mergeArgsForProfile(profile, { getSecureVals: true });
    }
}