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

import { ZosmfRestClient, IHeaderContent } from "../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IDataSet } from "../../doc/IDataSet";

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
        afterDataSetName: string
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toBeDefinedAndNonBlank(beforeDataSetName, "beforeDataSetName");
        ImperativeExpect.toBeDefinedAndNonBlank(afterDataSetName, "afterDataSetName");

        return this.rename(
            session,
            afterDataSetName.trim(),
            { dataSetName: beforeDataSetName.trim() }
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
        afterMemberName: string
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toBeDefinedAndNonBlank(dataSetName, "dataSetName");
        ImperativeExpect.toBeDefinedAndNonBlank(beforeMemberName, "beforeMemberName");
        ImperativeExpect.toBeDefinedAndNonBlank(afterMemberName, "afterMemberName");

        return this.rename(
            session,
            `${dataSetName.trim()}(${afterMemberName.trim()})`,
            { dataSetName: dataSetName.trim(), memberName: beforeMemberName.trim() }
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
        { dataSetName: beforeDataSetName, memberName: beforeMemberName }: IDataSet
    ): Promise<IZosFilesResponse> {
        const endpoint: string = posix.join(
            ZosFilesConstants.RESOURCE,
            ZosFilesConstants.RES_DS_FILES,
            afterDataSetName
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
            { [Headers.CONTENT_LENGTH]: JSON.stringify(payload).length.toString() }
        ];

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
