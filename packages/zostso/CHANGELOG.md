# Change Log

All notable changes to the Zowe z/OS TSO SDK package will be documented in this file.

## `8.0.0-next.202311132045`

- Breaking: First major version bump for V3

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
