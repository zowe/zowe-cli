# Change Log

All notable changes to the Zowe Secrets SDK package will be documented in this file.

## Recent Changes

- BugFix: Updated minimum supported version of Node from 18 to 20. Added Node 24 support. []()

## `7.29.15`

- BugFix: Update dependencies and implementation to resolve Windows build failures. [#2607](https://github.com/zowe/zowe-cli/pull/2607)

## `7.29.10`

- BugFix: Reduced number of keychain unlock prompts on MacOS for simultaneous access to secrets by multiple instances of the same application. [#2406](https://github.com/zowe/zowe-cli/pull/2406)

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
