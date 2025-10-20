# Change Log

All notable changes to the Zowe z/OS USS SDK package will be documented in this file.

## `8.27.4`

- BugFix: Updated minimum supported version of Node from 18 to 20. Added Node 24 support. [#2616](https://github.com/zowe/zowe-cli/pull/2616)

## `8.7.0`

- BugFix: Removed unnecessary `$ ` characters in front of most output. [zowe-explorer#3079(comment)](https://github.com/zowe/zowe-explorer-vscode/pull/3079#pullrequestreview-2408842655)
- Enhancement: Added the ability to validate if an SSH profile can successfully establish a connection, ensuring quicker troubleshooting of connection issues. [zowe-explorer#3079(comment)](https://github.com/zowe/zowe-explorer-vscode/pull/3079#discussion_r1825783867)

## `8.1.1`

- BugFix: Updated peer dependencies to `^8.0.0`, dropping support for versions tagged `next`. [#2287](https://github.com/zowe/zowe-cli/pull/2287)

## `8.0.0`

- MAJOR: v8.0.0 Release

## `8.0.0-next.202409191615`

- Update: Final prerelease

## `8.0.0-next.202408131445`

- Update: See `7.28.3` for details

## `8.0.0-next.202408092029`

- BugFix: Resolved bug that resulted in user not being prompted for a key passphrase if it is located in the secure credential array of the ssh profile. [#1770](https://github.com/zowe/zowe-cli/issues/1770)
- Enhancement: `SshBaseHandler` command processor will now prompt user up to 3 times to enter the correct keyPassphrase in the case that the stored value is incorrect or no value is stored. [#1770](https://github.com/zowe/zowe-cli/issues/1770)

## `8.0.0-next.202403132009`

- Enhancement: Provide more legible errors to user when they are missing user/password credentials while
running `zowe zos-uss issue ssh` commands. [#2081](https://github.com/zowe/zowe-cli/pull/2081)

## `8.0.0-next.202403041352`

- BugFix: Updated engine to Node 18.12.0. [#2074](https://github.com/zowe/zowe-cli/pull/2074)
- LTS Breaking: Removed the following obsolete V1 profile constant from ZosUssProfile.schema.properties
  - createProfileExamples

## `8.0.0-next.202402261705`

- BugFix: Updated additional dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)
- BugFix: Updated engine to Node 16.7.0. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202402211923`

- BugFix: Updated dependencies for technical currency [#2057](https://github.com/zowe/zowe-cli/pull/2057)

## `8.0.0-next.202402021649`

- LTS Breaking: Removed the following previously deprecated items:
  - Removed the following constants from SshSession.ts
    - SSH_OPTION_USER_PROFILE use SSH_OPTION_USER
    - SSH_OPTION_HOST_PROFILE use SSH_OPTION_HOST
  - Removed statCmdFlag as an export from Shell.ts

## `8.0.0-next.202311282012`

- LTS Breaking: Unpinned dependency versions to allow for patch/minor version updates for dependencies [#1968](https://github.com/zowe/zowe-cli/issues/1968)

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.28.3`

- BugFix: Refactored code to reduce the use of deprecated functions to prepare for upcoming Node.js 22 support. [#2191](https://github.com/zowe/zowe-cli/issues/2191)

## `7.24.0`

- Enhancement: Provide legible errors to users when they are missing user/password credentials while
running `zowe zos-uss issue ssh` commands. [#2081](https://github.com/zowe/zowe-cli/pull/2081)

## `7.21.1`

- BugFix: Updated `ssh2` package to resolve technical currency

## `7.18.2`

- BugFix: Updated `zowe zos-ssh issue cmd` to return just the command output in `stdout` instead of both the command and its output. [#1724](https://github.com/zowe/zowe-cli/issues/1724)

## `7.6.1`

- BugFix: Updated `ssh2` dependency to fix "Received unexpected packet type" error. [#1516](https://github.com/zowe/zowe-cli/issues/1516)

## `7.1.2`

- BugFix: Fixed an issue where privateKey is not being respected. [#1398](https://github.com/zowe/zowe-cli/issues/1398) [#1392](https://github.com/zowe/zowe-cli/issues/1392)

## `7.1.0`

- Enhancement: Exposed `ssh` profile type configuration.
- BugFix: Fixed issue where SSH command waits forever when user has expired password. [#989](https://github.com/zowe/zowe-cli/issues/989)
- BugFix: Fixed SSH API using global mutable variables which could break concurrent commands. [#1389](https://github.com/zowe/zowe-cli/issues/1389)

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `7.0.0-next.202201252014`

- Documentation: Deprecated the following command option definitions:
  - SSH_OPTION_HOST_PROFILE
    - Replace with SSH_OPTION_HOST
  - SSH_OPTION_USER_PROFILE
    - Replace with SSH_OPTION_USER

## `7.0.0-next.202106071827`

- **Breaking**: Removed the following [deprecated API functions](https://github.com/zowe/zowe-cli/pull/1022):
    - SshSession.createBasicSshSession
    - SshSession.createBasicSshSessionFromArguments
      - For both of the above replace with:
        - SshSession.createSshSessCfgFromArgs,
        - ConnectionPropsForSessCfg.addPropsOrPrompt, and
        - new SshSession

## `6.33.3`

- Documentation: Update README with information about the new optional native modules in ssh2 dependency

## `6.33.2`

- Bugfix: Update `ssh2` dependency to avoid false positives on a vulnerability

## `6.33.1`

- Development: Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
