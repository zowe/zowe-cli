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

import { ICommandDefinition, ICommandHandler, ICommandOptionDefinition } from "../../../../../../lib/index";
import StatefulHandler from "./Stateful.handler";

class BrokenHandler implements ICommandHandler {
    constructor() {
        throw new Error("Direct handler constructor failed");
    }

    public async process(): Promise<void> { /* never reached */ }
}

const options: ICommandOptionDefinition[] = [
    { name: "value", description: "Value to pass between handlers", type: "string", defaultValue: "start" },
    { name: "fail", description: "Throw an error from the handler", type: "boolean" }
];

const definition: ICommandDefinition = {
    name: "direct-handlers",
    description: "Test directly supplied handler constructors",
    type: "group",
    children: [
        {
            name: "single", description: "Invoke a direct handler", type: "command",
            handler: StatefulHandler, options
        },
        {
            name: "mixed-chain", description: "Chain direct and path handlers", type: "command", options,
            chainedHandlers: [
                { handler: StatefulHandler, mapping: [
                    { from: "value", to: "value", mapFromArguments: true, applyToHandlers: [0] },
                    { from: "fail", to: "fail", mapFromArguments: true, applyToHandlers: [0], optional: true },
                    { from: "value", to: "value" }
                ] },
                { handler: __dirname + "/Stateful.handler", mapping: [{ from: "value", to: "value" }] },
                { handler: StatefulHandler }
            ]
        },
        {
            name: "broken", description: "Fail to construct a direct handler", type: "command",
            handler: BrokenHandler
        },
        {
            name: "broken-chain", description: "Fail to construct a chained direct handler", type: "command",
            chainedHandlers: [{ handler: BrokenHandler }, { handler: StatefulHandler }]
        }
    ]
};

export = definition;
