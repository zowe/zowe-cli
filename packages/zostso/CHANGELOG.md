# Change Log

All notable changes to the Zowe z/OS TSO SDK package will be documented in this file.

## Recent Changes

- BugFix: Updated minimum supported version of Node from 18 to 20. Added Node 24 support. [#2616](https://github.com/zowe/zowe-cli/pull/2616)

## `8.27.0`

- BugFix: Added missing exports for the `IIssueTsoCmdOpts`, `IStartTsoAppParms`, and `ITsoAppCommunicationParms` interfaces. [#2596](https://github.com/zowe/zowe-cli/issues/2596)

## `8.24.3`

- BugFix: When an invalid Logon Procedure is used, an accurate error is now displayed to the user. [#2528](https://github.com/zowe/zowe-explorer-vscode/issues/2528)

## `8.6.2`

- BugFix: Fixed imports that failed to resolve. [#2343](https://github.com/zowe/zowe-cli/pull/2343)

## `8.6.0`

- Enhancement: Issue `app` commands to better target communication with a TSO/E application. The `app` command is now included in the `start`/`send` command group and the new `receive` command group,
allowing direct interaction with an application through a z/OS message queue. [#2280] (https://github.com/zowe/zowe-cli/pull/2280)

## `8.1.1`

- BugFix: Updated peer dependencies to `^8.0.0`, dropping support for versions tagged `next`. [#2287](https://github.com/zowe/zowe-cli/pull/2287)

## `8.1.0`

- Enhancement: Deprecated `IssueTsoCommand()` function and replaced with `IssueTsoCmd()` for compatibility with z/OS version 2.4. [#2240](https://github.com/zowe/zowe-cli/pull/2240)
- Enhancement: Modified `IIssueReponse` to handle z/OS 2.4 and newer TSO command response. [#2240](https://github.com/zowe/zowe-cli/pull/2240)
  - Old API behavior will be utilized upon specifying --ssm to be false, otherwise try new API and if it fails, fallback to old API.
  - Specifying --ssm to be false makes the value of --stateful have no impact on behavior since old API behavior does not utilize statefulness.

## `8.0.0`

- MAJOR: v8.0.0 Release

## `8.0.0-next.202409191615`

- Update: Final prerelease

## `8.0.0-next.202408131445`

- Update: See `7.28.3` for details

## `8.0.0-next.202403041352`

- BugFix: Updated engine to Node 18.12.0. [#2074](https://github.com/zowe/zowe-cli/pull/2074)
- LTS Breaking: Removed the following obsolete V1 profile constants from ZosTsoProfile.schema.properties
  - createProfileExamples
  - updateProfileExamples

## `8.0.0-next.202402261705`

- BugFix: Updated dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)
- BugFix: Updated engine to Node 16.7.0. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202402021649`

- LTS Breaking: Moved all constants from `zowe-cli/packages/cli/src/zostso/constants/ZosTso.constants.ts` to `@zowe/zos-tso-for-zowe-sdk`

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.28.3`

- BugFix: Refactored code to reduce the use of deprecated functions to prepare for upcoming Node.js 22 support. [#2191](https://github.com/zowe/zowe-cli/issues/2191)

## `7.1.0`

- Enhancement: Exposed `tso` profile type configuration.

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `7.0.0-next.202112142155`

- Breaking: Removed deprecated interfaces:
  - IZosfmMessages -> IZosmfMessages

## `6.33.1`

- Development: Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

## `6.28.0`

- Bugfix: Fixed duplicate occurrence of "X-CSRF-ZOSMF-HEADER" on z/OSMF requests

## `6.25.0`

- Enhancement: Improved cryptic error message that was shown if TSO address space failed to start for the `zowe zos-tso issue command` command. [#28](https://github.com/zowe/zowe-cli/issues/28)
- Bugfix: Remove "[object Object]" that appeared in some error messages

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
