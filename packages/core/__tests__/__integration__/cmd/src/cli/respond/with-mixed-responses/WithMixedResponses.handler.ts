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

import { ICommandHandler, IHandlerParameters } from "../../../../../../../lib/index";

export default class WithMixedResponses implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters): Promise<void> {
        // Data object
        commandParameters.response.data.setMessage(commandParameters.arguments.messageForResponse);
        commandParameters.response.data.setObj(JSON.parse(commandParameters.arguments.dataObject));

        // Log Messages
        commandParameters.response.console.log("Log Format String: " + commandParameters.arguments.logFormatString);
        commandParameters.response.console.log("Log Values Array: " + commandParameters.arguments.logFormatValues);
        commandParameters.response.console.log("Log Formatted:");
        commandParameters.response.console.log(commandParameters.arguments.logFormatString,
            ...commandParameters.arguments.logFormatValues);

        // Error Messages
        commandParameters.response.console.error("Error Format String: " + commandParameters.arguments.errorFormatString);
        commandParameters.response.console.error("Error Values Array: " + commandParameters.arguments.errorFormatValues);
        commandParameters.response.console.error("Error Formatted:");
        commandParameters.response.console.error(commandParameters.arguments.errorFormatString,
            ...commandParameters.arguments.errorFormatValues);
    }
}
