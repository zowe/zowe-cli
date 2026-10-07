# Change Log

All notable changes to the Zowe z/OS console SDK package will be documented in this file.

## Recent Changes

- BugFix: Fixed an issue where the `zowe zos-console collect sync-responses` command did not stop collecting console output after the expected keyword was found or the follow-up attempts ran out. [#]()

## `7.28.3`

- BugFix: Refactored code to reduce the use of deprecated functions to prepare for upcoming Node.js 22 support. [#2191](https://github.com/zowe/zowe-cli/issues/2191)

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `6.33.1`

- Development: Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

## `6.25.0`

- Bugfix: Remove "[object Object]" that appeared in some error messages

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
