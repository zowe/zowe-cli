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

import { ZosFilesConstants } from "./ZosFiles.constants";
import { IMessageDefinition } from "@zowe/imperative";

/**
 * Messages to be used as command responses for different scenarios
 * @type {object.<string, IMessageDefinition>}
 * @memberof ZosFilesMessages
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
     * Message indicating that the data type is unsupported for USS files
     * @type {IMessageDefinition}
     */
    unsupportedDataType: {
        message: "Unsupported data type 'record' specified for USS file operation."
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
     * Message indicating that the data set "like" name is required
     * @type {IMessageDefinition}
     */
    missingDatasetLikeName: {
        message: "Specify the name of the data set to \"allocate like\" from."
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
     * @type {IMessageDefinition}
     */
    datasetDeletedSuccessfully: {
        message: "Data set deleted successfully."
    },

    /**
     * Message indicating that the data set was downloaded successfully
     * @type {IMessageDefinition}
     */
    datasetDownloadedSuccessfully: {
        message: "Data set downloaded successfully.\nDestination: %s"
    },

    /**
     * Message indicating that the uss file was downloaded successfully
     * @type {IMessageDefinition}
     */
    ussFileDownloadedSuccessfully: {
        message: "USS file downloaded successfully.\nDestination: %s"
    },

    /**
     * Message indicating that the uss file was uploaded successfully
     * @type {IMessageDefinition}
     */
    ussFileUploadedSuccessfully: {
        message: "USS file uploaded successfully."
    },

    /**
     * Message indicating that the uss directory was uploaded successfully
     * @type {IMessageDefinition}
     */
    ussDirUploadedSuccessfully: {
        message: "Directory uploaded successfully."
    },

    /**
     * Message indicating that the USS file or directory was deleted successfully
     * @type {IMessageDefinition}
     */
    ussFileDeletedSuccessfully: {
        message: "USS File or directory deleted successfully."
    },

    /**
     * Message indicating that the data sets matching pattern was downloaded successfully
     * @type {IMessageDefinition}
     * @deprecated
     */
    datasetsDownloadedSuccessfully: {
        message: "Data sets matching pattern downloaded successfully.\nDestination: %s"
    },

    /**
     * Message indicating that the data sets matching pattern were listed successfully
     * @type {IMessageDefinition}
     */
    dataSetsMatchedPattern: {
        message: "%d data set(s) were found matching pattern."
    },

    /**
     * Message indicating that file is uploaded to data set successfully
     * @type {IMessageDefinition}
     */
    dataSetUploadedSuccessfully: {
        message: "Data set uploaded successfully."
    },

    /**
     * Message indicating that the no members were found
     * @type {IMessageDefinition}
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
     * Message indicating that data set objects were not passed.
     * @type {IMessageDefinition}
     */
    missingDataSets: {
        message: "No list of data sets to download was passed."
    },

    /**
     * Message indicating that all data sets matching the provided patterns are archived.
     * @type {IMessageDefinition}
     * @deprecated
     */
    allDataSetsArchived: {
        message: "All data sets matching the selected pattern(s) were archived."
    },

    /**
     * Message indicating that no data sets remain to be downloaded after the excluded ones were filtered out.
     * @type {IMessageDefinition}
     * @deprecated
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
     * @deprecated
     */
    noDataSetsMatchingPatternRemain: {
        message: "After filtering out the archived files and files that match the exclusion-parameters, no data sets matching" +
        " the supported organization type remain."
    },

    /**
     * Message indicating that only empty partitioned data sets match the provided patterns
     * @type {IMessageDefinition}
     * @deprecated
     */
    onlyEmptyPartitionedDataSets: {
        message: "Only empty partitioned data sets match the provided patterns."
    },

    /**
     * Message indicating that some or all data sets failed to download
     * @type {IMessageDefinition}
     */
    failedToDownloadDataSets: {
        message: "Failed to download data sets"
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
    },

    /**
     * Message indicating that the file system name is required
     * @type {IMessageDefinition}
     */
    missingFileSystemName: {
        message: "Specify the file system name."
    },

    /**
     * Message indicating that an expected ZFS option was not supplied.
     * @type {IMessageDefinition}
     */
    missingZfsOption: {
        message: "To create a z/OS file system, the following option must be supplied: "
    },

    /**
     * Message indicating invalid 'create' command 'perms' option
     * @type {IMessageDefinition}
     */
    invalidPermsOption: {
        message: "Invalid zos-files create command 'perms' option: "
    },

    /**
     * Message indicating that the ZFS was created successfully
     * @type {IMessageDefinition}
     */
    zfsCreatedSuccessfully: {
        message: "z/OS file system created successfully."
    },

    /**
     * Message indicating that the ZFS was deleted successfully
     * @type {IMessageDefinition}
     */
    zfsDeletedSuccessfully: {
        message: "z/OS file system deleted successfully."
    },

    /**
     * Message indicating that the mount point is required
     * @type {IMessageDefinition}
     */
    missingMountPoint: {
        message: "Specify the mount point."
    },

    /**
     * Message indicating the 'mount' command options is null or undefined
     * @type {IMessageDefinition}
     */
    missingFilesMountOptions: {
        message: "No zos-files mount command options."
    },

    /**
     * Message indicating an invalid 'mount' command option
     * @type {IMessageDefinition}
     */
    invalidFilesMountOption: {
        message: "Invalid zos-files mount command option: "
    },

    /**
     * Message indicating that an expected file system option was not supplied.
     * @type {IMessageDefinition}
     */
    missingFsOption: {
        message: "To mount a file system, the following option must be supplied: "
    },

    /**
     * Message indicating invalid 'mount' command 'mode' option
     * @type {IMessageDefinition}
     */
    invalidMountModeOption: {
        message: "Invalid zos-files mount command 'mode' value: "
    },

    /**
     * Message indicating that the file system was mounted successfully.
     * @type {IMessageDefinition}
     */
    fsMountedSuccessfully: {
        message: "File system mounted successfully."
    },

    /**
     * Message indicating that the file system was unmounted successfully.
     * @type {IMessageDefinition}
     */
    fsUnmountedSuccessfully: {
        message: "File system unmounted successfully."
    },

    /**
     * Message indicating that the uss file or directory crated successfully.
     * @type {IMessageDefinition}
     */
    ussCreatedSuccessfully: {
        message: "USS file or directory created successfully."
    },

    /**
     * Message indicating that the data set was recalled successfully.
     * @type {IMessageDefinition}
     */
    datasetRecalledSuccessfully: {
        message: "Data set recall requested."
    },

    /**
     * Message indicating that the data set has been renamed successfully.
     * @type {IMessageDefinition}
     */
    dataSetRenamedSuccessfully: {
        message: "Data set renamed successfully."
    },

    /**
     * Message indicating that the data set was deleted successfully.
     * @type {IMessageDefinition}
     */
    datasetDeletionRequested: {
        message: "Data set deletion requested."
    },

    /**
     * Message indicating that the data set was migrated successfully.
     * @type {IMessageDefinition}
     */
    datasetMigrationRequested: {
        message: "Data set migration requested."
    },

    /**
     * Message indicating that the data set was recalled successfully.
     * @type {IMessageDefinition}
     */
    datasetRecallRequested: {
        message: "Data set recall requested."
    },

    /**
     * Message indicating that the data set was copied successfully
     * @type {IMessageDefinition}
     */
    datasetCopiedSuccessfully: {
        message: "Data set copied successfully."
    },

    /**
     * Message indicating that the following members failed to properly download
     * @type {IMessageDefinition}
     */
    memberDownloadFailed: {
        message: "Failed to download the following members: \n"
    },

    /**
     * Message indicating that the following data sets failed to properly download
     * @type {IMessageDefinition}
     */
    datasetDownloadFailed: {
        message: "Failed to download the following data sets: \n"
    },

    /**
     * Message indicating the attributes are used during dataset creation
     * @type {IMessageDefinition}
     */
    attributeTitle: {
        message: "The following attributes are used during creation:\n"
    },

    /**
     * Message to be used when throwing an imperative error during dataset creation
     * @type {IMessageDefinition}
     */
    commonFor: {
        message: "for"
    },

    /**
     * Message to be used when throwing an imperative error during dataset creation
     * @type {IMessageDefinition}
     */
    commonWithValue: {
        message: "with value"
    }
};
