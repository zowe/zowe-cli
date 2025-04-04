# Change Log

All notable changes to the Zowe z/OS files SDK package will be documented in this file.

## Recent Changes

- Enhancement: Added support for the `attributes`, `recall`, and `volume` options to the `List.dataSetsMatchingPattern` function. [#2476](https://github.com/zowe/zowe-cli/issues/2476)

## `8.17.0`

- Enhancement: Adding the `responseTimeout` option to missing areas in the ZosFiles SDK so that the option is allowable on all methods. [#2467](https://github.com/zowe/zowe-cli/pull/2467)

## `8.16.0`

- Enhancement: Added the ability to search data sets with regex patterns by setting `ISearchOptions.regex` to `true`. [#2432](https://github.com/zowe/zowe-cli/issues/2432)
- Ehancement: Added optional field `ISearchMatchLocation.length` which provides the length of the match on a string. [#2443](https://github.com/zowe/zowe-cli/pull/2443)

## `8.15.0`

- BugFix: Modified the `Copy.copyPDS()` function to have `sourceMemberList` as an optional parameter to avoid a breaking change. [#2453](https://github.com/zowe/zowe-cli/pull/2453)
- Enhancement: Added the `overwrite` parameter to the `Copy.DataSet()` command to allow for overwriting all members of a target data set with source data set members. [#2450] (https://github.com/zowe/zowe-cli/pull/2450)

## `8.14.1`

-BugFix: When using the copy command with a non existent source data set, an unclear error was displayed to the user. Now, a more user-friendly message is provided [#2447] (https://github.com/zowe/zowe-cli/issues/2447).
-BugFix: The updated logic to determine whether a data set is a partitioned data set now ensures that the `dsorg` attributes of types `PO-E`, `PO-L`, `PO-U` are handled correctly. [#2390] (https://github.com/zowe/zowe-cli/issues/2390).

- BugFix: When using the `copy` command, if a target partitioned data set has a smaller record length than a source partitioned data set, the operation for subsequent members no longer stops. The user can now view the affected members in a local file. [#2349] (https://github.com/zowe/zowe-cli/issues/2349)
- BugFix: Users were not warned when copying partitioned data sets with identical member names. Now, the user is prompted to confirm before continuing the copy operation to avoid potential data loss. [#2349] (https://github.com/zowe/zowe-cli/issues/2349)

## `8.13.0`

- BugFix: The `Create.dataSetValidateOptions()` function now correctly handles data set creation when the `dsorg` attribute is set to `PS-L` by automatically updating the `dsntype` attribute to `LARGE`. [#2141](https://github.com/zowe/zowe-cli/issues/2141)
- BugFix: Fixed an issue in the `Copy.dataSetCrossLPAR()` function where the `spacu` attribute of the copied data set was always set to `TRK`, regardless of the source data set's attributes. [#2412](https://github.com/zowe/zowe-cli/issues/2412)
- BugFix: The `Copy.data.set` function now prompts the user to confirm before overwriting the contents of the target data set with the addition of the `--safe-replace` option. [#2369] (https://github.com/zowe/zowe-cli/issues/2369)

## `8.12.0`

- Enhancement: The `Copy.dataset` function now creates a new data set if the entered target data set does not exist. [#2349](https://github.com/zowe/zowe-cli/issues/2349)
- Enhancement: Added the `maxLength` option to List SDK functions (`allMembers`, `dataSetsMatchingPattern`, `membersMatchingPattern`) to specify the maximum number of items to return. [#2409](https://github.com/zowe/zowe-cli/pull/2409)
- Enhancement: Added the `start` option to List SDK functions (`allMembers`, `dataSetsMatchingPattern`, `membersMatchingPattern`) to specify the first data set/member name to return in the response. [#2409](https://github.com/zowe/zowe-cli/pull/2409)

## `8.10.3`

- BugFix: The `Copy.dataset` method no longer copies all partitioned data set members if a member is passed to the function. [#2402](https://github.com/zowe/zowe-cli/pull/2402)

## `8.10.0`

- Enhancement: The `Copy.dataset` method now recognizes partitioned data sets and can copy members of a source PDS into an existing target PDS. [#2386](https://github.com/zowe/zowe-cli/pull/2386)

## `8.9.1`

- BugFix: Corrected the `apiResponse` response value from `streamToDataSet()`,`streamToUss()`,`bufferToUss()` and `bufferToDataSet()` on the Upload SDK. [#2381](https://github.com/zowe/zowe-cli/pull/2381)
- BugFix: Corrected the `Upload.BufferToUssFile()` SDK function to properly tag uploaded files. [#2378](https://github.com/zowe/zowe-cli/pull/2378)

## `8.9.0`

- Enhancement: Added a `List.membersMatchingPattern` method to download all members that match a specific pattern.[#2359](https://github.com/zowe/zowe-cli/pull/2359)

## `8.8.4`

- Enhancement: Allows extenders of the Search functionality to pass a function `abortSearch` on `searchOptions` to abort a search. [#2370](https://github.com/zowe/zowe-cli/pull/2370)

## `8.8.3`

- BugFix: Resolved issue where special characters could be corrupted when downloading a large file. [#2366](https://github.com/zowe/zowe-cli/pull/2366)

## `8.8.0`

- Enhancement: Allows for passing a `.zosattributues` file path for the download encoding format via the `attributes` option on the `Download.ussFile` method. [#2322](https://github.com/zowe/zowe-cli/issues/2322)
- BugFix: Added support for the `--encoding` flag to the `zowe upload dir-to-uss` to allow for encoding uploaded directories for command group consistency. [#2337](https://github.com/zowe/zowe-cli/issues/2337)

## `8.6.2`

- BugFix: Resolved issue where encoding argument was missing from `FileToUss.handler.ts` options object. [#2234](https://github.com/zowe/zowe-cli/pull/2334)
- BugFix: Resolved issue where `FileToUss.handler.ts` options object was not properly passed through subsequent command calls. [#2234](https://github.com/zowe/zowe-cli/pull/2334)

## `8.4.0`

- Enhancement: Added optional `--attributes` flag to `zowe zos-files upload file-to-uss` to allow passing a .zosattributes file path for upload encoding format. [#2319](https://github.com/zowe/zowe-cli/pull/2319)

## `8.2.0`

- Enhancement: Added an optional `continueSearch` function to the `ISearchOptions` interface. After a data set listing is completed, the new function is called with the list of data sets about to be searched. This allows the extender or end users to continue with the search or cancel it. [#2300](https://github.com/zowe/zowe-cli/pull/2300)

## `8.1.1`

- BugFix: Updated peer dependencies to `^8.0.0`, dropping support for versions tagged `next`. [#2287](https://github.com/zowe/zowe-cli/pull/2287)
- BugFix: Fixed an issue with the `List.dataSetsMatchingPattern` method where migrated data sets could break fetching attributes for other data sets. [#2285](https://github.com/zowe/zowe-cli/issues/2285)

## `8.0.0`

- MAJOR: v8.0.0 Release

## `8.0.0-next.202409191615`

- Update: Final prerelease

## `8.0.0-next.202408131445`

- Update: See `7.28.3` for details

## `8.0.0-next.202407021516`

- BugFix: Updated dependencies for technical currency [#2188](https://github.com/zowe/zowe-cli/pull/2188)

## `8.0.0-next.202406111958`

- LTS Breaking: Modified the zos-files SDK. [#2083](https://github.com/zowe/zowe-cli/issues/2083)
  - Deprecated the following interfaces:
    - IOptionsFullResponse - use `IOptionsFullResponse` from `@zowe/imperative`.
    - IRestClientResponse - use `IRestClientResponse` from `@zowe/imperative`.

## `8.0.0-next.202406111728`

- BugFix: Fixed error where `Get.dataSet` and `Get.USSFile` methods could silently fail when downloading large data sets or files. [#2167](https://github.com/zowe/zowe-cli/pull/2167)

## `8.0.0-next.202405202020`

- BugFix: Fixed a bug where a data set search would not return a search term if it was at the beginning of a line. [#2147](https://github.com/zowe/zowe-cli/pull/2147)

## `8.0.0-next.202405101931`

- Enhancement: Added the ability to search for a string in a data set or PDS member matching a pattern. [#2095](https://github.com/zowe/zowe-cli/issues/2095)

## `8.0.0-next.202404032038`

- BugFix: Fixed error that could occur when listing data set members that contain control characters in the name. [#2104](https://github.com/zowe/zowe-cli/pull/2104)

## `8.0.0-next.202403132009`

- LTS Breaking: Changed return type of `Upload.bufferToUssFile` to return `IZosFilesResponse` object instead of string. [#2089](https://github.com/zowe/zowe-cli/pull/2089)
- BugFix: Fixed `Upload.bufferToUssFile` not normalizing new lines when uploading plain text. [#2089](https://github.com/zowe/zowe-cli/pull/2089)

## `8.0.0-next.202403041352`

- BugFix: Updated engine to Node 18.12.0. [#2074](https://github.com/zowe/zowe-cli/pull/2074)

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

## `7.28.3`

- BugFix: Refactored code to reduce the use of deprecated functions to prepare for upcoming Node.js 22 support. [#2191](https://github.com/zowe/zowe-cli/issues/2191)

## `7.26.1`

- BugFix: Fixed `Get.dataSet` and `Get.USSFile` methods so that they return an empty buffer instead of null for empty files. [#2173](https://github.com/zowe/zowe-cli/pull/2173)

## `7.26.0`

- BugFix: Fixed error where `Get.dataSet` and `Get.USSFile` methods could silently fail when downloading large data sets or files. [#2167](https://github.com/zowe/zowe-cli/pull/2167)

## `7.24.0`

- BugFix: Fixed error that could occur when listing data set members that contain control characters in the name. [#2104](https://github.com/zowe/zowe-cli/pull/2104)

## `7.23.7`

- BugFix: Fixed `Upload.bufferToUssFile` not normalizing new lines when uploading plain text. [#2091](https://github.com/zowe/zowe-cli/pull/2091)

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
