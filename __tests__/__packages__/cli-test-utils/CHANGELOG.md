# Change Log

All notable changes to the Zowe CLI test utils package will be documented in this file.

## `8.7.1`

- BugFix: Improved the error message shown on MacOS when `runCliScript` method fails to run script that is missing shebang line. [#2314](https://github.com/zowe/zowe-cli/pull/2314)

## `8.1.1`

- BugFix: Updated peer dependencies to `^8.0.0`, dropping support for versions tagged `next`. [#2287](https://github.com/zowe/zowe-cli/pull/2287)

## `8.0.0`

- MAJOR: v8.0.0 Release

## `8.0.0-next.202409191615`

- Update: Final prerelease

## `8.0.0-next.202408271330`

- BugFix: Removed obsolete V1 `profiles` property from the parameters object returned by `mockHandlerParameters` method.

## `8.0.0-next.202408131445`

- Update: See `7.28.3` for details

## `8.0.0-next.202407262216`

- Update: See `7.28.2` for details

## `8.0.0-next.202407021516`

- BugFix: Updated dependencies for technical currency [#2188](https://github.com/zowe/zowe-cli/pull/2188)

## `8.0.0-next.202402261705`

- BugFix: Updated dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.28.3`

- BugFix: Refactored code to reduce the use of deprecated functions to prepare for upcoming Node.js 22 support. [#2191](https://github.com/zowe/zowe-cli/issues/2191)

## `7.28.2`

- BugFix: Improved the error message shown on Windows when `runCliScript` method cannot find `sh` executable on PATH. [#2208](https://github.com/zowe/zowe-cli/issues/2208)

## `7.18.11`

- BugFix: Fix types error from an incorrect jstree type during compilation

## `7.18.9`

- Enhancement: Adds the `CLI_TEST_UTILS_USE_PROJECT_ROOT_DIR` environment variable to force the test utility to use the global project dir instead of workspace dirs if set.

## `7.16.1`

- BugFix: Don't assume that folder containing `lerna.json` is root directory unless it also contains a `__tests__` subfolder.

## `7.10.1`

- BugFix: Fixed team config being created instead of v1 profiles when `createOldProfiles` was true.
- Deprecated: Removed the utility method `isStderrEmptyForProfilesCommand`. Use `stripProfileDeprecationMessages(output).length === 0` instead.

## `7.10.0`

- BugFix: Fixed plugin install failing if plugin does not contribute command definitions.

## `7.6.2`

- BugFix: Fixed profiles being created when not requested.
- BugFix: Allowed shell scripts to decide which interpreter to use based on the shebang.

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `7.0.0-next.202204011929`

- BugFix: Fixed plugins directory not being deleted when TestEnvironment cleans up.

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
