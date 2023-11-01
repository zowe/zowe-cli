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

import { Config } from "../Config";
import { IConfigLayer } from "./IConfigLayer";

export interface IConfigSchema {
    $schema: string;
    $version: string;
    type: string;
    description: string;
    properties: { [key: string]: any };
}

export interface IConfigSchemaInfo {
    original: string;
    resolved: string;
    local: boolean;
}

export interface IConfigUpdateSchemaPaths {
    [key: string]: {
        schema: string,
        updated: boolean,
    };
}

export interface IConfigUpdateSchemaOptions {
    layer?: 'active' | 'global' | 'all';
    schema?: IConfigSchema;
    depth?: number;
}

export interface IConfigUpdateSchemaHelperOptions {
    layer: IConfigLayer;
    config: Config;
    updatedPaths: IConfigUpdateSchemaPaths;
    updateOptions: IConfigUpdateSchemaOptions;
}
