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

import { ICommandProfileAuthConfig, ICommandOptionDefinition } from "../../../../../src/cmd";

const fakeOption: ICommandOptionDefinition = {
    name: "fake",
    description: "Fake command option",
    type: "string"
};

export const fakeAuthConfig: ICommandProfileAuthConfig = {
    serviceName: "fakeService",
    handler: "fakeHandler",
    login: {
        description: "Fake login command",
        examples: [
            {
                description: "Fake login example",
                options: ""
            }
        ],
        options: [ fakeOption ]
    },
    logout: {
        description: "Fake logout command",
        examples: [
            {
                description: "Fake logout example",
                options: ""
            }
        ],
        options: [ fakeOption ]
    }
};

export const minimalAuthConfig: ICommandProfileAuthConfig = {
    serviceName: "fakeService",
    handler: "fakeHandler"
};
