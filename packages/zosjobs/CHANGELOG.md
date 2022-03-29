# Change Log

All notable changes to the Zowe z/OS jobs SDK package will be documented in this file.

## `6.39.0`

- Enhancement: Add the `data-exec` option for `zowe jobs list jobs` command to return execution data about the job in addition to the default information. [#1158](https://github.com/zowe/zowe-cli/issues/1158)

## `6.35.0`

- Enhancement: Exposed new option `modifyVersion` for the `zowe zos-jobs delete job` and `zowe zos-jobs cancel job` commands. [#1092](https://github.com/zowe/zowe-cli/issues/1092)

## `6.33.1`

- Migrated from TSLint (now deprecated) to ESLint for static code analysis.

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
