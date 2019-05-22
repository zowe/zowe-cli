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

import { getErrorContext } from "../../../../utils/src/CoreUtils";
import { ZosFilesConstants } from "./ZosFiles.constants";
import { IMessageDefinition } from "@zowe/imperative";

/**
 * Messages to be used as command responses for different scenarios
 * @type {object.<string, IMessageDefinition>}
 * @memberOf ZosFilesMessages
 */
export const ZosFilesMessages: { [key: string]: IMessageDefinition } = {
    /**
     * Message indicating that the data set type is unsupported
     * @type {IMessageDefinition}
     */
    unsupportedDatasetType: {
        message: "Unsupported data set type."
    },

    unsupportedMaskingInDataSetName: {
        message: "Unsupported masking character found in data set name."
    },

    /**
     * Message indicating that the data set type is required
     * @type {IMessageDefinition}
     */
    missingDatasetType: {
        message: "Specify the data set type."
    },

    /**
     * Message indicating that the data set name is required
     * @type {IMessageDefinition}
     */
    missingDatasetName: {
        message: "Specify the data set name."
    },

    /**
     * Message indicating that the USS File name is required
     * @type {IMessageDefinition}
     */
    missingUSSFileName: {
        message: "Specify the USS file name."
    },

    /**
     * Message indicating that the payload is required
     * @type {IMessageDefinition}
     */
    missingPayload: {
        message: "Specify the payload."
    },

    /**
     * Message indicating that the USS directory name is required
     * @type {IMessageDefinition}
     */
    missingUSSDirectoryName: {
        message: "Specify the USS directory name."
    },

    /**
     * Message indicating that the request type is required
     * @type {IMessageDefinition}
     */
    missingRequestType: {
        message: "Specify request type, file or directory."
    },

    /**
     * Message indicating that the input file is required
     * @type {IMessageDefinition}
     */
    missingInputFile: {
        message: "Specify the input file and, if needed, the path."
    },

    /**
     * Message indicating that the input directory path is required
     * @type {IMessageDefinition}
     */
    missingInputDirectory: {
        message: "Specify directory path, to upload."
    },

    /**
     * Message indicating that the input directory is required
     * @type {IMessageDefinition}
     */
    missingInputDir: {
        message: "Specify the input directory path."
    },

    /**
     * Message indicating that the data set was created successfully
     * @type {IMessageDefinition}
     */
    dataSetCreatedSuccessfully: {
        message: "Data set created successfully."
    },

    /**
     * Message indicating that the data set was deleted successfully
     * @type {string}
     */
    datasetDeletedSuccessfully: {
        message: "Data set deleted successfully."
    },

    /**
     * Message indicating that the data set was downloaded successfully
     * @type {string}
     */
    datasetDownloadedSuccessfully: {
        message: "Data set downloaded successfully.\nDestination: %s"
    },

    /**
     * Message indicating that the uss file was downloaded successfully
     * @type {string}
     */
    ussFileDownloadedSuccessfully: {
        message: "USS file downloaded successfully.\nDestination: %s"
    },

    /**
     * Message indicating that the uss file was uploaded successfully
     * @type {string}
     */
    ussFileUploadedSuccessfully: {
        message: "USS file uploaded successfully."
    },

    /**
     * Message indicating that the uss directory was uploaded successfully
     * @type {string}
     */
    ussDirUploadedSuccessfully: {
        message: "Directory uploaded successfully."
    },

    /**
     * Message indicating that the USS file or directory was deleted successfully
     * @type {string}
     */
    ussFileDeletedSuccessfully: {
        message: "USS File or directory deleted successfully."
    },

    /**
     * Message indicating that the data sets matching pattern was downloaded successfully
     * @type {string}
     */
    datasetsDownloadedSuccessfully: {
        message: "Data sets matching pattern downloaded successfully.\nDestination: %s"
    },

    /**
     * Message indicating that file is uploaded to data set successfully
     * @type {string}
     */
    dataSetUploadedSuccessfully: {
        message: "Data set uploaded successfully."
    },

    /**
     * Message indicating that the no members were found
     * @type {string}
     */
    noMembersFound: {
        message: "No members found!"
    },

    /**
     * Message indicating the 'create' command options is null or undefined
     * @type {IMessageDefinition}
     */
    missingFilesCreateOptions: {
        message: "No zos-files create command options."
    },

    /**
     * Message indicating an invalid 'create' command option
     * @type {IMessageDefinition}
     */
    invalidFilesCreateOption: {
        message: "Invalid zos-files create command option: "
    },

    /**
     * Message indicating invalid 'create' command 'dsntype' option
     * @type {IMessageDefinition}
     */
    invalidDsntypeOption: {
        message: "Invalid zos-files create command 'dsntype' option: "
    },

    /**
     * Message indicating invalid 'create' command 'alcunit' option
     * @type {IMessageDefinition}
     */
    invalidAlcunitOption: {
        message: "Invalid zos-files create command 'alcunit' option: "
    },

    /**
     * Message indicating 'create' command 'primary' option is required
     * @type {IMessageDefinition}
     */
    missingPrimary: {
        message: "Specify the primary allocation (primary) to create a data set."
    },

    /**
     * Message indicating invalid 'create' command 'dsorg' option
     * @type {IMessageDefinition}
     */
    invalidDsorgOption: {
        message: "Invalid zos-files create command 'dsorg' option: "
    },

    /**
     * Message indicating invalid 'create' command 'recfm' option
     * @type {IMessageDefinition}
     */
    invalidRecfmOption: {
        message: "Invalid zos-files create command 'recfm' option: "
    },

    /**
     * Message indicating that directory blocks must be zero if the data set organization is 'PS'
     * @type {IMessageDefinition}
     */
    invalidPSDsorgDirblkCombination: {
        message: "'PS' data set organization (dsorg) specified and the directory blocks (dirblk) is not zero."
    },

    /**
     * Message indicating that directory blocks cannot be zero if the data set organization is 'PO'
     * @type {IMessageDefinition}
     */
    invalidPODsorgDirblkCombination: {
        message: "'PO' data set organization (dsorg) specified and the directory blocks (dirblk) is zero."
    },

    /**
     * Message indicating the maximum allocation quantity has been exceeded
     * @type {IMessageDefinition}
     */
    maximumAllocationQuantityExceeded: {
        message: `Maximum allocation quantity of ${ZosFilesConstants.MAX_ALLOC_QUANTITY} exceeded`
    },

    /**
     * Message indicating 'create' command 'lrecl' option is required
     * @type {IMessageDefinition}
     */
    missingRecordLength: {
        message: "Specify the record length (lrecl) to create a data set."
    },

    /**
     * Message indicating that the AMS statements is required
     * @type {IMessageDefinition}
     */
    missingStatements: {
        message: "Missing AMS statements to be submitted."
    },

    /**
     * Message indicating that the an expected VSAM option was not supplied.
     * @type {IMessageDefinition}
     */
    missingVsamOption: {
        message: "To create a VSAM cluster, the following option must be supplied: "
    },

    /**
     * Message indicating that the an expected VSAM option was not supplied.
     * @type {IMessageDefinition}
     */
    valueOutOfBounds: {
        message: "The {{optionName}} value = '{{value}}' must be between {{minValue}} and {{maxValue}}."
    },

    /**
     * Message indicating that the AMS commands was executed successfully
     * @type {IMessageDefinition}
     */
    amsCommandExecutedSuccessfully: {
        message: "AMS command executed successfully."
    },

    /**
     * Message indicating that the AMS commands was too long to be passed to z/OS MF
     * @type {IMessageDefinition}
     */
    longAmsStatement: {
        message: "Line %d is longer than %d characters (maximum allowed length)\n%s"
    },

    /**
     * Message indicating that input path is not a directory
     * @type {IMessageDefinition}
     */
    pathIsNotDirectory: {
        message: "%s is not a directory"
    },

    /**
     * Message indicating that attempt to upload a directory to a data set member
     * @type {IMessageDefinition}
     */
    uploadDirectoryToDatasetMember: {
        message: "Upload a directory to a data set member is not permitted"
    },

    /**
     * Message indicating that attempt to upload a directory with multiple files to a physical sequential data set
     * @type {IMessageDefinition}
     */
    uploadDirectoryToPhysicalSequentialDataSet: {
        message: "Upload a directory with multiple files to a physical sequential data set is not permitted"
    },

    /**
     * Message indicating that patterns were not passed.
     * @type {IMessageDefinition}
     */
    missingPatterns: {
        message: "No pattern to match data sets passed."
    },

    /**
     * Message indicating that all data sets matching the provided patterns are archived.
     * @type {IMessageDefinition}
     */
    allDataSetsArchived: {
        message: "All data sets matching the selected pattern(s) were archived."
    },

    /**
     * Message indicating that no data sets remain to be downloaded after the excluded ones were filtered out.
     * @type {IMessageDefinition}
     */
    noDataSetsInList: {
        message: "No data sets left after excluded pattern(s) were filtered out."
    },

    /**
     * Message indicating that no data sets remain to be downloaded after the excluded ones were filtered out.
     * @type {IMessageDefinition}
     */
    noDataSetsMatchingPattern: {
        message: "There are no data sets that match the provided pattern(s)."
    },

    /**
     * Message indicating that no data sets remain to be downloaded after the excluded ones were filtered out.
     * @type {IMessageDefinition}
     */
    noDataSetsMatchingPatternRemain: {
        message: "After filtering out the archived files and files that match the exclusion-parameters, no data sets matching" +
        " the supported organization type remain."
    },

    /**
     * Message indicating that only empty partitioned data sets match the provided patterns
     * @type {IMessageDefinition}
     */
    onlyEmptyPartitionedDataSets: {
        message: "Only empty partitioned data sets match the provided patterns."
    },

    /**
     * Message indicating that a failure has happened in the NodeJS File System API
     */
    nodeJsFsError: {
        message: "Node.js File System API error"
    },

    /**
     * Messaging indicating invalid syntax in .zosattributes file
     */
    invalidAttributesSyntax: {
        message: "Syntax error on line {{lineNumber}} - expected <pattern> <local encoding> <remote encoding>."
    },

    /**
     * Messaging indicating an attributes file was not found
     */
    attributesFileNotFound: {
        message: "Attributes file {{file}} does not exist"
    },

    /**
     * Message indicating an error reading an attributes file
     */
    errorReadingAttributesFile: {
        message: "Could not read attributes file {{file}}: {{message}}"
    },

    /**
     * Message indicating an error parsing an attributes file
     */
    errorParsingAttributesFile: {
        message: "Error parsing attributes file {{file}}: {{message}}"
    }
};

