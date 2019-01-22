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

import { AbstractSession, ImperativeError, ImperativeExpect, Logger, TextUtils } from "@brightside/imperative";
import { isNullOrUndefined } from "util";
import { ZosmfHeaders, ZosmfRestClient } from "../../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { CreateDefaults } from "./Create.defaults";
import { CreateDataSetTypeEnum } from "./CreateDataSetType.enum";
import { ICreateDataSetOptions } from "./doc/ICreateDataSetOptions";
import { Invoke } from "../invoke";
import { ICreateVsamOptions } from "./doc/ICreateVsamOptions";
import i18nTypings from "../../../cli/-strings-/en";

// Do not use import in anticipation of some internationalization work to be done later.
const strings = (require("../../../cli/-strings-/en").default as typeof i18nTypings);

/**
 * Class to handle creation of data sets
 */
export class Create {
    /**
     * Create a data set
     * @param {AbstractSession} session                     - z/OSMF connection info
     * @param {CreateDataSetTypeEnum} cmdType               - The type of data set we are going to create
     * @param {string} dataSetName                          - the name of the data set to create
     * @param {Partial<ICreateDataSetOptions>} [options={}] - additional options for the creation of the data set
     * @returns {Promise<IZosFilesResponse>}
     */
    public static async dataSet(session: AbstractSession,
                                cmdType: CreateDataSetTypeEnum,
                                dataSetName: string,
                                options?: Partial<ICreateDataSetOptions>): Promise<IZosFilesResponse> {
        let validCmdType = true;

        // Removes undefined properties
        let tempOptions = !isNullOrUndefined(options) ? JSON.parse(JSON.stringify(options)) : {};
        const secondarySpecified = !isNullOrUndefined(tempOptions.secondary);

        // Required
        ImperativeExpect.toNotBeNullOrUndefined(cmdType, ZosFilesMessages.missingDatasetType.message);

        // Required
        ImperativeExpect.toNotBeNullOrUndefined(dataSetName, ZosFilesMessages.missingDatasetName.message);

        switch (cmdType) {
            case CreateDataSetTypeEnum.DATA_SET_PARTITIONED:
                tempOptions = {...CreateDefaults.DATA_SET.PARTITIONED, ...tempOptions};
                break;
            case CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL:
                tempOptions = {...CreateDefaults.DATA_SET.SEQUENTIAL, ...tempOptions};
                break;
            case CreateDataSetTypeEnum.DATA_SET_BINARY:
                tempOptions = {...CreateDefaults.DATA_SET.BINARY, ...tempOptions};
                break;
            case CreateDataSetTypeEnum.DATA_SET_C:
                tempOptions = {...CreateDefaults.DATA_SET.C, ...tempOptions};
                break;
            case CreateDataSetTypeEnum.DATA_SET_CLASSIC:
                tempOptions = {...CreateDefaults.DATA_SET.CLASSIC, ...tempOptions};
                break;
            default:
                validCmdType = false;
                break;
        }

        if (!validCmdType) {
            throw new ImperativeError({msg: ZosFilesMessages.unsupportedDatasetType.message});
        } else {
            try {
                // Handle the size option
                if (!isNullOrUndefined(tempOptions.size)) {
                    const tAlcunit = tempOptions.size.toString().match(/[a-zA-Z]+/g);
                    if (!isNullOrUndefined(tAlcunit)) {
                        tempOptions.alcunit = tAlcunit.join("").toUpperCase();
                    }

                    const tPrimary = tempOptions.size.toString().match(/[0-9]+/g);
                    if (!isNullOrUndefined(tPrimary)) {
                        tempOptions.primary = +(tPrimary.join(""));

                        if (!secondarySpecified) {
                            const TEN_PERCENT = 0.10;
                            tempOptions.secondary = Math.round(tempOptions.primary * TEN_PERCENT);
                        }
                    }

                    delete tempOptions.size;
                }

                let response = "";
                // Handle the print attributes option
                if (!isNullOrUndefined(tempOptions.showAttributes)) {
                    if (tempOptions.showAttributes) {
                        delete tempOptions.showAttributes;
                        response = TextUtils.prettyJson(tempOptions);
                    } else {
                        delete tempOptions.showAttributes;
                    }
                }

                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dataSetName;

                Create.dataSetValidateOptions(tempOptions);

                const data = await ZosmfRestClient.postExpectString(session, endpoint, [], JSON.stringify(tempOptions));

                return {
                    success: true,
                    commandResponse: response + ZosFilesMessages.dataSetCreatedSuccessfully.message
                };
            } catch (error) {
                throw error;
            }
        }
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
            if (tempOptions.hasOwnProperty(option)) {
                switch (option) {

                    case "alcunit":
                        // zOSMF defaults to TRK if missing so mimic it's behavior
                        if (isNullOrUndefined(tempOptions.alcunit)) {
                            tempOptions.alcunit = "TRK";
                        }

                        // Only CYL and TRK valid
                        switch (tempOptions.alcunit.toUpperCase()) {
                            case "CYL":
                            case "TRK":
                                break;
                            default:
                                throw new ImperativeError({msg: ZosFilesMessages.invalidAlcunitOption.message + tempOptions.alcunit});
                        }

                        break;

                    case "avgblk":
                        // no validation at this time
                        break;

                    case "blksize":
                        // zOSMF defaults to TRK if missing so mimic it's behavior
                        if (isNullOrUndefined(tempOptions.blksize)) {
                            tempOptions.blksize = tempOptions.lrecl;
                        }
                        break;

                    case "lrecl":
                        // Required
                        ImperativeExpect.toNotBeNullOrUndefined(tempOptions.lrecl, ZosFilesMessages.missingRecordLength.message);

                        break;

                    case "dirblk":
                        // Validate non-zero if dsorg is PS
                        if (tempOptions.dirblk !== 0 && tempOptions.dsorg === "PS") {
                            throw new ImperativeError({msg: ZosFilesMessages.invalidPSDsorgDirblkCombination.message});
                        }
                        // Validate non-zero if 'dsorg' is PO
                        if (tempOptions.dirblk === 0 && tempOptions.dsorg === "PO") {
                            throw new ImperativeError({msg: ZosFilesMessages.invalidPODsorgDirblkCombination.message});
                        }

                        break;

                    case "dsntype":
                        // Key to create a PDSE.  Only valid value is LIBRARY (as far as I know)
                        switch (tempOptions.dsntype.toUpperCase()) {
                            case "LIBRARY":
                                break;

                            default:
                                throw new ImperativeError({msg: ZosFilesMessages.invalidDsntypeOption.message + tempOptions.dsntype});
                        }

                        break;

                    case "dsorg":
                        // Only PO and PS valid
                        switch (tempOptions.dsorg.toUpperCase()) {
                            case "PO":
                            case "PS":
                                break;

                            default:
                                throw new ImperativeError({msg: ZosFilesMessages.invalidDsorgOption.message + tempOptions.dsorg});
                        }

                        break;

                    case "primary":
                        // Required
                        ImperativeExpect.toNotBeNullOrUndefined(tempOptions.primary, ZosFilesMessages.missingPrimary.message);

                        // Validate maximum allocation quantity
                        if (tempOptions.primary > ZosFilesConstants.MAX_ALLOC_QUANTITY) {
                            throw new ImperativeError({msg: ZosFilesMessages.maximumAllocationQuantityExceeded.message + " for 'primary'."});
                        }
                        break;

                    case "secondary":
                        // zOSMF defaults to 0 if missing so mimic it's behavior
                        if (isNullOrUndefined(tempOptions.secondary)) {
                            tempOptions.secondary = 0;
                        }

                        // Validate maximum allocation quantity
                        if (tempOptions.secondary > ZosFilesConstants.MAX_ALLOC_QUANTITY) {
                            throw new ImperativeError({msg: ZosFilesMessages.maximumAllocationQuantityExceeded.message + " for 'secondary'."});
                        }
                        break;

                    case "recfm":
                        // zOSMF defaults to F if missing so mimic it's behavior
                        if (isNullOrUndefined(tempOptions.recfm)) {
                            tempOptions.recfm = "F";
                        }

                        // F, V, or U are required; B, A, M, S, T or additional
                        // VBA works on mainframe but not via zOSMF
                        switch (tempOptions.recfm.toUpperCase()) {
                            case "F":
                            case "FB":
                            case "V":
                            case "VB":
                            case "U":
                                break;
                            default:
                                throw new ImperativeError({msg: ZosFilesMessages.invalidRecfmOption.message + tempOptions.recfm});
                        }
                        break;

                    // SMS class values
                    case "mgntclass":
                    case "storeclass":
                    case "dataclass":
                        // no validation

                        break;

                    case "unit":
                    case "volser":
                        // no validation

                        break;

                    default:
                        throw new ImperativeError({msg: ZosFilesMessages.invalidFilesCreateOption.message + option});

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
     *     session = ZosmfSession.createBasicZosmfSession(profile);
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
        if (!isNullOrUndefined(idcamsOptions.showAttributes)) {
            if (idcamsOptions.showAttributes) {
                delete idcamsOptions.showAttributes;
                attribText = strings.COMMON.ATTRIBUTE_TITLE + TextUtils.prettyJson(idcamsOptions);
            } else {
                delete idcamsOptions.showAttributes;
            }
        }

        try {
            this.vsamValidateOptions(idcamsOptions);

            // We invoke IDCAMS to create the VSAM cluster
            const idcamsCmds = this.vsamFormIdcamsCreateCmd(dataSetName, idcamsOptions);
            Logger.getAppLogger().debug("Invoking this IDCAMS command:\n" + idcamsCmds.join("\n"));
            const idcamsResponse: IZosFilesResponse = await Invoke.ams(session, idcamsCmds);
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
     * @param {AbstractSession} session                     - z/OSMF connection info
     * @param {string} ussFilePath               - USS path to create file or directory
     * @param {string} type                          - the request type "file" or "directory"
     * @param {string} mode                          - the characters to describe permissions
     * @returns {Promise<IZosFilesResponse>}
     */
    public static uss(session: AbstractSession,
                      ussFilePath: string,
                      type: string,
                      mode?: string) {
        ImperativeExpect.toNotBeNullOrUndefined(type, ZosFilesMessages.missingRequestType.message);
        ImperativeExpect.toNotBeEqual(type, "", ZosFilesMessages.missingRequestType.message);

        const parameters: string = `${ZosFilesConstants.RESOURCE}/${ZosFilesConstants.RES_USS_FILES}${ussFilePath}`;
        const headers: object[] = [ZosmfHeaders.X_CSRF_ZOSMF_HEADER, {"Content-Type": "application/json"}];
        let payload: object = { type };
        if(mode) {
            payload = {...payload, ...{ mode }};
        }
        return ZosmfRestClient.postExpectString(session, parameters, headers, payload);
    }

    // ____________________________________________________________________________
    /**
     * Convert the options received from the CLI into options that we supply to IDCAMS.
     * @param {ICreateVsamOptions} cliOptions - The set of options from our CLI
     * @returns {ICreateVsamOptions} - Options to provide to IDCAMS.
     */
    private static vsamConvertToIdcamsOptions(cliOptions: ICreateVsamOptions): ICreateVsamOptions {
        // Removes undefined properties
        let idcamsOptions = isNullOrUndefined(cliOptions) ? {} : JSON.parse(JSON.stringify(cliOptions));

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
        idcamsOptions = {...CreateDefaults.VSAM, ...idcamsOptions};

        // when secondary is not specified, use 10% of primary
        if (isNullOrUndefined(idcamsOptions.secondary)) {
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
            (options.storeclass ? "STORAGECLASS(" + options.storeclass + ") -\n" : "") +
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
            if (options.hasOwnProperty(option)) {
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
                                    strings.COMMON.FOR + " '" + option + "' " + strings.COMMON.WITH_VALUE +
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
                    case "storeclass":
                    case "mgntclass":
                    case "dataclass":
                        // no validation at this time
                        break;

                    default:
                        throw new ImperativeError({msg: ZosFilesMessages.invalidFilesCreateOption.message + option});

                } // end switch
            }
        } // end for
    }
}
