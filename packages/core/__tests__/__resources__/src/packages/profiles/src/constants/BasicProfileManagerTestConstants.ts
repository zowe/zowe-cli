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

import { IImperativeConfig } from "../../../../../../../src/imperative";
import * as TestUtils from "../../../../TestUtil";
import { ICommandProfileTypeConfiguration } from "../../../../../../../src/cmd";

/**
 * Get a config and set the home directory.
 * @export
 * @param {string} home
 * @returns
 */
export function getConfig(home: string) {
    const copy = JSON.parse(JSON.stringify(SAMPLE_IMPERATIVE_CONFIG_WITH_PROFILES));
    copy.defaultHome = home;
    return copy;
}

export const PROFILE_TYPE = {
    BANANA: "banana",
    SECURE_ORANGE: "secure_orange",
    STRAWBERRY: "strawberry"
};

const bananaProfile: ICommandProfileTypeConfiguration = {
    type: PROFILE_TYPE.BANANA,
    schema: {
        type: "object",
        title: "The Banana command profile schema",
        description: "The Banana command profile schema",
        properties: {
            age: {
                optionDefinition: {
                    description: "The age of the Banana",
                    type: "number",
                    name: "age", aliases: ["a"],
                    required: true
                },
                type: "number",
            },
        },
        required: ["age"]
    }
};

const secureOrangeProfile: ICommandProfileTypeConfiguration = {
    type: PROFILE_TYPE.SECURE_ORANGE,
    schema: {
        type: "object",
        title: "The secure_orange command profile schema",
        description: "The secure_orange command profile schema",
        properties: {
            username: {
                optionDefinition: {
                    description: "The username of the secure_orange",
                    type: "string",
                    name: "username",
                },
                type: "string",
            },
            password: {
                optionDefinition: {
                    description: "The password of the secure_orange",
                    type: "string",
                    name: "password",
                },
                type: "string",
            },
        },
        required: []
    }
};

const strawberryProfile: ICommandProfileTypeConfiguration = {
    type: PROFILE_TYPE.STRAWBERRY,
    schema: {
        type: "object",
        title: "The strawberry command profile schema",
        description: "The strawberry command profile schema",
        properties: {
            age: {
                optionDefinition: {
                    description: "The age of the strawberry",
                    type: "number",
                    name: "age", aliases: ["a"],
                    required: true
                },
                type: "number",
            },
        },
        required: ["age"]
    }
};

export const PROFILE_TYPE_CONFIGURATION: ICommandProfileTypeConfiguration[] = [
    bananaProfile,
    secureOrangeProfile,
    strawberryProfile
];

export const BANANA_AGE: number = 1000;
export const SAMPLE_IMPERATIVE_CONFIG_WITH_PROFILES: IImperativeConfig = {
    definitions: [
        {
            name: "hello",
            type: "command",
            options: [],
            description: "my command"
        }
    ],
    productDisplayName: "My product (packagejson)",
    defaultHome: TestUtils.TEST_HOME,
    rootCommandDescription: "My Product CLI",
    profiles: PROFILE_TYPE_CONFIGURATION
};
