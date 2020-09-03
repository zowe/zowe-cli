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

import { ICommandDefinition } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { CreateDefinition } from "./create/Create.definition";
import { DeleteDefinition } from "./delete/Delete.definition";
import { InvokeDefinition } from "./invoke/Invoke.definition";
import { DownloadDefinition } from "./download/Download.definition";
import { ListDefinition } from "./list/List.definition";
import { UploadDefinition } from "./upload/Upload.definition";
import { MountDefinition } from "./mount/Mount.definition";
import { UnmountDefinition } from "./unmount/Unmount.definition";
import { HMigrateDefinition } from "./hMigrate/HMigrate.definition";
import { HRecallDefinition } from "./hRecall/HRecall.definition";
import { CopyDefinition } from "./copy/Copy.definition";
import { RenameDefinition } from "./rename/Rename.definition";
import { ZosFilesOptionDefinitions } from "./ZosFiles.options";

/**
 * This object defines the top level command group for zosfiles. This is not
 * something that is intended to be used outside of this npm package.
 *
 * @private
 */
const definition: ICommandDefinition = {
    name: "zos-files",
    aliases: ["files"],
    type: "group",
    summary: "Manage z/OS data sets",
    description: "Manage z/OS data sets, create data sets, and more",
    children: [
        CreateDefinition,
        DeleteDefinition,
        InvokeDefinition,
        HMigrateDefinition,
        HRecallDefinition,
        DownloadDefinition,
        ListDefinition,
        UploadDefinition,
        MountDefinition,
        UnmountDefinition,
        CopyDefinition,
        RenameDefinition
    ],
    passOn: [
        {
            property: "options",
            value: [...ZosmfSession.ZOSMF_CONNECTION_OPTIONS, ...ZosFilesOptionDefinitions],
            merge: true,
            ignoreNodes: [
                {type: "group"}
            ]
        }
    ]
};

export = definition;
