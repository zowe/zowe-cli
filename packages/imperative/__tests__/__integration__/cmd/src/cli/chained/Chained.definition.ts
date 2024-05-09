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

import { ICommandDefinition } from "../../../../../../lib/cmd";

const THREE_AHEAD = 3;
const FIVE_AHEAD = 5;
const definition: ICommandDefinition = {
    name: "chained",
    description: "chained handler test commands",
    type: "group",
    children: [
        {
            name: "print-animals",
            description: "print three animal names",
            type: "command",
            chainedHandlers: [
                {
                    handler: __dirname + "/handlers/PrintAardvark.handler"
                },
                {
                    handler: __dirname + "/handlers/PrintBonobo.handler"
                },
                {
                    handler: __dirname + "/handlers/PrintCheetah.handler"
                }
            ]
        },
        {
            name: "print-cheetah",
            description: "three handlers, but the first two are silent. only prints 'cheetah'",
            type: "command",
            chainedHandlers: [
                {
                    handler: __dirname + "/handlers/PrintAardvark.handler",
                    silent: true
                },
                {
                    handler: __dirname + "/handlers/PrintBonobo.handler",
                    silent: true
                },
                {
                    handler: __dirname + "/handlers/PrintCheetah.handler"
                }
            ]
        },
        {
            name: "fail-response-mapping",
            description: "try to map a non-existent response field, not optional - fail",
            type: "command",
            chainedHandlers: [
                {
                    handler: __dirname + "/handlers/PrintAardvark.handler",
                    mapping: [{
                        from: "this.field.does.not.exist",
                        to: "string",
                    }]
                },
                {
                    handler: __dirname + "/handlers/PrintStringArg.handler",
                },
            ]
        },
        {
            name: "optional-response-mapping",
            description: "try to map a non-existent response field, optional - succeed",
            type: "command",
            chainedHandlers: [
                {
                    handler: __dirname + "/handlers/PrintAardvark.handler",
                    mapping: [{
                        from: "this.field.does.not.exist",
                        to: "string",
                        optional: true
                    }]
                },
                {
                    handler: __dirname + "/handlers/PrintStringArg.handler",
                },
            ]
        },
        {
            name: "many-handlers",
            description: "many handlers with argument mappings",
            type: "command",
            options: [{
                name: "main-option",
                type: "string",
                description: "the main option to use when testing mapping to future arguments"
            }],
            chainedHandlers: [
                {
                    handler: __dirname + "/handlers/PrintStringArg.handler",
                    mapping: [
                        {
                            from: "mainOption", // map the value from --main-option to --string
                            to: "string",
                            mapFromArguments: true,
                            applyToHandlers: [0] // apply to this handler
                        }
                    ],
                },
                {
                    handler: __dirname + "/handlers/SetObj.handler",
                    mapping: [{
                        from: "my.field",
                        to: "string",
                        applyToHandlers: [THREE_AHEAD, FIVE_AHEAD]
                    }]
                },
                {
                    handler: __dirname + "/handlers/PrintBonobo.handler"
                },
                {
                    handler: __dirname + "/handlers/PrintBonobo.handler"
                },
                {
                    handler: __dirname + "/handlers/PrintStringArg.handler"
                },
                {
                    handler: __dirname + "/handlers/PrintBonobo.handler"
                },
                {
                    handler: __dirname + "/handlers/PrintStringArgInCaps.handler"
                }

            ]
        },
        {
            name: "mapping-notexist",
            description: "try to map a non-existent response field, optional - succeed",
            type: "command",
            chainedHandlers: [
                {
                    handler: __dirname + "/handlers/FieldNotexist.handler",
                    mapping: [{
                        from: "this.field.does.exist",
                        to: "somestring",
                        optional: true
                    }]
                },
                {
                    handler: __dirname + "/handlers/PrintStringArg.handler",
                },
            ]
        },
        {
            name: "handler-chain-failure",
            description: "a handler mid-chain throws an error",
            type: "command",
            chainedHandlers: [
                {
                    handler: __dirname + "/handlers/PrintAardvark.handler",
                    mapping: [{
                        from: "this.field.does.exist",
                        to: "somestring",
                        optional: true
                    }]
                },
                {
                    handler: __dirname + "/handlers/ThrowErrorHandler.handler",
                },
                {
                    handler: __dirname + "/handlers/PrintBonobo.handler",
                },
                {
                    handler: __dirname + "/handlers/PrintCheetah.handler",
                },
            ]
        }
    ]
}
;

export = definition;
