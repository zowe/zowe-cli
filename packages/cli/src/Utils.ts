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
 * Map command arguments to options based on their type definition, applying defaults and type transformations.
 * Consolidates and generalizes processing originally done in
 * Copy.generateDatasetOptions and Create's generateZosmfOptions.
 *
 * @param args - The command arguments
 * @param optionDefinitions - The option definition from the handler
 * @returns A mapped options object
 */
export function mapArgumentsToOptions<T>(
    args: Arguments,
    optionDefinitions: ICommandOptionDefinition[]
): T {
    const options = {} as T;

    // Combine global options with command-specific options
    const combinedDefinitions = [...optionDefinitions, ...ZosFilesOptionDefinitions];
    combinedDefinitions.forEach((optionDef) => {
        const { name, type, defaultValue } = optionDef;

        // Check if the argument exists in the command input or use the default value
        const value = args[name] !== undefined ? args[name] : defaultValue;

        // If the value is still undefined, skip adding it to the returned options
        if (value === undefined) {
            return;
        }

        // Handle transformations for specific fields
        if (name === "dirblk") {
            const dsorg = args["dsorg"];
            options[name as keyof T] = parseInt(
                dsorg === "PO" || dsorg === "POE" ? "10" : "0"
            ) as unknown as T[keyof T];
            return;
        }
        if (name === "alcunit") {
            const alcMap: Record<string, string> = {
                "TRACKS": "TRK",
                "CYLINDERS": "CYL"
            };
            options[name as keyof T] = (alcMap[value.toUpperCase()] || "TRK") as unknown as T[keyof T];
            return;
        }

        // Type-based transformations
        if (type === "number") {
            options[name as keyof T] = parseInt(value, 10) as unknown as T[keyof T];
        } else {
            options[name as keyof T] = value as T[keyof T];
        }
    });

    return options as T;
}