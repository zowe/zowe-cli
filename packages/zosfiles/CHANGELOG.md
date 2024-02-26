# Change Log

All notable changes to the Zowe z/OS files SDK package will be documented in this file.

## `8.0.0-next.202402261705`

- BugFix: Updated additional dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)
- BugFix: Updated engine to Node 16.7.0. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202402211923`

- BugFix: Updated dependencies for technical currency. [#2057](https://github.com/zowe/zowe-cli/pull/2057)

## `8.0.0-next.202402132108`

- LTS Breaking: Removed record format (recfm) validation when creating data-sets [#1699](https://github.com/zowe/zowe-cli/issues/1699)

## `8.0.0-next.202402021649`

- LTS Breaking: Removed the unused protected property `mSshProfile` in SshBaseHandler.
- LTS Breaking: Removed the following previously deprecated items:
  - Removed `ZosFilesCreateExtraOptions.showAttributes` without replacement
  - Removed `allDataSetsArchived`, `datasetsDownloadedSuccessfully`, `noDataSetsMatchingPatternRemain` and `onlyEmptyPartitionedDataSets` from ZosFiles.messages.ts

## `8.0.0-next.202311282012`

- LTS Breaking: Unpinned dependency versions to allow for patch/minor version updates for dependencies [#1968](https://github.com/zowe/zowe-cli/issues/1968)

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.21.3`

- BugFix: Corrects the behavior of `Create.dataSetLike` so that the new data set is always defined with the correct block size [#2610](https://github.com/zowe/vscode-extension-for-zowe/issues/2610)

## `7.20.0`

- Enhancement: Adds `ZosFilesUtils.getDataSetFromName` to create an IDataSet from a dataset name [#1696](https://github.com/zowe/zowe-cli/issues/1696)

## `7.18.9`

- BugFix: Fix behavior where a specified directory was being lowercased on non-PDS datasets when downloading all datasets [#1722](https://github.com/zowe/zowe-cli/issues/1722)

## `7.18.8`

- Enhancement: Patch that adds invalidFileName to ZosFilesMessages

## `7.18.0`

- BugFix: Fixed error when listing data set members that include double quote in the name.

## `7.17.0`

- Enhancement: Added streaming capabilities to the `Download.dataSet` and `Download.ussFile` methods.
- BugFix: Fixed `Get.USSFile` API not respecting USS file tags.

## `7.16.6`

- BugFix: Fixed error when listing data set members that include backslash in the name.

## `7.16.5`

- BugFix: Fixed `Create.dataset` failing when `CreateDataSetTypeEnum.DATA_SET_BLANK` is passed but no other options are specified.
- BugFix: Added check for invalid block size when creating a sequential data set using the `Create.dataset` SDK method. [#1439](https://github.com/zowe/zowe-cli/issues/1439)
- BugFix: Added the ability to list all data set members when some members have invalid names.
- BugFix: Removed extra calls to list datasets matching patterns if authentication to z/OSMF fails.

## `7.16.4`

- BugFix: Fixed `secondary` option being specified on `BLANK` type datasets [#1595](https://github.com/zowe/zowe-cli/issues/1595)

## `7.16.1`

- BugFix: Fixed `binary` option ignored by `Download.ussDir` and `Upload.dirToUSSDir` when ".zosattributes" file is used.
- BugFix: Fixed `includeHidden` option ignored by `Upload.dirToUSSDir`.

## `7.15.0`

- Enhancement: Added `Copy.dataSetCrossLPAR` method to support copying a dataset or members from one LPAR to another.
- BugFix: Correct improper overwrite error with PDS member to PDS member copy.

## `7.12.0`

- BugFix: Fixed encoding option for `Get.USSFile` SDK method [#1495](https://github.com/zowe/zowe-cli/issues/1495)

## `7.11.2`

- BugFix: Added URI encoding to user input that is sent to z/OSMF in the URL

## `7.11.1`

- BugFix: Added missing RECFM values documented by IBM as valid RECFM values so that an end user does not received invalid RECFM error message while trying to create a dataset. [#1639](https://github.com/zowe/zowe-cli/issues/1639)

## `7.7.0`

- Enhancement: Add options to `Get.dataSet` to get a range value of `SSS-EEE` or `SSS,NNN`.

## `7.6.2`

- BugFix: Updated `minimatch` dependency for technical currency.
- BugFix: Added to the description of Create.ts `cmdType`. [#48](https://github.com/zowe/zowe-cli/issues/48)
- BugFix: Modified the progress bar for USS file uploads to increase readibility. [#451](https://github.com/zowe/zowe-cli/issues/451)

## `7.6.0`

- Enhancement: Updated the `List.fileList` method to support z/OSMF filter parameters such as "mtime" and "name".
- Enhancement: Added `Download.ussDir` method to download the contents of a USS directory.
- Enhancement: Updated the `Upload.streamToUssFile` method to "chtag" files after uploading them.

## `7.4.2`

- BugFix: Added errorMessage property to `IZosFilesResponse` to provide more specific error messages.

## `7.3.0`

- Enhancement: Added `Download.dataSetsMatchingPattern` method to download all data sets that match a DSLEVEL pattern.

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `7.0.0-next.202204111828`

- Enhancement: Added check for USS tags to `Download.ussFile` method to automatically detect file encoding. [#740](https://github.com/zowe/zowe-cli/issues/740)
- **Breaking:** Changed type of `encoding` property on `IOptions` interface from number to string.

## `7.0.0-next.202203282106`

- Enhancement: Added support for `record` data type on dataset upload, download, and get APIs.

## `7.0.0-next.202112142155`

- Breaking: Removed deprecated methods:
  - bufferToUSSFile -> buffertoUssFile
  - streamToUSSFile -> streamToUssFile
  - fileToUSSFile -> fileToUssFile

## `6.33.1`

- Development: Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

## `6.32.0`

- BugFix: Fixed the volser/volume option of `IListOptions` being ignored by the `List.dataset` method.

## `6.31.1`

- Bugfix: Ensured that the `like` field will always be added to all allocate like requests regardless of whether the `options` parameter is defined or not. [#1017](https://github.com/zowe/zowe-cli/pull/1017)

## `6.29.0`

- Enhancement: Added a standard data set template with no parameters set.

## `6.28.0`

- Enhancement: Added "Accept-Encoding: gzip" header to all z/OSMF requests

## `6.27.0`

- Enhancement: Added a `like` option to the `zowe zos-files create data-set` command. Use this option to like datasets. Here the arguments were added for the same. [#771](https://github.com/zowe/zowe-cli/issues/771)

## `6.24.4`

- Bugfix: Removed unnecessary dependency on zosuss SDK.

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
