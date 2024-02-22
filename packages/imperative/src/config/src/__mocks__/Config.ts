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

import { IConfigOpts, IConfigSchemaInfo } from "../..";
import { IConfigLayer } from "../../src/doc/IConfigLayer";

export class Config {
    private mLayers: IConfigLayer[];

    public get layers(): IConfigLayer[] {
        // return JSONC.parse(JSONC.stringify(this.mLayers, null, ConfigConstants.INDENT));
        return this.mLayers;
    }

    public get api() {
        return {
            // profiles: new ConfigProfiles(this),
            plugins: {
                get: () => [] as any
            },
            // layers: new ConfigLayers(this),
            // secure: new ConfigSecure(this)
        };
    }

    constructor(opts?: IConfigOpts) {
        /* Do nothing */
    }

    public static load(app: string, opts?: IConfigOpts) {
        opts = opts ?? {};

        const config = new Config(opts);

        config.mLayers = [{
            path: "-----------------------test-layer-----------------------",
            exists: true,
            properties: {
                profiles: {},
                defaults: {}
            },
            global: true,
            user: false
        }];

        return config;
    }

    public getSchemaInfo(): IConfigSchemaInfo {
        return {
            local: true,
            resolved: "/some/path/to/schema.json",
            original: "/some/path/to/schema.json"
        };
    }
}