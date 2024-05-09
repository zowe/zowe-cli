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

export default class TableHandler implements ICommandHandler {
    public async process(params: IHandlerParameters): Promise<void> {

        // Example table array
        const tasty = [
            {
                name: "strawberries",
                details: "what a great fruit",
                attributes: {
                    amount: 1000
                }
            },
            {
                name: "blueberries",
                details: "super tasty",
                attributes: {
                    amount: 10
                }
            },
            {
                name: "banana",
                details: "amazing!",
                attributes: {
                    amount: 1
                }
            }
        ];

        params.response.format.output({
            format: "table",
            header: true,
            output: tasty
        });
    }
}
