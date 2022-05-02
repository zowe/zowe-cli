# Change Log

All notable changes to the Zowe z/OS USS SDK package will be documented in this file.

## `6.40.2`

- BugFix: Fixed issue where SSH command waits forever when user has expired password. [#989](https://github.com/zowe/zowe-cli/issues/989)
- BugFix: Fixed SSH API using global mutable variables which could break concurrent commands. [#1389](https://github.com/zowe/zowe-cli/issues/1389)

## `6.33.3`

- Documentation: Update README with information about the new optional native modules in ssh2 dependency

## `6.33.2`

- Bugfix: Update `ssh2` dependency to avoid false positives on a vulnerability

## `6.33.1`

- Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
