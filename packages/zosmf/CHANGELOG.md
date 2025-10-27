# Change Log

All notable changes to the Zowe z/OSMF SDK package will be documented in this file.

## `8.27.4`

- BugFix: Updated minimum supported version of Node from 18 to 20. Added Node 24 support. [#2616](https://github.com/zowe/zowe-cli/pull/2616)

## `8.20.0`

- Enhancement: Added the `ZOSMF_OPTION_ESTABLISH_CONNECTION_TIMEOUT` option to `ZOSMF_CONNECTION_OPTIONS` on `ZosmfSession`. This allows users to specify a maximum limit for how long the REST client should attempt to establish a connection to the server, and returns an error if the request takes too long. [#2490](https://github.com/zowe/zowe-cli/pull/2490)
- Enhancement: Added the `ZOSMF_OPTION_COMPLETION_TIMEOUT` option to `ZOSMF_CONNECTION_OPTIONS` on `ZosmfSession`. This allows users to specify a maximum limit for how long a REST request should take, and returns an error if the request takes too long. [#2490](https://github.com/zowe/zowe-cli/pull/2490)

## `8.1.1`

- BugFix: Updated peer dependencies to `^8.0.0`, dropping support for versions tagged `next`. [#2287](https://github.com/zowe/zowe-cli/pull/2287)

## `8.1.0`

- Enhancement: Created `isZosVersionAtLeast()` function to allow for dynamic behavior based on z/OS version. [#2240](https://github.com/zowe/zowe-cli/pull/2240)

## `8.0.0`

- MAJOR: v8.0.0 Release

## `8.0.0-next.202409191615`

- Update: Final prerelease

## `8.0.0-next.202408131445`

- Update: See `7.28.3` for details
- LTS Breaking: Removed the following obsolete V1 profile attributes from ZosmfBaseHandler:
  - mZosmfProfile
  - mZosmfLoadedProfile

## `8.0.0-next.202403041352`

- BugFix: Updated engine to Node 18.12.0. [#2074](https://github.com/zowe/zowe-cli/pull/2074)
- LTS Breaking: Removed the following obsolete V1 profile constants from ZosmfProfile.schema.properties
  - createProfileExamples
  - updateProfileExamples

## `8.0.0-next.202402261705`

- BugFix: Updated dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)
- BugFix: Updated engine to Node 16.7.0. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202402021649`

- LTS Breaking: Removed the following constants from ZosmfSession
  - ZOSMF_OPTION_HOST_PROFILE use ZOSMF_OPTION_HOST instead
  - ZOSMF_OPTION_USER_PROFILE use ZOSMF_OPTION_USER instead
  - ZOSMF_OPTION_PASSWORD_PROFILE use ZOSMF_OPTION_PASSWORD instead

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.28.3`

- BugFix: Refactored code to reduce the use of deprecated functions to prepare for upcoming Node.js 22 support. [#2191](https://github.com/zowe/zowe-cli/issues/2191)

## `7.6.2`

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
