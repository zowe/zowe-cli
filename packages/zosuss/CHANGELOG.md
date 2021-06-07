# Change Log

All notable changes to the Zowe z/OS USS SDK package will be documented in this file.

## Recent Changes

- **Breaking**: Removed the following [deprecated API functions](https://github.com/zowe/zowe-cli/pull/1022):
    - SshSession.createBasicSshSession
    - SshSession.createBasicSshSessionFromArguments
      - For both of the above replace with:
        - SshSession.createSshSessCfgFromArgs,
        - ConnectionPropsForSessCfg.addPropsOrPrompt, and
        - new SshSession

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
