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

import { IImperativeConfig } from "../doc/IImperativeConfig";
import { IImperativeApi } from "./doc/IImperativeApi";
import { Logger } from "../../../logger";
import { ProfileUtils } from "../../../profiles";
import { CliProfileManager } from "../../../cmd";

export class ImperativeApi {
    /**
     * index signature for accessing Imperative api via dictionary [] notation.
     */
    [key: string]: any

    /**
     * Input parameters to construct the API object
     */
    private mLog: Logger;
    private mCustomLoggerMap: { [key: string]: Logger } = {};

    constructor(private mApis: IImperativeApi, private mConfig: IImperativeConfig, private mHome: string) {
    }

    /**
     * Returns the imperative logger API object
     * @returns {Logger}: The imperative logger api object.
     */
    public get imperativeLogger(): Logger {
        return this.mApis.imperativeLogger;
    }

    /**
     * Returns an imperative app's logger API object
     * @returns {Logger}: The imperative app's logger api object.
     */
    public get appLogger(): Logger {
        return this.mApis.appLogger;
    }

    /**
     * Retrieve a named custom logger that has been configured
     * @param {string} name - the name of the custom logger
     * @returns {Logger} the configured logger, if it exists
     */
    public additionalLogger(name: string): Logger {
        return this.mCustomLoggerMap[name];
    }

    /**
     * Register a logger with the Imperative API
     * Mostly used internally in Imperative
     * @param {string} name - the name of the logger to register
     * @param {Logger} logger - the logger to store
     */
    public addAdditionalLogger(name: string, logger: Logger): void {
        this.mCustomLoggerMap[name] = logger;
    }

    /**
     * Return an instance of a profile manager for a given profile type
     * See ProfileManager.ts for more details
     * @internal
     */
    public profileManager(type: string): CliProfileManager {
        return new CliProfileManager({
            type,
            typeConfigurations: this.mConfig.profiles,
            profileRootDirectory: ProfileUtils.constructProfilesRootDirectory(this.mHome),
            logger: this.imperativeLogger,
            productDisplayName: this.mConfig.productDisplayName
        });
    }
}
