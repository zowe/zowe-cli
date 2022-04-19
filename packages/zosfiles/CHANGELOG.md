# Change Log

All notable changes to the Zowe z/OS files SDK package will be documented in this file.

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
