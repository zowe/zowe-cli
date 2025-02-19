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

import { Arguments } from "yargs";
import { ICommandProfileTypeConfiguration } from "../../cmd/src/doc/profiles/definition/ICommandProfileTypeConfiguration";
import { IProfileSchema } from "../../profiles/src/doc/definition/IProfileSchema";
import { Censor } from "../../censor/src/Censor";

/**
 * @deprecated Use Censor
 * Logging utilities
 */
export class LoggerUtils {
    /**
     * @deprecated Use Censor.CENSOR_RESPONSE
     */
    public static readonly CENSOR_RESPONSE = Censor.CENSOR_RESPONSE;

    /**
     * @deprecated Use Censor.CENSORED_OPTIONS
     */
    public static CENSORED_OPTIONS = Censor.CENSORED_OPTIONS;

    /**
     * @deprecated Use Censor.SECURE_PROMPT_OPTIONS
     */
    public static readonly SECURE_PROMPT_OPTIONS = Censor.SECURE_PROMPT_OPTIONS;

    /**
     * Copy and censor any sensitive CLI arguments before logging/printing
     * @param {string[]} args
     * @returns {string[]}
     * @deprecated Use Censor.censorCLIArgs
     */
    public static censorCLIArgs(args: string[]): string[] {
        return Censor.censorCLIArgs(args);
    }

    /**
     * Copy and censor a yargs argument object before logging
     * @param {yargs.Arguments} args the args to censor
     * @returns {yargs.Arguments}  a censored copy of the arguments
     * @deprecated Use Censor.censorYargsArguments
     */
    public static censorYargsArguments(args: Arguments): Arguments {
        return Censor.censorYargsArguments(args);
    }

    /**
     * @deprecated use Censor.profileSchemas
     */
    public static get profileSchemas(): ICommandProfileTypeConfiguration[] {
        return Censor.profileSchemas;
    }

    /**
     * @deprecated use Censor.setProfileSchemas
     */
    public static setProfileSchemas(_schemas: Map<string, IProfileSchema>) {
        Censor.setProfileSchemas(_schemas);
    }

    /**
     * Specifies whether a given property path (e.g. "profiles.lpar1.properties.host") is a special value or not.
     * Special value: Refers to any value defined as secure in the schema definition.
     *                These values should be already masked by the application (and/or plugin) developer.
     * @param prop Property path to determine if it is a special value
     * @returns True - if the given property is to be treated as a special value; False - otherwise
     * @deprecated Use Censor.isSpecialValue
     */
    public static isSpecialValue = (prop: string): boolean => {
        return Censor.isSpecialValue(prop);
    };

    /**
     * Copy and censor any sensitive CLI arguments before logging/printing
     * @param {string} data
     * @returns {string}
     * @deprecated Use Censor.censorRawData
     */
    public static censorRawData(data: string, category: string = ""): string {
        return Censor.censorRawData(data, category);
    }
}
