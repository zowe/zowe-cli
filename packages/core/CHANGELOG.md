# Change Log

All notable changes to the Zowe core SDK package will be documented in this file.

## Recent Changes

- BugFix: Updated additional dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)
- BugFix: Updated engine to Node 16.7.0. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202402211923`

- BugFix: Updated dependencies for technical currency. [#2057](https://github.com/zowe/zowe-cli/pull/2057)

## `8.0.0-next.202401191954`

- LTS Breaking: Removed all 'profiles' commands, since they only worked with now-obsolete V1 profiles.
- BugFix: Include text from a REST response's causeErrors.message property in error messages.

## `8.0.0-next.202311282012`

- LTS Breaking: Unpinned dependency versions to allow for patch/minor version updates for dependencies [#1968](https://github.com/zowe/zowe-cli/issues/1968)

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.21.2`

- BugFix: Add information about password-protected certificate file support. [#2006](https://github.com/zowe/zowe-cli/issues/2006)

## `7.18.0`

- Enhancement: Added support for dynamic APIML tokens. [#1734](https://github.com/zowe/zowe-cli/pull/1734)

## `7.17.0`

- Enhancement: Set properties for z/OSMF REST errors for use in a more user-friendly format with the ZOWE_V3_ERR_FORMAT environment variable. [zowe-cli#935](https://github.com/zowe/zowe-cli/issues/935)
-
## `7.16.5`

- BugFix: Fixed confusing error message "Token is not valid or expired" when APIML token is used to connect direct-to-service with `ZosmfRestClient`. [Imperative #978](https://github.com/zowe/imperative/issues/978)

## `7.12.0`

- BugFix: Added missing headers to ZosmfHeaders

## `7.1.1`

- BugFix: Moved `authConfig` object from the base profile definition into the CLI package because it made the handler path invalid.

## `7.1.0`

- Enhancement: Exposed `base` profile type configuration.

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `7.0.0-next.202203311904`

- BugFix: Updated paths to use v2 APIML APIs [#1339](https://github.com/zowe/zowe-cli/issues/1339)

## `7.0.0-next.202203282106`

- Enhancement: Added the `record` data type header

## `7.0.0-next.202203211751`

- BugFix: Updated `ProfileUtils.getZoweDir` method to include the `name` property. [zowe/vscode-extension-for-zowe#1697](https://github.com/zowe/vscode-extension-for-zowe/issues/1697)

## `7.0.0-next.202111041425`

- Enhancement: Updated `Services.convertApimlProfileInfoToProfileConfig` method to include the `autoStore` property in config it creates

## `6.34.0`

- Enhancement: Add support for PEM certificate based authentication

## `6.33.4`

- BugFix: Updated dependencies to resolve problems with the ansi-regex package

## `6.33.1`

- Development: Migrated from TSLint (now deprecated) to ESLint for static code analysis.

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
