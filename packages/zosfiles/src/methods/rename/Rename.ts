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

import { AbstractSession, ImperativeExpect, Logger, Headers } from "@zowe/imperative";
import { posix } from "path";

import { ZosmfRestClient, IHeaderContent, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IDataSet } from "../../doc/IDataSet";
import { IZosFilesOptions } from "../../doc/IZosFilesOptions";

/**
 * Class to handle renaming data sets
 */
export class Rename {
    /**
     * Rename a data set
     * @param {AbstractSession}     session                 - z/OSMF connection info
     * @param {string}              beforeDataSetName       - the name of the data set to rename
     * @param {string}              fterDataSetName         - the new name of the data set
     * @returns {Promise<IZosFilesResponse>}
     */
    public static async dataSet(
        session: AbstractSession,
        beforeDataSetName: string,
        afterDataSetName: string,
        options?: IZosFilesOptions
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toBeDefinedAndNonBlank(beforeDataSetName, "beforeDataSetName");
        ImperativeExpect.toBeDefinedAndNonBlank(afterDataSetName, "afterDataSetName");

        return this.rename(
            session,
            afterDataSetName.trim(),
            { dsn: beforeDataSetName.trim() },
            options
        );
    }

    /**
     * Rename a data set member
     * @param {AbstractSession}     session             - z/OSMF connection info
     * @param {string}              dataSetName         - the name of the data set the member belongs to
     * @param {string}              beforeMemberName    - the current name of the member
     * @param {string}              afterMemberName     - the new name of the member
     * @returns {Promise<IZosFilesResponse>}
     */
    public static async dataSetMember(
        session: AbstractSession,
        dataSetName: string,
        beforeMemberName: string,
        afterMemberName: string,
        options?: IZosFilesOptions
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toBeDefinedAndNonBlank(dataSetName, "dataSetName");
        ImperativeExpect.toBeDefinedAndNonBlank(beforeMemberName, "beforeMemberName");
        ImperativeExpect.toBeDefinedAndNonBlank(afterMemberName, "afterMemberName");

        return this.rename(
            session,
            `${dataSetName.trim()}(${afterMemberName.trim()})`,
            { dsn: dataSetName.trim(), member: beforeMemberName.trim() },
            options
        );
    }

    /**
     *
     * @param {AbstractSession}     session             - z/OSMF connection info
     * @param {string}              afterDataSetName    - The new name of the data set in the form 'dataset(member)'
     * @param {IDataSet}            beforeDataSet       - The data set you are renaming
     */
    private static async rename(
        session: AbstractSession,
        afterDataSetName: string,
        { dsn: beforeDataSetName, member: beforeMemberName }: IDataSet,
        options?: IZosFilesOptions
    ): Promise<IZosFilesResponse> {
        const endpoint: string = posix.join(
            ZosFilesConstants.RESOURCE,
            ZosFilesConstants.RES_DS_FILES,
            encodeURIComponent(afterDataSetName)
        );
        Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

        const payload: any = {
            "request": "rename",
            "from-dataset": {
                dsn: beforeDataSetName,
                member: beforeMemberName
            }
        };

        const reqHeaders: IHeaderContent[] = [
            Headers.APPLICATION_JSON,
            { [Headers.CONTENT_LENGTH]: JSON.stringify(payload).length.toString() },
            ZosmfHeaders.ACCEPT_ENCODING
        ];

        if (options && options.responseTimeout != null) {
            reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
        }

        try {
            await ZosmfRestClient.putExpectString(session, endpoint, reqHeaders, payload);
            return {
                success: true,
                commandResponse: ZosFilesMessages.dataSetRenamedSuccessfully.message
            };
        } catch(err) {
            Logger.getAppLogger().error(err);
            throw err;
        }
    }
}
