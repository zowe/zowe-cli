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

import { AbstractSession, Headers, IHeaderContent, ImperativeError, ImperativeExpect, Logger, TextUtils } from "@zowe/imperative";
import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { CreateDefaults } from "./Create.defaults";
import { CreateDataSetTypeEnum } from "./CreateDataSetType.enum";
import { ICreateDataSetOptions } from "./doc/ICreateDataSetOptions";
import { Invoke } from "../invoke";
import { ICreateVsamOptions } from "./doc/ICreateVsamOptions";
import { ICreateZfsOptions } from "./doc/ICreateZfsOptions";
import * as path from "path";
import { IZosFilesOptions } from "../../doc/IZosFilesOptions";

// Do not use import in anticipation of some internationalization work to be done later.
// const strings = (require("../../../../../packages/cli/zosfiles/src/-strings-/en").default as typeof i18nTypings);

/**
 * Class to handle creation of data sets
 */
export class Create {
    /**
     * Create a data set
     * @param {AbstractSession} session                     - z/OSMF connection info
     * @param {CreateDataSetTypeEnum} dataSetType           - the type of data set we are going to create
     * @param {string} dataSetName                          - the name of the data set to create
     * @param {Partial<ICreateDataSetOptions>} [options={}] - overrides the default options provided by dataSetType
     * @returns {Promise<IZosFilesResponse>}
     */
    public static async dataSet(session: AbstractSession,
        dataSetType: CreateDataSetTypeEnum,
        dataSetName: string,
        options?: Partial<ICreateDataSetOptions>): Promise<IZosFilesResponse> {
        let validCmdType = true;

        // Removes undefined properties
        let tempOptions = !(options === null || options === undefined) ? JSON.parse(JSON.stringify(options)) : {};

        // Required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetType, ZosFilesMessages.missingDatasetType.message);

        // Required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);

        switch (dataSetType) {
            case CreateDataSetTypeEnum.DATA_SET_PARTITIONED:
                tempOptions = { ...CreateDefaults.DATA_SET.PARTITIONED, ...tempOptions };
                break;
            case CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL:
                tempOptions = { ...CreateDefaults.DATA_SET.SEQUENTIAL, ...tempOptions };
                break;
            case CreateDataSetTypeEnum.DATA_SET_BINARY:
                tempOptions = { ...CreateDefaults.DATA_SET.BINARY, ...tempOptions };
                break;
            case CreateDataSetTypeEnum.DATA_SET_C:
                tempOptions = { ...CreateDefaults.DATA_SET.C, ...tempOptions };
                break;
            case CreateDataSetTypeEnum.DATA_SET_CLASSIC:
                tempOptions = { ...CreateDefaults.DATA_SET.CLASSIC, ...tempOptions };
                break;
            case CreateDataSetTypeEnum.DATA_SET_BLANK:
                tempOptions = { ...CreateDefaults.DATA_SET.BLANK, ...tempOptions };
                break;
            default:
                validCmdType = false;
                break;
        }

        if (!validCmdType) {
            throw new ImperativeError({ msg: ZosFilesMessages.unsupportedDatasetType.message });
        } else {
            // Handle the size option
            if (!(tempOptions.size === null || tempOptions.size === undefined)) {
                const tAlcunit = tempOptions.size.toString().match(/[a-zA-Z]+/g);
                if (!(tAlcunit === null || tAlcunit === undefined)) {
                    tempOptions.alcunit = tAlcunit.join("").toUpperCase();
                }

                const tPrimary = tempOptions.size.toString().match(/[0-9]+/g);
                if (!(tPrimary === null || tPrimary === undefined)) {
                    tempOptions.primary = +(tPrimary.join(""));

                    if (tempOptions.secondary === null || tempOptions.secondary === undefined) {
                        const TEN_PERCENT = 0.10;
                        tempOptions.secondary = Math.round(tempOptions.primary * TEN_PERCENT);
                    }
                }
            } else {
                if (tempOptions.secondary === null || tempOptions.secondary === undefined) {
                    if (dataSetType === CreateDataSetTypeEnum.DATA_SET_BLANK) {
                        // do nothing
                    } else if (dataSetType !== CreateDataSetTypeEnum.DATA_SET_BINARY) {
                        tempOptions.secondary = 1;
                    } else {
                        tempOptions.secondary = 10;
                    }
                }
            }
            delete tempOptions.size;

            let response = "";
            // Handle the print attributes option
            if (!(tempOptions.showAttributes === null || tempOptions.showAttributes === undefined)) {
                if (tempOptions.showAttributes) {
                    delete tempOptions.showAttributes;
                    response = TextUtils.prettyJson(tempOptions);
                } else {
                    delete tempOptions.showAttributes;
                }
            }

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + encodeURIComponent(dataSetName);
            const headers: IHeaderContent[] = [ZosmfHeaders.ACCEPT_ENCODING];
            if (options && options.responseTimeout != null) {
                headers.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            }

            Create.dataSetValidateOptions(tempOptions);

            await ZosmfRestClient.postExpectString(session, endpoint, headers, JSON.stringify(tempOptions));

            return {
                success: true,
                commandResponse: response + ZosFilesMessages.dataSetCreatedSuccessfully.message
            };
        }
    }

