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

/**
 * This is the structure of the input options to be supplied to ConvertV1Profiles.convert.
 */
export interface IConvertV1ProfOpts {
    // Should V1 profiles be deleted after conversion?
    deleteV1Profs: boolean;
}

/**
 * Message formatting constants. They can be ORed into IConvertMsg.msgFormat.
 * Do not combine REPORT_LINE and ERROR_LINE.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */
export class ConvertMsgFmt {
    static readonly REPORT_LINE = 0b00001;
    static readonly ERROR_LINE  = 0b00010;
    static readonly PARAGRAPH   = 0b00100;
    static readonly INDENT      = 0b01000;
}

/**
 * This is the structure of a conversion message.
 */
export class ConvertMsg {
    public msgFormat: number;  // Formatting options. A combination of ConvertMsgFmt values.
    public msgText: string;    // Message text with no formatting.

    public constructor(msgFormat: number, msgText: string) {
        this.msgFormat = msgFormat;
        this.msgText = msgText;
    }
}

/**
 * This is the structure of the result from ConvertV1Profiles.convert.
 */
export interface IConvertV1ProfResult {
    /**
     * A report of actions and any error messages are contained in msgs.
     * Each entry contains one line of text. No formatting or newlines are embedded.
     * The caller is free to format the result as desired, using the msgType as a guide.
     */
    msgs: ConvertMsg[];

    /**
     * The following two objects contain the names of converted profiles and profiles
     * that we failed to convert. By displaying the values in the 'msgs' property,
     * the caller need not use the following properties. However, should the caller
     * decide to take special action or display custom messages, the following two
     * properties provide lists of profiles that succeeded or failed in the conversion.
     */
    numProfilesFound: number;
    profilesConverted: { [key: string]: string[] };
    profilesFailed: {
        name?: string;
        type: string;
        error: Error;
    }[];
}
