# Change Log

All notable changes to the Zowe z/OSMF SDK package will be documented in this file.

## Recent Changes
- BugFix: Updated example for `zowe profiles create zosmf-profile` command. [#1152](https://github.com/zowe/zowe-cli/issues/1152)

## `7.1.0`

- Enhancement: Exposed `zosmf` profile type configuration.

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `7.0.0-next.202112201801`

- Deprecated: Duplicate property names on the ZosmfSession class:
  - ZOSMF_OPTION_HOST_PROFILE -> ZOSMF_OPTION_HOST
  - ZOSMF_OPTION_USER_PROFILE -> ZOSMF_OPTION_USER
  - ZOSMF_OPTION_PASSWORD_PROFILE -> ZOSMF_OPTION_PASSWORD

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

## `6.34.0`

- Enhancement: Add support for PEM certificate based authentication

## `6.33.1`

- Development: Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

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
