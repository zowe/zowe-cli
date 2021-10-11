# Change Log

All notable changes to the Zowe z/OSMF SDK package will be documented in this file.

## Recent Changes

- BugFix: Reverts hiding the cert-key-file path so users can see what path was specified and check if the file exists

## `6.34.0`

- Enhancement: Add support for PEM certificate based authentication

## `6.33.1`

- Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

## `6.27.1`

- BugFix: Removed the conflicting alias `-o` for `--protocol` option.

## `6.27.0`

- Enhancement: Adds a protocol option to ZosmfSession

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
