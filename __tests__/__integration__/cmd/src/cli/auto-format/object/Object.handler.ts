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

import { ICommandHandler, IHandlerParameters } from "../../../../../../../lib";

export default class ObjectHandler implements ICommandHandler {
    public async process(params: IHandlerParameters): Promise<void> {

        // Example list
        const obj = {
            name: "banana",
            details: "very tasty",
            colors: ["yellow", "green", "black"],
            famousBananas: [
                {
                    name: "Dole",
                    details: "Great"
                },
                {
                    name: "Chiquita",
                    details: "Awesome"
                }
            ],
            otherFruits: {
                tasty: [
                    {
                        name: "strawberries",
                        details: "what a great fruit"
                    },
                    {
                        name: "blueberries",
                        details: "super tasty"
                    }
                ]
            },
            moreFruits: {
                veryTasty: {
                    name: "mulberry"
                }
            },
            specialFruits: {
                attributes: {
                    type: "rare",
                    big: true
                }
            }
        };

        params.response.format.output({
            format: "object",
            fields: ["name", "details", "colors"],
            output: obj
        });
    }
}
