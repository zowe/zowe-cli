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

import { AbstractSession, ImperativeError, ImperativeExpect, ITaskWithStatus,
    Logger, Headers, IHeaderContent, TaskStage, IO,
    TaskProgress} from "@zowe/imperative";
import { posix } from "path";
import * as fs from "fs";
import { Create, CreateDataSetTypeEnum, ICreateDataSetOptions } from "../create";
import { Get } from "../get";
import { Upload } from "../upload";
import { List } from "../list";
import { IGetOptions } from "../get/doc/IGetOptions";
import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { IZosmfListResponse } from "../list/doc/IZosmfListResponse";
import { IDataSet } from "../../doc/IDataSet";
import { ICopyDatasetOptions } from "./doc/ICopyDatasetOptions";
import { ICrossLparCopyDatasetOptions } from "./doc/ICrossLparCopyDatasetOptions";
import { Download } from "../download";
import { ZosFilesUtils } from "../../utils/ZosFilesUtils";
import { tmpdir } from "os";
import path = require("path");
import * as util from "util";
import { Delete } from "../delete";
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
        const safeReplace: boolean = options.safeReplace;
        const overwriteMembers: boolean = options.replace;

        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Copying data set",
            stageName: TaskStage.IN_PROGRESS
        };

        const sourceDataSetExists = await this.dataSetExists(session, options["from-dataset"].dsn);
        if(!sourceDataSetExists) {
            return {
                success: false,
                commandResponse: ZosFilesMessages.datasetCopiedAbortedNoTargetDS.message
            };
        }

        if(options["from-dataset"].dsn === toDataSetName && toMemberName === options["from-dataset"].member) {
            return {
                success: false,
                commandResponse: ZosFilesMessages.identicalDataSets.message
            };
        }

        const targetDataSetExists = await this.dataSetExists(session, toDataSetName);

        const overwriteDataset = options.overwrite;

        if(overwriteDataset){
            await Delete.dataSet(session,toDataSetName);
        }
        const newDataSet = !targetDataSetExists || overwriteDataset;

        if (newDataSet) {
            await Create.dataSetLike(session, toDataSetName, options["from-dataset"].dsn);
        }

        else if(safeReplace) {
            if (options.promptFn != null) {
                const userResponse = await options.promptFn(toDataSetName);

                if(!userResponse) {
                    throw new ImperativeError({ msg: ZosFilesMessages.datasetCopiedAborted.message });
                }
                else if(options.progress && options.progress.startBar) {
                    options.progress.startBar({task});
                }
            }
        }
        if(options.progress && options.progress.endBar) {
            options.progress.endBar();
        }
        if(!toMemberName && !options["from-dataset"].member) {
            const sourceIsPds = await this.isPDS(session, options["from-dataset"].dsn);
            const targetIsPds = await this.isPDS(session, toDataSetName);

            if (sourceIsPds && targetIsPds) {
                const sourceResponse = await List.allMembers(session, options["from-dataset"].dsn);
                const sourceMemberList = sourceResponse.apiResponse.items.map((item: { member: any; }) => item.member);

                const hasIdenticalMemberNames = await this.hasIdenticalMemberNames(session, sourceMemberList, toDataSetName);
                if(!safeReplace && hasIdenticalMemberNames && !overwriteMembers) {
                    const userResponse = await options.promptForIdenticalNamedMembers();

                    if(!userResponse) {
                        throw new ImperativeError({ msg: ZosFilesMessages.datasetCopiedAborted.message});
                    }
                    else if(options.progress && options.progress.startBar) {
                        options.progress.startBar({task});
                    }
                }
                if(options.progress) {
                    if(options.progress.endBar) {
                        options.progress.endBar();
                    }
                    if(options.progress.startBar) {
                        options.progress.startBar({task});
                    }
                }
                const response = await this.copyPDS(session, options["from-dataset"].dsn, toDataSetName, task, sourceMemberList);
                if(options.progress && options.progress.endBar) {
                    options.progress.endBar();
                }
                return {
                    success: true,
                    commandResponse: newDataSet && !overwriteDataset
                        ? util.format(ZosFilesMessages.dataSetCopiedIntoNew.message, toDataSetName)
                        : response.commandResponse
                };
            }
        }
        const endpoint: string = posix.join(
            ZosFilesConstants.RESOURCE,
            ZosFilesConstants.RES_DS_FILES,
            encodeURIComponent(toMemberName == null ? toDataSetName : `${toDataSetName}(${toMemberName})`)
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
                commandResponse: newDataSet
                    ? util.format(ZosFilesMessages.dataSetCopiedIntoNew.message, toDataSetName)
                    : ZosFilesMessages.datasetCopiedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }

    /**
     * Function that checks if a dataset is type PDS
    **/
    public static async isPDS(
        session: AbstractSession,
        dataSetName: string
    ): Promise<boolean> {
        try {
            const response = await List.dataSet(session, dataSetName, {attributes: true});
            const dsorg = response.apiResponse.items[0].dsorg;
            return dsorg.startsWith("PO");
        }
        catch(error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }

    /**
     * Function that checks if the data set exists
    **/
    private static async dataSetExists(
        session: AbstractSession,
        dataSetName: string
    ): Promise<boolean> {
        let dsnameIndex;
        const dataSetList = await List.dataSet(session, dataSetName, {start: dataSetName});
        if(dataSetList.apiResponse != null && dataSetList.apiResponse.returnedRows != null && dataSetList.apiResponse.items != null) {
            dsnameIndex = dataSetList.apiResponse.returnedRows === 0 ? -1 :
                dataSetList.apiResponse.items.findIndex((ds: any) => ds.dsname.toUpperCase() === dataSetName.toUpperCase());
        }
        return dsnameIndex !== -1;
    }

    /**
     * Function that checks if source and target data sets have identical member names
    */
    private static async hasIdenticalMemberNames (
        session: AbstractSession,
        sourceMemberList: string[],
        toPds: string
    ): Promise <boolean> {
        const targetResponse = await List.allMembers(session, toPds);
        const targetMemberList = targetResponse.apiResponse.items.map((item: { member: any; }) => item.member);

        return sourceMemberList.some((mem: any) => targetMemberList.includes(mem));
    }

    /**
     * Copy the members of a Partitioned dataset into another Partitioned dataset
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
    public static async copyPDS (
        session: AbstractSession, fromPds: string, toPds: string, task: ITaskWithStatus, sourceMemberList?: string[]): Promise<IZosFilesResponse> {
        try {

            if(sourceMemberList.length == 0) {
                return {
                    success: true,
                    commandResponse: `Source dataset (${fromPds}) - ` + ZosFilesMessages.noMembersFound.message
                };
            }

            const downloadDir = path.join(tmpdir(), fromPds);
            await Download.allMembers(session, fromPds, {directory:downloadDir});
            const uploadFileList: string[] = ZosFilesUtils.getFileListFromPath(downloadDir);
            const truncatedMembers: string[] = [];
            let membersInitiated = 0;

            for (const file of uploadFileList) {
                const memName = ZosFilesUtils.generateMemberName(file);
                const uploadingDsn = `${toPds}(${memName})`;
                if (task != null) {
                    const LAST_FIFTEEN_CHARS = -16;
                    const abbreviatedFile = file.slice(LAST_FIFTEEN_CHARS);
                    task.statusMessage = "Copying... " + abbreviatedFile;
                    task.percentComplete = Math.floor(TaskProgress.ONE_HUNDRED_PERCENT *
                        (membersInitiated / uploadFileList.length));
                    membersInitiated++;
                }
                try {
                    const uploadStream = IO.createReadStream(file);
                    await Upload.streamToDataSet(session, uploadStream, uploadingDsn);
                }
                catch(error) {
                    if(error.message && error.message.includes("Truncation of a record occurred during an I/O operation")) {
                        truncatedMembers.push(memName);
                    }
                    else {
                        Logger.getAppLogger().error(error);
                    }
                    continue;
                }
            }
            const truncatedMembersFile = path.join(tmpdir(), 'truncatedMembers.txt');
            if(truncatedMembers.length > 0) {
                const firstTenMembers = truncatedMembers.slice(0, 10);
                fs.writeFileSync(truncatedMembersFile, truncatedMembers.join('\n'), {flag: 'w'});
                const numMembers = truncatedMembers.length - firstTenMembers.length;
                return {
                    success: true,
                    commandResponse:
                        ZosFilesMessages.datasetCopiedSuccessfully.message + " " +
                        ZosFilesMessages.membersContentTruncated.message + "\n" +
                        firstTenMembers.join('\n') +
                        (numMembers > 0 ? `\n... and ${numMembers} more` +
                        util.format(ZosFilesMessages.viewMembersListfile.message, truncatedMembersFile) : '')
                };
            }
            fs.rmSync(downloadDir, {recursive: true});
            fs.rmSync(truncatedMembersFile, {force: true});
            return {
                success:true,
                commandResponse: ZosFilesMessages.datasetCopiedSuccessfully.message
            };
        }
        catch (error) {
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
     * @param {IHandlerResponseConsoleApi}      console        - Command console object
     *
     * @returns {Promise<IZosFilesResponse>} A response indicating the status of the copying
     *o
     * @throws {ImperativeError} Data set name must be specified as a non-empty string
     * @throws {Error} When the {@link ZosmfRestClient} throws an error
     *
     */
    public static async dataSetCrossLPAR(
        sourceSession: AbstractSession,
        { dsn: toDataSetName, member: toMemberName }: IDataSet,
        options: ICrossLparCopyDatasetOptions,
        sourceOptions: IGetOptions,
        targetSession: AbstractSession
    ): Promise<IZosFilesResponse> {
        ImperativeExpect.toBeDefinedAndNonBlank(options["from-dataset"].dsn, "fromDataSetName");
        ImperativeExpect.toBeDefinedAndNonBlank(toDataSetName, "toDataSetName");


        try {
            let sourceDataset = options["from-dataset"].dsn;
            const sourceMember  = options["from-dataset"].member;
            let   sourceDataSetObj: IZosmfListResponse;
            let   targetDataset = toDataSetName;
            const targetMember  = toMemberName;
            let targetDataSetObj: IZosmfListResponse;
            let targetFound: boolean = false;
            let targetMemberFound: boolean = false;
            let overwriteTarget: boolean = options.replace;

            /**
             * Does the source dataset exist?
             */
            const SourceDsList = await List.dataSet(sourceSession, sourceDataset, {
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
                } else {
                    throw new ImperativeError({ msg: ZosFilesMessages.datasetCopiedAbortedNoTargetDS.message });
                }
                /*
                * If the source is a PDS and no member was specified then abort the copy.
                */
                if(sourceDataSetObj.dsorg.startsWith("PO") && sourceMember == undefined){
                    throw new ImperativeError({ msg: ZosFilesMessages.datasetCopiedAbortedNoPDS.message });
                }
            }

            const task2: ITaskWithStatus = {
                percentComplete: 0,
                statusMessage: "Retrieving data set contents",
                stageName: TaskStage.IN_PROGRESS
            };

            /**
             *  Get the dataset and store it in a buffer
             *
             *  We want to download and upload in binary, as this command is copying from z/OS to z/OS system.
             *  We do not want to do any sort of data conversion.
             */
            if(sourceMember != undefined){
                sourceDataset = sourceDataset +"(" + sourceMember + ")";
            }
            const dsContentBuf = await Get.dataSet(sourceSession, sourceDataset,
                {   binary: true,
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

                    if(targetDataSetObj.dsorg.startsWith("PO") && targetMember == undefined)
                    {
                        throw new ImperativeError({ msg: ZosFilesMessages.datasetCopiedAbortedTargetNotPDSMember.message });
                    }
                }
            }

            /**
            * If this is a PDS and it exists, verify if the member also exists.
            */
            if(targetMember != undefined && targetFound == true){
                const TargetMemberList = await List.allMembers(targetSession, targetDataset,
                    { attributes: true, maxLength: 1, recall: "wait", start: targetMember });
                if(TargetMemberList.apiResponse.returnedRows > 0){
                    targetMemberFound = true;
                }
            }

            /**
             *  Check to see if the target dataset exists and if the attributes match the source
             */
            if(targetFound == false){
                /**
                 *  Create the target dataset if it does not exist based on the source dataset values
                 */
                const createOptions = Copy.generateDatasetOptions(options, sourceDataSetObj);
                /*
                * If this is a PDS but the target is the sequential dataset and does not exist,
                * create a new sequential dataset with the same parameters as the original PDS.
                */
                if(createOptions.dsorg.startsWith("PO") && targetMember == undefined){
                    createOptions.dsorg ="PS";
                    createOptions.dirblk = 0;
                }
                else if(targetMember != undefined &&  !createOptions.dsorg.startsWith("PO"))
                {
                    createOptions.dsorg ="PO";
                    createOptions.dirblk = 1;
                }
                await Create.dataSet(targetSession, CreateDataSetTypeEnum.DATA_SET_CLASSIC, targetDataset, createOptions);
            }
            else{
                if(overwriteTarget == undefined && targetMember == undefined){
                    if (options.promptFn != null) {
                        overwriteTarget = await options.promptFn(targetDataset);
                    }
                }
                else{
                    if(overwriteTarget == undefined && targetMemberFound == true)
                    {
                        if (options.promptFn != null) {
                            overwriteTarget = await options.promptFn(targetDataset +"(" + targetMember + ")");
                        }
                    }
                }
            }

            /*
            *  Don't overwrite an existing dataset or member if overwrite is false
            */
            if(overwriteTarget || !targetFound ||
                targetMember != undefined && !targetMemberFound ){
                /**
                 *  Upload the source data to the target dataset
                 */
                if(targetMember != undefined){
                    targetDataset = targetDataset +"(" + targetMember + ")";
                }
                await Upload.bufferToDataSet(targetSession, dsContentBuf, targetDataset,
                    {   binary: true
                    });
            }
            else
            {
                throw new ImperativeError({ msg: ZosFilesMessages.datasetCopiedAborted.message });
            }

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
            dirblk: parseInt(dsInfo.dsorg.startsWith("PO") ? "10" : "0")
        }));
    }

    /**
     * Converts the ALC value from the format returned by the Get() call to the format used by the Create() call.
     * @param {string} getValue - The ALC value from the Get() call.
     * @returns {string} - The ALC value in the format used by the Create() call.
     */
    private static convertAlcTozOSMF(getValue: string): string {
        /**
         *  Create dataset only accepts tracks or cylinders as allocation units.
         *  When the get() call retreives the dataset info, it will convert size
         *  allocations of the other unit types in to tracks. So we will always
         *  allocate the new target in tracks.
        */
        const alcMap: Record<string, string> = {
            "TRACKS": "TRK",
            "CYLINDERS": "CYL"
        };
        return alcMap[getValue.toUpperCase()] || "TRK";
    }
}