    public static async dataSetLike(session: AbstractSession,
        dataSetName: string,
        likeDataSetName: string,
        options?: Partial<ICreateDataSetOptions>): Promise<IZosFilesResponse> {
        // Required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);
        ImperativeExpect.toNotBeNullOrUndefined(likeDataSetName, ZosFilesMessages.missingDatasetLikeName.message);

        const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + encodeURIComponent(dataSetName);
        const headers: IHeaderContent[] = [ZosmfHeaders.ACCEPT_ENCODING];
        if (options && options.responseTimeout != null) {
            headers.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
        }
        const tempOptions = JSON.parse(JSON.stringify({ like: likeDataSetName, ...(options || {}) }));
        Create.dataSetValidateOptions(tempOptions);
        await ZosmfRestClient.postExpectString(session, endpoint, headers, JSON.stringify(tempOptions));
        return {
            success: true,
            commandResponse: ZosFilesMessages.dataSetCreatedSuccessfully.message
        };
    }

    /**
     * Validate supplied parameters
     * @static
     * @param options - additional options for the creation of the data set
     */
    public static dataSetValidateOptions(options: ICreateDataSetOptions) {

        ImperativeExpect.toNotBeNullOrUndefined(options, ZosFilesMessages.missingFilesCreateOptions.message);

        const tempOptions: any = options;

        for (const option in tempOptions) {
            if (Object.prototype.hasOwnProperty.call(tempOptions, option)) {
                switch (option) {

                    case "alcunit":
                    // zOSMF defaults to TRK if missing so mimic it's behavior
                        if (tempOptions.alcunit === null || tempOptions.alcunit === undefined) {
                            tempOptions.alcunit = "TRK";
                        }

                        // Only CYL and TRK valid
                        switch (tempOptions.alcunit.toUpperCase()) {
                            case "CYL":
                            case "TRK":
                                break;
                            default:
                                throw new ImperativeError({ msg: ZosFilesMessages.invalidAlcunitOption.message + tempOptions.alcunit });
                        }

                        break;

                    case "avgblk":
                    // no validation at this time
                        break;

                    case "blksize":
                    /*
                    *  This is a fix for issue https://github.com/zowe/zowe-cli/issues/1439.
                    *
                    */
                        if (tempOptions.blksize === null || tempOptions.blksize === undefined) {
                            tempOptions.blksize = tempOptions.lrecl;
                        }

                        if(tempOptions.blksize  <= tempOptions.lrecl ){
                            tempOptions.blksize = tempOptions.lrecl;
                            if(tempOptions.recfm === null || tempOptions.recfm === undefined){
                                tempOptions.recfm = "FB";
                            }
                            switch (tempOptions.recfm.toUpperCase()) {
                                case "V":
                                case "VB":
                                case "VBS":
                                case "VS":
                                    tempOptions.blksize += 4;
                                    break;
                                default:
                                    break;
                            }
                        }
                        break;

                    case "lrecl":
                    // Required
                        ImperativeExpect.toNotBeNullOrUndefined(tempOptions.lrecl, ZosFilesMessages.missingRecordLength.message);

                        break;

                    case "dirblk":
                    // Validate non-zero if dsorg is PS
                        if (tempOptions.dirblk !== 0 && tempOptions.dsorg === "PS") {
                            throw new ImperativeError({ msg: ZosFilesMessages.invalidPSDsorgDirblkCombination.message });
                        }
                        // Validate non-zero if 'dsorg' is PO
                        if (tempOptions.dirblk === 0 && tempOptions.dsorg === "PO") {
                            throw new ImperativeError({ msg: ZosFilesMessages.invalidPODsorgDirblkCombination.message });
                        }

                        break;

                    case "dsntype": {
                    // Key to create a PDSE.
                        const type: string = tempOptions.dsntype.toUpperCase();
                        const availableTypes = ["BASIC", "EXTPREF", "EXTREQ", "HFS", "LARGE", "PDS", "LIBRARY", "PIPE"];
                        if (availableTypes.indexOf(type) === -1) {
                            throw new ImperativeError({ msg: ZosFilesMessages.invalidDsntypeOption.message + tempOptions.dsntype });
                        }
                        break;
                    }
                    case "dsorg":
                    // Only PO and PS valid
                        switch (tempOptions.dsorg.toUpperCase()) {
                            case "PO":
                            case "PS":
                                break;

                            default:
                                throw new ImperativeError({ msg: ZosFilesMessages.invalidDsorgOption.message + tempOptions.dsorg });
                        }

                        break;

                    case "primary":
                    // Required
                        ImperativeExpect.toNotBeNullOrUndefined(tempOptions.primary, ZosFilesMessages.missingPrimary.message);

                        // Validate maximum allocation quantity
                        if (tempOptions.primary > ZosFilesConstants.MAX_ALLOC_QUANTITY) {
                            throw new ImperativeError({ msg: ZosFilesMessages.maximumAllocationQuantityExceeded.message + " for 'primary'." });
                        }
                        break;

                    case "secondary":
                    // zOSMF defaults to 0 if missing so mimic it's behavior
                        if (tempOptions.secondary === null || tempOptions.secondary === undefined) {
                            tempOptions.secondary = 0;
                        }

                        // Validate maximum allocation quantity
                        if (tempOptions.secondary > ZosFilesConstants.MAX_ALLOC_QUANTITY) {
                            throw new ImperativeError({ msg: ZosFilesMessages.maximumAllocationQuantityExceeded.message + " for 'secondary'." });
                        }
                        break;

                    case "recfm":
                    // zOSMF defaults to F if missing so mimic it's behavior
                        if (tempOptions.recfm === null || tempOptions.recfm === undefined) {
                            tempOptions.recfm = "F";
                        }

                        // F, V, or U are required; B, A, M, S, T or additional
                        // VBA works on mainframe but not via zOSMF
                        switch (tempOptions.recfm.toUpperCase()) {
                            case "D":
                            case "DB":
                            case "DBS":
                            case "DS":
                            case "F":
                            case "FB":
                            case "FBS":
                            case "FS":
                            case "V":
                            case "VB":
                            case "VBS":
                            case "VS":
                            case "U":
                                break;
                            default:
                                throw new ImperativeError({ msg: ZosFilesMessages.invalidRecfmOption.message + tempOptions.recfm });
                        }
                        break;

                    // SMS class values
                    case "mgntclass":
                    case "storclass":
                    case "dataclass":
                    // no validation

                        break;

                    case "unit":
                    case "volser":
                    case "responseTimeout":
                    case "like":
                    // no validation

                        break;

                    default:
                        throw new ImperativeError({ msg: ZosFilesMessages.invalidFilesCreateOption.message + option });

                }
            }
        }
    }

