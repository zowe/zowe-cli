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

import { Session, AbstractSession, ImperativeExpect, Logger, Headers, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { posix } from "path";

import { Create, CreateDataSetTypeEnum, ICreateDataSetOptions } from "../create";
import { Get } from "../get";
import { Upload } from "../upload";
import { List } from "../list";
import { IGetOptions } from "../get/doc/IGetOptions";
import { ZosmfRestClient, ZosmfHeaders, IHeaderContent } from "@zowe/core-for-zowe-sdk";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IZosmfListResponse } from "../list/doc/IZosmfListResponse";
import { IDataSet } from "../../doc/IDataSet";
import { ICopyDatasetOptions } from "./doc/ICopyDatasetOptions";
import { ICrossLparCopyDatasetOptions } from "./doc/ICrossLparCopyDatasetOptions";
/**
 * This class holds helper functions that are used to copy the contents of datasets through the
 * z/OSMF APIs.
 */
export class Copy {
    /**
     * Copy the contents of a dataset
     *
     * @param {AbstractSession}   session        - z/OSMF connection info
     * @param {IDataSet}          toDataSet      - The data set to copy to
     * @param {IDataSetOptions}   options        - Options
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the status of the copying
     *
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     * @see https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.1.0/com.ibm.zos.v2r1.izua700/IZUHPINFO_API_PutDataSetMemberUtilities.htm
     */
    public static async dataSet(
        session: AbstractSession,
        { dsn: toDataSetName, member: toMemberName }: IDataSet,
        options: ICopyDatasetOptions
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toBeDefinedAndNonBlank(options["from-dataset"].dsn, "fromDataSetName");
        ImperativeExpect.toBeDefinedAndNonBlank(toDataSetName, "toDataSetName");

        const endpoint: string = posix.join(
            ZosFilesConstants.RESOURCE,
            ZosFilesConstants.RES_DS_FILES,
            toMemberName == null ? toDataSetName : `${toDataSetName}(${toMemberName})`
        );
        Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

        const payload: any = {
            "request": "copy",
            "from-dataset": {
                dsn: options["from-dataset"].dsn,
                member: options["from-dataset"].member
            },
            ...options
        };
        delete payload.fromDataSet;

        const reqHeaders: IHeaderContent[] = [
            Headers.APPLICATION_JSON,
            { [Headers.CONTENT_LENGTH]: JSON.stringify(payload).length.toString() },
            ZosmfHeaders.ACCEPT_ENCODING
        ];

        if (options.responseTimeout != null) {
            reqHeaders.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
        }

        try {
            await ZosmfRestClient.putExpectString(session, endpoint, reqHeaders, payload);

            return {
                success: true,
                commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }


    /**
     * Copy the contents of a dataset from one LPAR to another LPAR
     *
     * @param {AbstractSession}                 sourceSession  - Source z/OSMF connection info
     * @param {IDataSet}                        toDataSet      - The data set to copy to
     * @param {ICrossLparCopyDatasetOptions}    targetOptions  - Options for target file and connection
     * @param {IGetOptions}                     sourceOptions  - Options for source file
     * @param {IDataSetOptions}                 options        - Common options
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the status of the copying
     *
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     */
    public static async dataSetCrossLPAR(
        sourceSession: AbstractSession,
        { dsn: toDataSetName, member: toMemberName }: IDataSet,
        targetOptions: ICrossLparCopyDatasetOptions,
        sourceOptions: IGetOptions,
        options: ICopyDatasetOptions
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toBeDefinedAndNonBlank(options["from-dataset"].dsn, "fromDataSetName");
        ImperativeExpect.toBeDefinedAndNonBlank(toDataSetName, "toDataSetName");

        try {
            /*const task: ITaskWithStatus = {
                percentComplete: 0,
                statusMessage: "Retrieving data set info",
                stageName: TaskStage.IN_PROGRESS
            };*/

            const sourceDataset = options["from-dataset"].dsn;
            let   sourceDataSetObj: IZosmfListResponse;
            const targetDataset = toDataSetName;
            let targetDataSetObj: IZosmfListResponse;
            let targetFound: boolean = false;
            let targetSession;

            if(targetOptions.targetHost != undefined){
                targetSession = new Session({
                    user: targetOptions.targetUser,
                    password: targetOptions.targetPassword,
                    hostname: targetOptions.targetHost,
                    port: targetOptions.targetPort,
                    type: "basic",
                    rejectUnauthorized: false
                });
            }
            // TODO: Add team config definition support

            /**
             *  Does the target dataset exist?
             */
            const SourceDsList = await List.dataSet(sourceSession,
                sourceDataset, {
                    attributes: true, maxLength: 1,
                    start: sourceDataset,
                    recall: "wait"
                });

            if (SourceDsList.apiResponse != null &&
                SourceDsList.apiResponse.returnedRows != null
                && SourceDsList.apiResponse.items != null) {
                // Look for the index of the data set in the response from the List API
                const dsnameIndex = SourceDsList.apiResponse.returnedRows === 0 ? -1 :
                    SourceDsList.apiResponse.items.findIndex((ds: any) => ds.dsname.toUpperCase() === sourceDataset.toUpperCase());
                if (dsnameIndex !== -1) {
                    // If dsnameIndex === -1, it means we could not find the given data set.
                    // We will attempt the upload anyways so that we can forward/throw the proper error from z/OS MF
                    sourceDataSetObj = SourceDsList.apiResponse.items[dsnameIndex];
                }
            }
            // TODO: Add check for replace or check for the replace flag

            const task2: ITaskWithStatus = {
                percentComplete: 0,
                statusMessage: "Retrieving data set contents",
                stageName: TaskStage.IN_PROGRESS
            };

            /**
             *  Get the dataset and store it in a buffer
             */
            const dsContentBuf = await Get.dataSet(sourceSession, sourceDataset,
                {   binary: sourceOptions.binary,
                    encoding: sourceOptions.encoding,
                    record: sourceOptions.record,
                    volume: sourceOptions.volume,
                    responseTimeout: options.responseTimeout,
                    task: task2
                }
            );

            /**
             *  Does the target dataset exist?
             */
            const TargetDsList = await List.dataSet(targetSession, targetDataset,
                {attributes: true, maxLength: 1, start: targetDataset, recall: "wait"});

            if (TargetDsList.apiResponse != null && TargetDsList.apiResponse.returnedRows != null && TargetDsList.apiResponse.items != null) {
                // Look for the index of the data set in the response from the List API
                const dsnameIndex = TargetDsList.apiResponse.returnedRows === 0 ? -1 :
                    TargetDsList.apiResponse.items.findIndex((ds: any) => ds.dsname.toUpperCase() === targetDataset.toUpperCase());
                if (dsnameIndex !== -1) {
                    // If dsnameIndex === -1, it means we could not find the given data set.
                    // We will attempt the upload anyways so that we can forward/throw the proper error from z/OS MF
                    targetDataSetObj = TargetDsList.apiResponse.items[dsnameIndex];
                    targetFound = true;

                    if(targetDataSetObj.dsorg == "PO" || targetDataSetObj.dsorg == "POE")
                    {
                        //TODO: Check for invalid dataset type.
                    }
                }
            }

            /**
             *  Check to see if the target dataset exists and if the attributes match the source
             */
            if(targetFound == false){
                /**
                 *  Create the target dataset if it does not exist based on the source dataset values
                 */
                const createOptions = Copy.generateDatasetOptions(targetOptions, sourceDataSetObj);
                await Create.dataSet(targetSession, CreateDataSetTypeEnum.DATA_SET_CLASSIC, targetDataset, createOptions);
            }
            else{
                // TODO: Check for replace flag, else prompt?
            }

            /**
             *  Upload the source data to the target dataset
             */
            await Upload.bufferToDataSet(targetSession, dsContentBuf, targetDataset);

            return {
                success: true,
                commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }

    /**
     *  Private function to convert the dataset options from the format returned by the Get() call in to the format used by the Create() call
     */
    private static generateDatasetOptions(targetOptions: ICrossLparCopyDatasetOptions, dsInfo: IZosmfListResponse): ICreateDataSetOptions {
        return JSON.parse(JSON.stringify({
            alcunit: Copy.convertAlcTozOSMF(dsInfo.spacu),
            dsorg: dsInfo.dsorg,
            volser: targetOptions.targetVolser,
            primary: parseInt(dsInfo.sizex),
            secondary: parseInt(dsInfo.extx),
            recfm: dsInfo.recfm,
            blksize: parseInt(dsInfo.blksz),
            lrecl: parseInt(dsInfo.lrecl),
            storclass: targetOptions.targetStorageClass,
            mgntclass: targetOptions.targetManagementClass,
            dataclass: targetOptions.targetDataClass,
            dirblk: 0
        }));
    }

    /**
     *  Private function to convert the ALC value from the format returned by the Get() call in to the format used by the Create() call
     */
    private static convertAlcTozOSMF( zosmfValue: string): string {
        // TODO: Validate all possible values.

        if(zosmfValue == " BLOCKS")
            return "BLKS";
        if(zosmfValue == "CYLINDERS")
            return "CYL";
        if(zosmfValue == "TRACKS")
            return "TRK";
        if(zosmfValue == "MB")
            return "MB";
        if(zosmfValue == "KB")
            return "KB";

        return zosmfValue;
    }
}
