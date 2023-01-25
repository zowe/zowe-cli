# Change Log

All notable changes to the Zowe z/OS jobs SDK package will be documented in this file.

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
