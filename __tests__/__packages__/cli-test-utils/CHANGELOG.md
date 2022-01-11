# Change Log

All notable changes to the Zowe CLI test utils package will be documented in this file.

## Recent Changes

- Enhancement: Ensure `zowe config auto-init` command saves the `rejectUnauthorized` value. [#1109](https://github.com/zowe/zowe-cli/issues/1109)

## `7.0.0-next.202112201801`

- BugFix: Removed usage of internal Imperative method to delete team config profiles.

## `7.0.0-next.202110211759`

- Add option to create team configuration or old style profiles.

## `7.0.0-next.202108302038`

- Corrected an attempt to rethrow an error with the NEW keyword which fails to compile with the latest version of typescript

## `7.0.0-next.202107091339`

- Change private methods to protected in `TestEnvironment` class for easier extensibility

## `7.0.0-next.202104121327`

- Initial release
