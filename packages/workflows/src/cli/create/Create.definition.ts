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

import { ICommandDefinition } from "@brightside/imperative";
import { DataSet } from "./dataset/Dataset.definition";
import { UssFile } from "./ussfile/UssFile.definition";


/**
 * This object defines the command for the create group within zosworkflows. This is not
 * something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const CreateDefinition: ICommandDefinition = {
    name: "create",
    aliases: ["cre"],
    type: "group",
    description: "Create workflow instance in z/OSMF",
    children: [
        DataSet,
        UssFile
    ]
};
