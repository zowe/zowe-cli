# Change Log

All notable changes to the Zowe z/OSMF SDK package will be documented in this file.

## `7.0.0-next.202106071827`

- **Breaking**: Removed the following [deprecated API functions](https://github.com/zowe/zowe-cli/pull/1022):
    - ZosmfSession.createBasicZosmfSession
    - ZosmfSession.createBasicZosmfSessionFromArguments
      - In CLI plugins replace both of the above with:
        - ZosmfSession.createSessCfgFromArgs,
        - ConnectionPropsForSessCfg.addPropsOrPrompt, and
        - new Session
      - In VS Code extensions, replace both of the above with:
        - ProfileInfo.createSession

## `6.27.1`

- BugFix: Removed the conflicting alias `-o` for `--protocol` option.

## `6.27.0`

- Enhancement: Adds a protocol option to ZosmfSession

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
