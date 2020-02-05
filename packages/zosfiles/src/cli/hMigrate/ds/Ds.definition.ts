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

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings);
const dSStrings = strings.HMIGRATE.ACTIONS.DATA_SET;

export const DsDefinition: ICommandDefinition = {
  name: "data-set",
  aliases: ["ds"],
  description: dSStrings.DESCRIPTION,
  type: "command",
  handler: __dirname + "/Ds.handler",
  profile: {
    optional: ["zosmf"]
  },
  positionals: [
    {
      name: "dataSetName",
      type: "string",
      description: dSStrings.POSITIONALS.DATASETNAME,
      required: true
    }
  ],
  options: [
    {
      name: "wait",
      aliases: ["w"],
      description: strings.HMIGRATE.OPTIONS.WAIT,
      type: "boolean",
      required: false
    }
  ],
  examples: [
    {
      description: dSStrings.EXAMPLES.EX1,
      options: `"USER.DATA.SET"`
    }
  ]
};
