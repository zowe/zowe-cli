# Change Log

All notable changes to the Zowe z/OS jobs SDK package will be documented in this file.

## Recent Changes

- BugFix: Updated dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)
- BugFix: Updated engine to Node 16.7.0. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202402211923`

- Enhancement: New `SeachJob.searchJobs` class and method, which can be used to search spool files for a specified string or regular expression. 

## `8.0.0-next.202402021649`

- LTS Breaking: Removed `getSpoolDownloadFile` use `getSpoolDownloadFilePath` instead

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.17.0`

- Enhancement: Set properties for GetJobs errors for use in a more user-friendly format with the ZOWE_V3_ERR_FORMAT environment variable. [zowe-cli#935](https://github.com/zowe/zowe-cli/issues/935)

## `7.14.0`

- Enhancement: Added streaming capabilities to the `DownloadJobs.downloadSpoolContentCommon` method. [Zowe Explorer #2060](https://github.com/zowe/vscode-extension-for-zowe/issues/2060)

## `7.11.3`

- BugFix: Added URI encoding to user input that is sent to z/OSMF in the URL [#1596](https://github.com/zowe/zowe-cli/issues/1596)

## `7.11.0`

-BugFix: Enabled option to download output from a submitted job with the "directory" option. The `IDownloadSpoolContentParms` interface now supports an "extension" flag which enables changes to file extension as originally intended. [#729](https://github.com/zowe/zowe-cli/issues/729)

## `7.10.4`

- BugFix: Changed default value for modify-jobs option in the CancelJobs and DeleteJobs classes to 2.0. This change results in calls to z/OSMF becoming synchronous, and a successful response from the modify, cancel, and delete commands indicates the requested action was completed successfully. [#1459](https://github.com/zowe/zowe-cli/issues/1459)
## `7.10.0`

- Enhancement: Added support for downloading job spool content in binary and record formats.

## `7.9.1`

-BugFix: Introduced check to ensure ModifyJobs.modifyJobCommon can not be called with an empty options object

## `7.9.0`

- Enhancement: New api call added to request a list of jobs by any supported parameter including status
- Enhancement: Added new methods to support the changing of a job class and the hold status of a job: `ModifyJobs.modifyJob`, `ModifyJobs.modifyJobCommon` [#1156](https://github.com/zowe/zowe-cli/issues/1156)

## `7.2.0`

- Enhancement: Added the ability to submit a job from a USS File. [#1286](https://github.com/zowe/zowe-cli/issues/1286)

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `6.40.0`

- Enhancement: Added the `exec-data` option for `zowe jobs list jobs` command to return execution data about the job in addition to the default information. [#1158](https://github.com/zowe/zowe-cli/issues/1158)

## `6.39.0`

- Enhancement: Updated the `cancelJobs` and `deleteJobs` functions to return an IJobFeedback object
  - The object is only fully populated for synchronous requests (modifyVersion 2.0)
  - Asynchronous requests return the object with all fields undefined except status, which is "0"

## `6.35.0`

- Enhancement: Exposed new option `modifyVersion` for the `zowe zos-jobs delete job` and `zowe zos-jobs cancel job` commands. [#1092](https://github.com/zowe/zowe-cli/issues/1092)

## `6.33.1`

- Development: Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

## `6.31.0`

- Enhancement: Handle JCL symbol names and values in requests to submit a job.

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
