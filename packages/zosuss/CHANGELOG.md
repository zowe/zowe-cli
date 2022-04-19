# Change Log

All notable changes to the Zowe z/OS USS SDK package will be documented in this file.

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
