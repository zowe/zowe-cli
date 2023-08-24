# Change Log

All notable changes to the Zowe Secrets SDK package will be documented in this file.

## `7.18.2`

- BugFix: Added `pkg-dir` as a dependency: allows the `keyring` module to locate the current package directory for the `prebuilds/` folder.

## `7.18.1`

- Added README to package w/ description, instructions and examples of using the `keyring` module. 

## `7.18.0`

- Initial release.
- `keyring` module added for interacting with OS-specific keyring/credential vaults. See [src/keyring](src/keyring/README.md) for information on this native module and how it can be used.