    // ____________________________________________________________________________
    /**
     * Create a VSAM cluster
     * @param {AbstractSession} session - An established z/OSMF session
     * @param {string} dataSetName - the name of the dataset for the created cluster
     * @param {Partial<ICreateVsamOptions>} options - options for the creation of the cluster
     * @example
     * ```typescript
     *
     *     sessCfg: ISession = yourFunctionToCreateSessCfgFromArgs(commandParameters.arguments);
     *     sessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
     *         sessCfg, commandParameters.arguments
     *     );
     *     session = new Session(sessCfgWithCreds);
     *
     *     // The option keys are defined in ZosFilesCreateOptions,
     *     // ZosFilesCreateExtraOptions and VsamCreateOptions.
     *     //
     *     const createVsamOptions: Partial<ICreateVsamOptions> = {
     *         dsorg: "INDEXED",
     *         size: "640KB",
     *         secondary: 64
     *         showAttributes: true
     *     }));
     *
     *     try {
     *         createResponse = await Create.vsam(
     *             session, "SOME.DATASET.NAME", createVsamOptions
     *         );
     *     }
     *     catch (impErr) {
     *         // handle any error
     *     }
     *
     *     // use the results in createResponse.commandResponse
     * ```
     * @returns {Promise<IZosFilesResponse>}
     */
    public static async vsam(
        session: AbstractSession,
        dataSetName: string,
        options?: Partial<ICreateVsamOptions>)
        : Promise<IZosFilesResponse> {
        // We require the dataset name
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);

