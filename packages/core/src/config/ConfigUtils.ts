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

import { CredentialManagerFactory } from "../security/CredentialManagerFactory";
import { ImperativeConfig } from "../utils/ImperativeConfig";
import { ImperativeError } from "../error/ImperativeError";
import { ICommandArguments } from "../cmd";

/**
 * Coeerces string property value to a boolean or number type.
 * @param value String value
 * @param type Property type defined in the schema
 * @returns Boolean, number, or string
 */
export function coercePropValue(value: any, type?: string) {
    if (type === "boolean" || type === "number") {
        // For boolean or number, parse the string and throw on failure
        return JSON.parse(value);
    } else if (type == null) {
        // For unknown type, try to parse the string and ignore failure
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    } else {
        // For string or other type, don't do any parsing
        return value.toString();
    }
}

/**
 * Retrieves the name of the active profile for the given type. If no such
 * profile exists, returns the default name which can be used to create a new profile.
 * @param profileType The type of CLI profile
 * @param cmdArguments CLI arguments which may specify a profile
 * @param defaultProfileName Name to fall back to if profile doesn't exist. If
 *                           not specified, the profile type will be used.
 * @returns The profile name
 */
export function getActiveProfileName(profileType: string, cmdArguments?: ICommandArguments, defaultProfileName?: string): string {
    // Look for profile name first in command line arguments, second in
    // default profiles defined in config, and finally fall back to using
    // the profile type as the profile name.
    return cmdArguments?.[`${profileType}-profile`] ||
        ImperativeConfig.instance.config?.properties.defaults[profileType] ||
        defaultProfileName || profileType;
}

/**
 * Form an error message for failures to securely save a value.
 * @param solution Text that our caller can supply for a solution.
 * @returns ImperativeError to be thrown
 */
export function secureSaveError(solution?: string): ImperativeError {
    let details = CredentialManagerFactory.manager.secureErrorDetails();
    if (solution != null) {
        details = (details != null) ? (details + `\n - ${solution}`) : solution;
    }
    return new ImperativeError({
        msg: "Unable to securely save credentials.",
        additionalDetails: details
    });
}
