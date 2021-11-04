# Change Log

All notable changes to the Zowe core SDK package will be documented in this file.

## `7.0.0-next.202111041425`

- Enhancement: Updated `Services.convertApimlProfileInfoToProfileConfig` method to include the `autoStore` property in config it creates

## `6.34.0`

- Enhancement: Add support for PEM certificate based authentication

## `6.33.4`

- BugFix: Updated dependencies to resolve problems with the ansi-regex package

## `6.33.1`

- Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

## `6.28.0`

- Enhancement: Added Accept-Encoding header to `ZosmfHeaders` class

## `6.25.0`

- Bugfix: Remove "[object Object]" that appeared in some error messages

## `6.24.5`

- Bugfix: Updated Imperative dependency version to one that does not contain a vulnerable dependency

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
