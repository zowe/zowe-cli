# Change Log

All notable changes to the Zowe Secrets SDK package will be documented in this file.

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