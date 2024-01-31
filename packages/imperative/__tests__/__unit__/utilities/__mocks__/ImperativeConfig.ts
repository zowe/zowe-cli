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


// eslint-disable-next-line jest/no-mocks-import
import { Config } from "../../config/__mocks__/Config.ts";
import { IImperativeConfig } from "../../../../src/imperative/doc/IImperativeConfig";

export class ImperativeConfig {
    private static mInstance: ImperativeConfig = null;

    private mConfig: Config = new Config();

    private mLoadedConfig: IImperativeConfig = {
        name: "test-cli",
        allowConfigGroup: false,
        allowPlugins: false,
        overrides: {
            CredentialManager: "some-string.ts"
        },
        experimentalCommandDescription: "The quick brown fox jumped over the lazy dog!"
    };

    // Private so that tests can access and change the result of the get
    private mHostPackageName = "host-package";

    // Private so that tests can access and change the result of the get
    private mImperativePackageName = "@zowe/imperative";

    public static get instance(): ImperativeConfig {
        if (this.mInstance == null) {
            this.mInstance = new ImperativeConfig();
        }

        return this.mInstance;
    }

    public get callerPackageJson(): any {
        return {version: 10000, name: "sample"};
    }

    public get cliHome(): string {
        return "/home";
    }

    public get config(): Config {
        return this.mConfig;
    }

    public set config(c: Config) {
        this.mConfig = c;
    }

    public findPackageBinName(): string {
        return "MockCmdNameFromPkgBin";
    }

    public get loadedConfig(): IImperativeConfig {
        return this.mLoadedConfig;
    }

    public set loadedConfig(config: IImperativeConfig) {
        this.mLoadedConfig = config;
    }

    public get hostPackageName(): string {
        return this.mHostPackageName;
    }

    public get imperativePackageName(): string {
        return this.mImperativePackageName;
    }

    public get envVariablePrefix(): string {
        return this.loadedConfig.envVariablePrefix == null ? this.loadedConfig.name : this.loadedConfig.envVariablePrefix;
    }
}
