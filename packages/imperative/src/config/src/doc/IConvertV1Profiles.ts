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

import { ProfileInfo } from "../ProfileInfo";

/**
 * This is the structure of the input options to be supplied to ConvertV1Profiles.convert.
 */
export interface IConvertV1ProfOpts {
    // Should V1 profiles be deleted after conversion?
    deleteV1Profs: boolean;

    // The ProfileInfo object that the API will use to initialize the Secure Credential Manager.
    // This property should be supplied by a VSCode application.
    profileInfo?: ProfileInfo
}

/**
 * Message formatting constants. They can be ORed into IConvertMsg.msgFormat.
 * Do not combine REPORT_LINE and ERROR_LINE.
 */
export enum ConvertMsgFmt {
    REPORT_LINE = 0b00001,
    ERROR_LINE  = 0b00010,
    PARAGRAPH   = 0b00100,
    INDENT      = 0b01000
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
     * If the old V1 Secure Credential Store plugin is currently installed, its
     * name is returned in this property. The old SCS plugin will not be used,
     * but the customer should probably uninstall it. Our caller can automatically
     * uninstall that SCS plugin, or if our caller is unable to do so, our
     * caller could inform the user that the plugin should be uninstalled.
     *
     * If the V1 SCS plugin is not installed, the property value will be null.
     */
    v1ScsPluginName: string | null;

    /**
     * This property indicates whether secure credentials were migrated during conversion.
     *
     * If the old V1 Secure Credential Store plugin was supplying the credential manager
     * override and the CredentialManager was initialized before calling this function,
     * profile conversion will not be able to migrate credentials from the old SCS plugin
     * to the current embedded Secure Credential Store.
     */
    credsWereMigrated: boolean;

    /**
     * The following properties contain information about the success or failure of
     * the conversion of V1 profiles. By displaying the values in the 'msgs' property,
     * the caller need not use the following properties. However, our caller could
     * decide to take special action or display custom messages, using the following
     * properties.
     */
    cfgFilePathNm: string;  // existing or newly-created Zowe client config file name
    numProfilesFound: number;
    profilesConverted: { [key: string]: string[] };
    profilesFailed: {
        name?: string;
        type: string;
        error: Error;
    }[];
}
