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

import { ICommandDefinition } from "../../../../../../lib/index";
import { AllowableOptionsDefinition } from "./allowable-options/AllowableOptions.definition";
import { ExampleTestDefinition } from "./example-test/ExampleTest.definition";


export const definition: ICommandDefinition = {
    name: "gen-help",
    description: "Commands to test help generator.",
    summary: "Commands to test help generator",
    type: "group",
    children: [AllowableOptionsDefinition, ExampleTestDefinition]
};

module.exports = definition;
