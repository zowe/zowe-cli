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

import { ICommandProfileAutoInitConfig } from "../../../../../../../src/cmd/doc/profiles/definition/ICommandProfileAutoInitConfig";
import { ICommandOptionDefinition } from "../../../../../../../src/cmd";

const fakeOption: ICommandOptionDefinition = {
    name: "fake",
    description: "Fake command option",
    type: "string"
};

export const fakeAutoInitConfig: ICommandProfileAutoInitConfig = {
    handler: "fakeHandler",
    provider: "fakeProvider",
    autoInit: {
        description: "A fake description",
        summary: "A fake summary",
        examples: [
            {
                options: "fake options",
                description: "fake description"
            }
        ],
        options: [
            fakeOption
        ]
    },
    profileType: "fakeProfile"
};

export const minimalAutoInitConfig: ICommandProfileAutoInitConfig = {
    handler: "fakeHandler",
    provider: "fakeProvider"
};