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
import { BinaryPDSDefinition } from "./binaryPds/BinaryPDS.definition";
import { ClassicPDSDefinition } from "./classicPds/ClassicPDS.definition";
import { CPDSDefinition } from "./cPds/CPDS.definition";
import { PdsDefinition } from "./pds/Pds.definition";
import { PsDefinition } from "./ps/Ps.definition";
import { VsamDefinition } from "./vsam/vsam.definition";
import { ZfsDefinition } from "./zfs/zfs.definition";
import { UssDefinition } from "./uss/uss.definition";

import i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).CREATE;

/**
 * Create group definition containing its description and children
 * @type {ICommandDefinition}
 */
export const CreateDefinition: ICommandDefinition = {
    name: "create",
    aliases: ["cre"],
    type: "group",
    description: strings.DESCRIPTION,
    children: [PsDefinition,
        PdsDefinition,
        BinaryPDSDefinition,
        CPDSDefinition,
        ClassicPDSDefinition,
        VsamDefinition,
        ZfsDefinition,
        UssDefinition
    ]
};
