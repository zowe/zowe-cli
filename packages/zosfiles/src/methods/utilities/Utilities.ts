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

import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { AbstractSession, ImperativeExpect, Headers } from "@zowe/imperative";
import { Tag } from "./doc/Tag";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosmfRestClient, IHeaderContent } from "@zowe/core-for-zowe-sdk";
import * as path from "path";

export class Utilities {
    /**
     * Retrieve various details from USS file functions
     *
     * This function uses a JSON payload to retrieve information via zosmf utilities function
     *
     * @param {AbstractSession} session     - z/OSMF connection info
     * @param {string}          USSFileName - contains the file name
     * @param {JSON}            payload     - contains the options to be sent
     *
     * @returns {Promise<Buffer>} Promise that resolves to json information
     *
     * @throws {ImperativeError}
     */
    public static async putUSSPayload(session: AbstractSession, USSFileName: string, payload: any): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(USSFileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(USSFileName, "", ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeNullOrUndefined(payload, ZosFilesMessages.missingPayload.message);
        ImperativeExpect.toNotBeEqual(payload, {}, ZosFilesMessages.missingPayload.message);
        USSFileName = path.posix.normalize(USSFileName);
        // Get a proper destination for the file to be downloaded
        // If the "file" is not provided, we create a folder structure similar to the uss file structure
        if (USSFileName.substr(0, 1) === "/") {
            USSFileName = USSFileName.substr(1);
        }
        USSFileName = encodeURIComponent(USSFileName);

        const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, USSFileName);
        const reqHeaders: IHeaderContent[] = [Headers.APPLICATION_JSON, { [Headers.CONTENT_LENGTH] : JSON.stringify(payload).length.toString() }];
        const response: any = await ZosmfRestClient.putExpectBuffer(session, endpoint, reqHeaders, payload);
        return response;
    }

    /**
     * Changes the tag attributes associate with a file using function chtag
     *
     * This function uses a JSON payload to set the  information via zosmf utilities function
     *
     * @param {AbstractSession} session     - z/OSMF connection info
     * @param {Tag}             type - enum of chtag type of Test, Binary or Mixed
     * @param {string}          codeset - optional string describing codeset e.g. IBM-1047
     *
     * @returns {IZosFilesResponse>} Promise that resolves to response object
     *
     * @throws {ImperativeError}
     */
    public static async chtag(session: AbstractSession, ussFileName: string, type: Tag, codeset?: string): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(ussFileName,ZosFilesMessages.missingUSSFileName.message);

        if (type === Tag.BINARY) {
            ImperativeExpect.toBeEqual(codeset,undefined,"A codeset cannot be specified for a binary file.");
        }

        const payload = { request: "chtag", action: "set", type: type.valueOf()} as any;
        if (codeset) {
            payload.codeset = codeset;
        }
        await Utilities.putUSSPayload(session, ussFileName, payload);

        return {
            success: true,
            commandResponse: "File tagged successfully."
        };
    }

    /**
     * Based upon the files chtag value. Identify how the tagging should be interpretted when transferring the contents
     * For example an EBCDIC file would always be converted from it's EBCDIC value to the ASCII
     *
     * An ASCII file value or binary should not be converted.
     *
     * The default value if the tag is not set or in an invalid state correctly is to convert.
     *
     * @param {AbstractSession}  session      - z/OSMF connection info
     * @param {string}           USSFileName  - contains the file name
     *
     * @returns {Promise<boolean>} Promise that resolves to true if the file is binary or ASCII text or false if file
     * should likely be converted to text. Default is false which aligns with the zosmf default behavior converting
     *
     * @throws {ImperativeError}
     */
    public static async isFileTagBinOrAscii(session: AbstractSession, USSFileName: string): Promise<boolean> {
        const payload = {request:"chtag", action:"list"};
        const response = await Utilities.putUSSPayload(session, USSFileName, payload);
        const jsonObj = JSON.parse(response.toString());
        if (jsonObj.hasOwnProperty("stdout")) {
        const stdout = JSON.parse(response.toString()).stdout[0];
        // Tests if binary tag set
        return (stdout.indexOf("b ") >-1) ||
            (stdout.indexOf("UTF-") >-1 ) || (stdout.indexOf("ISO8859-")>-1 ) || (stdout.indexOf("IBM-850") >-1 );
        }
        return false;
    }

    /**
     * Re-name USS file or directory
     *
     * @param {AbstractSession} session     - z/OSMF connection info
     * @param {string}          USSFilePath - contains the current filepath
     * @param {string}          newFilePath - contains the new filepath
     *
     * @returns {Promise<Buffer>} Promise that resolves to json information
     *
     * @throws {ImperativeError}
     */
    public static async renameUSSFile(session: AbstractSession, USSFilePath: string, newFilePath: string): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(newFilePath, ZosFilesMessages.missingUSSFileName.message);
        const oldFilePath = USSFilePath.charAt(0) === "/" ? USSFilePath : "/" + USSFilePath;
        const payload = { request: "move",  from: path.posix.normalize(oldFilePath) };
        const response = await Utilities.putUSSPayload(session, newFilePath, payload);
        return response;
    }
}
