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
import { withDataArray } from "./with-data-array/WithDataArray.definition";
import { withDataObject } from "./with-data-object/WithDataObject.definition";
import { withLogMessagesDefinition } from "./with-log-messages/WithLogMessages.definition";
import { withErrorHeadersDefinition } from "./with-error-headers/WithErrorHeaders.definition";
import { withErrorMessagesDefinition } from "./with-error-messages/WithErrorMessages.definition";
import { withMixedResponesDefinition } from "./with-mixed-responses/WithMixedResponses.definition";
import { WithWrappedTextDefinition } from "./with-wrapped-text/WithWrappedText.definition";
import { WithSyntaxErrorsDefinition } from "./with-syntax-errors/WithSyntaxErrors.definition";

export const definition: ICommandDefinition = {
    name: "respond",
    description: "Invoke various types of handlers that will formulate different responses via console messages, data objects, etc.",
    summary: "Invoke handlers that will produce messages",
    type: "group",
    children: [withDataArray,
        withDataObject,
        withErrorHeadersDefinition,
        withErrorMessagesDefinition,
        withLogMessagesDefinition,
        withMixedResponesDefinition,
        WithWrappedTextDefinition,
        WithSyntaxErrorsDefinition],
};

module.exports = definition;
