# Change Log

All notable changes to the Zowe Secrets SDK package will be documented in this file.

## Recent Changes

- BugFix: Updated the `adler` dependency to `adler2` for technical currency on MacOS. [#2600](https://github.com/zowe/zowe-cli/pull/2600)

## `8.24.2`

- BugFix: Fixed an issue where the buffer for error handling on Windows was passed by value instead of by reference. [#2545](https://github.com/zowe/zowe-cli/pull/2545)

## `8.18.3`

- BugFix: Fixed an error when accessing secrets on MacOS caused by socket file paths exceeding the maximum allowed length. [#2482](https://github.com/zowe/zowe-cli/pull/2482)

## `8.10.4`

- BugFix: Reduced number of keychain unlock prompts on MacOS for simultaneous access to secrets by multiple instances of the same application. [#2394](https://github.com/zowe/zowe-cli/pull/2394)

## `8.1.2`

- BugFix: Updated dependencies for technical currency. [#2289](https://github.com/zowe/zowe-cli/pull/2289)

## `8.0.0`

- MAJOR: v8.0.0 Release

## `8.0.0-next.202409191615`

- Update: Final prerelease

## `8.0.0-next.202407021516`

- BugFix: Updated dependencies for technical currency [#2188](https://github.com/zowe/zowe-cli/pull/2188)

## `8.0.0-next.202402211923`

- BugFix: Updated dependencies for technical currency. [#2057](https://github.com/zowe/zowe-cli/pull/2057)

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.18.6`

- BugFix: Use `core-foundation-rs` instead of `security-framework` for macOS logic, as `security-framework` is now archived. [#1802](https://github.com/zowe/zowe-cli/issues/1802)
- BugFix: Resolve bug where `findCredentials` scenarios with one match causes a segmentation fault on Linux.

## `7.18.5`

- BugFix: Enable `KeyringError::Library` enum variant to fix building on FreeBSD targets.

## `7.18.4`

- BugFix: Separated module resolution logic during installation; added more error handling to provide a more graceful installation process.
- BugFix: Add static CRT when compiling Windows builds.
- Added OVERVIEW document to package: provides context on the Secrets SDK transition and how it affects Zowe CLI and Zowe Explorer.

## `7.18.2`

- BugFix: Adds logic to allow the `keyring` module to locate the current package directory for the `prebuilds/` folder.

## `7.18.1`

- Added README to package w/ description, instructions and examples of using the `keyring` module.

## `7.18.0`

- Initial release.
- `keyring` module added for interacting with OS-specific keyring/credential vaults. See [src/keyring](src/keyring/README.md) for information on this native module and how it can be used.
