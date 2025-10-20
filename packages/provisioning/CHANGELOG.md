# Change Log

All notable changes to the Zowe provisioning SDK package will be documented in this file.

## `8.27.4`

- BugFix: Updated minimum supported version of Node from 18 to 20. Added Node 24 support. [#2616](https://github.com/zowe/zowe-cli/pull/2616)

## `8.1.1`

- BugFix: Updated peer dependencies to `^8.0.0`, dropping support for versions tagged `next`. [#2287](https://github.com/zowe/zowe-cli/pull/2287)

## `8.0.0`

- MAJOR: v8.0.0 Release

## `8.0.0-next.202409191615`

- Update: Final prerelease

## `8.0.0-next.202408131445`

- Update: See `7.28.3` for details

## `8.0.0-next.202403041352`

- BugFix: Updated engine to Node 18.12.0. [#2074](https://github.com/zowe/zowe-cli/pull/2074)

## `8.0.0-next.202402261705`

- BugFix: Updated additional dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)
- BugFix: Updated engine to Node 16.7.0. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202402211923`

- BugFix: Updated dependencies for technical currency. [#2057](https://github.com/zowe/zowe-cli/pull/2057)

## `8.0.0-next.202311282012`

- LTS Breaking: Unpinned dependency versions to allow for patch/minor version updates for dependencies [#1968](https://github.com/zowe/zowe-cli/issues/1968)

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.28.3`

- BugFix: Refactored code to reduce the use of deprecated functions to prepare for upcoming Node.js 22 support. [#2191](https://github.com/zowe/zowe-cli/issues/2191)

## `7.6.2`

- BugFix: Updated `js-yaml` dependency for technical currency.

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `6.33.2`

- Bugfix: Update `js-yaml` dependency to resolve a potential vulnerability

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