        const idcamsOptions: ICreateVsamOptions = this.vsamConvertToIdcamsOptions(options);

        // format the attributes to show, and remove the option
        let attribText = "";
        if (!(idcamsOptions.showAttributes === null || idcamsOptions.showAttributes === undefined)) {
            if (idcamsOptions.showAttributes) {
                delete idcamsOptions.showAttributes;
                attribText = ZosFilesMessages.attributeTitle.message + TextUtils.prettyJson(idcamsOptions);
            } else {
                delete idcamsOptions.showAttributes;
            }
        }

        let respTimeout: number;
        if (options) {
            respTimeout = options.responseTimeout;
        }

        try {
            this.vsamValidateOptions(idcamsOptions);

            // We invoke IDCAMS to create the VSAM cluster
            const idcamsCmds = this.vsamFormIdcamsCreateCmd(dataSetName, idcamsOptions);
            Logger.getAppLogger().debug("Invoking this IDCAMS command:\n" + idcamsCmds.join("\n"));
            const idcamsResponse: IZosFilesResponse = await Invoke.ams(session, idcamsCmds, {responseTimeout: respTimeout});
            return {
                success: true,
                commandResponse: attribText + ZosFilesMessages.dataSetCreatedSuccessfully.message,
                apiResponse: idcamsResponse
            };
        } catch (error) {
            const impErr = new ImperativeError({
                msg: attribText + error.mDetails.msg,
                causeErrors: error.mDetails.causeErrors,
                additionalDetails: error.mDetails.additionalDetails
            });
            Logger.getAppLogger().error(impErr.toString());
            throw impErr;
        }
    }


    /**
     * Create a uss file or folder
     * @param {AbstractSession} session              - z/OSMF connection info
     * @param {string} ussPath                       - USS path to create file or directory
     * @param {string} type                          - the request type "file" or "directory"
     * @param {string} mode                          - the characters to describe permissions
     * @returns {Promise<IZosFilesResponse>}
     */
    public static async uss(session: AbstractSession,
        ussPath: string,
        type: string,
        mode?: string,
        options?: IZosFilesOptions)
        : Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(type, ZosFilesMessages.missingRequestType.message);
        ImperativeExpect.toNotBeEqual(type, "", ZosFilesMessages.missingRequestType.message);
        ussPath = path.posix.normalize(ussPath);
        ussPath = ussPath.charAt(0) === "/" ? ussPath.substring(1) : ussPath;
        ussPath = encodeURIComponent(ussPath);
        const parameters: string = `${ZosFilesConstants.RESOURCE}${ZosFilesConstants.RES_USS_FILES}/${ussPath}`;
        const headers: IHeaderContent[] = [Headers.APPLICATION_JSON, ZosmfHeaders.ACCEPT_ENCODING];
        if (options && options.responseTimeout != null) {
            headers.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
        }
        let payload: object = { type };
        if (mode) {
            payload = { ...payload, ...{ mode } };
        }
        const data = await ZosmfRestClient.postExpectString(session, parameters, headers, payload);

        return {
            success: true,
            commandResponse: ZosFilesMessages.ussCreatedSuccessfully.message,
            apiResponse: data
        };
    }

    public static async zfs(
        session: AbstractSession,
        fileSystemName: string,
        options?: Partial<ICreateZfsOptions>)
        : Promise<IZosFilesResponse> {
        // We require the file system name
        ImperativeExpect.toNotBeNullOrUndefined(fileSystemName, ZosFilesMessages.missingFileSystemName.message);

        // Removes undefined properties
        const tempOptions = !(options === null || options === undefined) ? JSON.parse(JSON.stringify(options)) : {};


        let endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_ZFS_FILES + "/" + encodeURIComponent(fileSystemName);

        this.zfsValidateOptions(tempOptions);
        tempOptions.JSONversion = 1;
        const headers = [];

        if (!(tempOptions.timeout === null || tempOptions.timeout === undefined)) {
            endpoint += `?timeout=${encodeURIComponent(tempOptions.timeout)}`;
            delete tempOptions.timeout;
        }
        if (options && options.responseTimeout != null) {
            headers.push({[ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT]: options.responseTimeout.toString()});
            delete tempOptions.responseTimeout;
        }

        const jsonContent = JSON.stringify(tempOptions);
        headers.push(ZosmfHeaders.ACCEPT_ENCODING, { "Content-Length": jsonContent.length });
        const data = await ZosmfRestClient.postExpectString(session, endpoint, headers, jsonContent);

        return {
            success: true,
            commandResponse: ZosFilesMessages.zfsCreatedSuccessfully.message,
            apiResponse: data
        };
    }

    // ____________________________________________________________________________
    /**
     * Convert the options received from the CLI into options that we supply to IDCAMS.
     * @param {ICreateVsamOptions} cliOptions - The set of options from our CLI
     * @returns {ICreateVsamOptions} - Options to provide to IDCAMS.
     */
    private static vsamConvertToIdcamsOptions(cliOptions: ICreateVsamOptions): ICreateVsamOptions {
        // Removes undefined properties
        let idcamsOptions = !(cliOptions === null || cliOptions === undefined) ? JSON.parse(JSON.stringify(cliOptions)) : {};

        // convert the zowe size into IDCAMS allocationUnit and primarySpace
        let matchArray;
        if (idcamsOptions.size) {
            idcamsOptions.size = idcamsOptions.size.toUpperCase();
            matchArray = idcamsOptions.size.match(/[A-Z]+/g);
            if (matchArray) {
                // the text part of size is the allocation unit
                idcamsOptions.alcunit = matchArray[0];
            }

            matchArray = idcamsOptions.size.match(/[0-9]+/g);
            if (matchArray) {
                // the numeric part of size is the primary space
                idcamsOptions.primary = matchArray[0];
            }

            delete idcamsOptions.size;
        }

        // start with our default options, and override with any supplied options.
        idcamsOptions = { ...CreateDefaults.VSAM, ...idcamsOptions };

        // when secondary is not specified, use 10% of primary
        if (idcamsOptions.secondary  === null || idcamsOptions.secondary  === undefined) {
            const tenPercent = 0.10;
            idcamsOptions.secondary = Math.round(idcamsOptions.primary * tenPercent);
        }

        return idcamsOptions;
    }

    // ____________________________________________________________________________
    /**
     * Form the IDCAMS command to create a VSAM cluster
     * @param {string} dataSetName - the name of the dataset for the created cluster
     * @param options - options for the creation of the cluster
     * @returns {string} - The IDCAMS command to be invoked.
     */
    private static vsamFormIdcamsCreateCmd(
        dataSetName: string,
        options: ICreateVsamOptions)
        : string[] {
        return [
            "DEFINE CLUSTER -\n" +
            "(" +
            "NAME('" + dataSetName.toUpperCase() + "') -\n" +
            options.dsorg.toUpperCase() + " -\n" +
            options.alcunit.toUpperCase() + "(" + options.primary + " " + options.secondary + ")" + " -\n" +
            (options.retainTo ? "TO(" + options.retainTo + ") -\n" : "") +
            (options.retainFor ? "FOR(" + options.retainFor + ") -\n" : "") +
            (options.volumes ? "VOLUMES(" + options.volumes.toUpperCase() + ") -\n" : "") +
            (options.storclass ? "STORAGECLASS(" + options.storclass + ") -\n" : "") +
            (options.mgntclass ? "MANAGEMENTCLASS(" + options.mgntclass + ") -\n" : "") +
            (options.dataclass ? "DATACLASS(" + options.dataclass + ") -\n" : "") +
            ")"
        ];
    }

    // ____________________________________________________________________________
    /**
     * Validate the options for the command to create a VSAM cluster
     * @param options - options for the creation of the cluster
     */
    private static vsamValidateOptions(options: ICreateVsamOptions): void {
        ImperativeExpect.toNotBeNullOrUndefined(options,
            ZosFilesMessages.missingFilesCreateOptions.message
        );

        /* If our caller does not supply these options, we supply default values for them,
         * so they should exist at this point.
         */
        ImperativeExpect.toNotBeNullOrUndefined(options.dsorg,
            ZosFilesMessages.missingVsamOption.message + "dsorg"
        );
        ImperativeExpect.toNotBeNullOrUndefined(options.alcunit,
            ZosFilesMessages.missingVsamOption.message + "alcunit"
        );
        ImperativeExpect.toNotBeNullOrUndefined(options.primary,
            ZosFilesMessages.missingVsamOption.message + "primary"
        );
        ImperativeExpect.toNotBeNullOrUndefined(options.secondary,
            ZosFilesMessages.missingVsamOption.message + "secondary"
        );

        // validate specific options
        for (const option in options) {
            if (Object.prototype.hasOwnProperty.call(options, option)) {
                switch (option) {

                    case "dsorg":
                        if (!ZosFilesConstants.VSAM_DSORG_CHOICES.includes(options.dsorg.toUpperCase())) {
                            throw new ImperativeError({
                                msg: ZosFilesMessages.invalidDsorgOption.message + options.dsorg
                            });
                        }
                        break;

                    case "alcunit":
                        if (!ZosFilesConstants.VSAM_ALCUNIT_CHOICES.includes(options.alcunit.toUpperCase())) {
                            throw new ImperativeError({
                                msg: ZosFilesMessages.invalidAlcunitOption.message + options.alcunit
                            });
                        }
                        break;

                    case "primary":
                    case "secondary":
                    // Validate maximum allocation quantity
                        if (options[option] > ZosFilesConstants.MAX_ALLOC_QUANTITY) {
                            throw new ImperativeError({
                                msg: ZosFilesMessages.maximumAllocationQuantityExceeded.message + " " +
                                    ZosFilesMessages.commonFor.message + " '" + option + "' " + ZosFilesMessages.commonWithValue.message +
                                    " = " + options[option] + "."
                            });
                        }
                        break;

                    case "retainFor":
                        if (options[option] < ZosFilesConstants.MIN_RETAIN_DAYS ||
                            options[option] > ZosFilesConstants.MAX_RETAIN_DAYS) {
                            throw new ImperativeError({
                                msg: TextUtils.formatMessage(ZosFilesMessages.valueOutOfBounds.message, {
                                    optionName: option,
                                    value: options[option],
                                    minValue: ZosFilesConstants.MIN_RETAIN_DAYS,
                                    maxValue: ZosFilesConstants.MAX_RETAIN_DAYS
                                })
                            });
                        }
                        break;

                    case "retainTo":
                    case "volumes":
                    case "storclass":
                    case "mgntclass":
                    case "dataclass":
                    case "responseTimeout":
                    // no validation at this time
                        break;

                    default:
                        throw new ImperativeError({ msg: ZosFilesMessages.invalidFilesCreateOption.message + option });

                } // end switch
            }
        } // end for
    }

    // ____________________________________________________________________________
    /**
     * Validate the options for the command to create a z/OS file system
     * @param options - options for the creation of the file system
     */
    private static zfsValidateOptions(options: ICreateZfsOptions): void {
        ImperativeExpect.toNotBeNullOrUndefined(options,
            ZosFilesMessages.missingFilesCreateOptions.message
        );

        /* If our caller does not supply these options, we supply default values for them,
         * so they should exist at this point.
         */
        ImperativeExpect.toNotBeNullOrUndefined(options.perms,
            ZosFilesMessages.missingZfsOption.message + "perms"
        );
        ImperativeExpect.toNotBeNullOrUndefined(options.cylsPri,
            ZosFilesMessages.missingZfsOption.message + "cyls-pri"
        );
        ImperativeExpect.toNotBeNullOrUndefined(options.cylsSec,
            ZosFilesMessages.missingZfsOption.message + "cyls-sec"
        );
        ImperativeExpect.toNotBeNullOrUndefined(options.timeout,
            ZosFilesMessages.missingZfsOption.message + "timeout"
        );

        // validate specific options
        for (const option in options) {
            if (Object.prototype.hasOwnProperty.call(options, option)) {
                switch (option) {

                    case "perms": {
                        const maxPerm = 777;
                        if ((options.perms < 0) || (options.perms > maxPerm)) {
                            throw new ImperativeError({
                                msg: ZosFilesMessages.invalidPermsOption.message + options.perms
                            });
                        }
                        break;
                    }
                    case "cylsPri":
                    case "cylsSec":
                    // Validate maximum allocation quantity
                        if (options[option] > ZosFilesConstants.MAX_ALLOC_QUANTITY) {
                            throw new ImperativeError({
                                msg: ZosFilesMessages.maximumAllocationQuantityExceeded.message + " " +
                                    ZosFilesMessages.commonFor.message + " '" + option + "' " + ZosFilesMessages.commonWithValue.message +
                                    " = " + options[option] + "."
                            });
                        }
                        break;

                    case "owner":
                    case "group":
                    case "storclass":
                    case "mgntclass":
                    case "dataclass":
                    case "volumes":
                    case "timeout":
                    case "responseTimeout":
                    // no validation at this time
                        break;

                    default:
                        throw new ImperativeError({ msg: ZosFilesMessages.invalidFilesCreateOption.message + option });

                } // end switch
            }
        } // end for
    }
}
