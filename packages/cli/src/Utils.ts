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

import { ICommandOptionDefinition, IImperativeConfig } from "@zowe/imperative";
import { Arguments } from "yargs";
import { ZosFilesOptionDefinitions } from "./zosfiles/ZosFiles.options";

/**
 * Get the Imperative config object which defines properties of the CLI.
 * This allows it to be accessed without calling Imperative.init.
 */
export function getImperativeConfig(): IImperativeConfig {
    return require("./imperative");
}

/**
 * Map command arguments to options based on their type definition, applying defaults,
 * alias mapping, and type transformations.
 *
 * Special cases:
 *  - If the option name is "like", it is skipped (the "like" value is handled separately).
 *  - For the "dsntype" option, if not provided, then the value of the "dataSetType" argument is used.
 *  - For "dirblk", the value is determined from the "dsorg" argument.
 *  - For "alcunit", an inline conversion is applied.
 *
 * @param args - The command arguments.
 * @param optionDefinitions - The option definitions from the command definition.
 * @returns A mapped options object.
 */
export function mapArgumentsToOptions<T>(
    args: Arguments,
    optionDefinitions: ICommandOptionDefinition[]
): T {
    const options = {} as T;
    // Merge command-specific options with global ZosFiles option definitions.
    const combinedDefinitions = [...optionDefinitions, ...ZosFilesOptionDefinitions];

    combinedDefinitions.forEach(optionDef => {
        const { name, type, defaultValue } = optionDef;

        // Skip the "like" option as it is handled separately.
        if (name === "like") {
            return;
        }

        let argValue: unknown;
        // For "dsntype", allow the CLI to provide "dataSetType" as an alias.
        if (name === "dsntype") {
            if (args[name] !== undefined) {
                argValue = args[name];
            } else if (args["dataSetType"] !== undefined) {
                argValue = args["dataSetType"];
            } else {
                argValue = defaultValue;
            }
        } else {
            argValue = args[name] !== undefined ? args[name] : defaultValue;
        }

        // If no value is found, skip adding this option.
        if (argValue === undefined) {
            return;
        }

        // Special handling for "dirblk": derive from dsorg.
        if (name === "dirblk") {
            const dsorg = args["dsorg"];
            options[name as keyof T] = parseInt(
                dsorg === "PO" || dsorg === "POE" ? "10" : "0",
                10
            ) as unknown as T[keyof T];
            return;
        }

        // Special handling for "alcunit": convert allocation unit values.
        if (name === "alcunit") {
            const alcMap: Record<string, string> = {
                "TRACKS": "TRK",
                "CYLINDERS": "CYL"
            };
            if (typeof argValue === "string") {
                options[name as keyof T] = (alcMap[argValue.toUpperCase()] || "TRK") as unknown as T[keyof T];
            } else {
                options[name as keyof T] = "TRK" as unknown as T[keyof T];
            }
            return;
        }

        // Apply type-based transformations.
        if (type === "number") {
            options[name as keyof T] = parseInt(argValue as string, 10) as unknown as T[keyof T];
        } else {
            options[name as keyof T] = argValue as T[keyof T];
        }
    });

    return options;
}