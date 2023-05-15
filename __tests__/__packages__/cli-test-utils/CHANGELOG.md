# Change Log

All notable changes to the Zowe CLI test utils package will be documented in this file.

## `7.16.1`

- BugFix: Don't assume that folder containing `lerna.json` is root directory unless it also contains a `__tests__` subfolder.

## `7.10.1`

- BugFix: Fixed team config being created instead of v1 profiles when `createOldProfiles` was true.
- Deprecated: Removed the utility method `isStderrEmptyForProfilesCommand`. Use `stripProfileDeprecationMessages(output).length === 0` instead.

## `7.10.0`

- BugFix: Fixed plugin install failing if plugin does not contribute command definitions.

## `7.6.2`

- BugFix: Fixed profiles being created when not requested.
- BugFix: Allowed shell scripts to decide which interpreter to use based on the shebang.

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `7.0.0-next.202204011929`

- BugFix: Fixed plugins directory not being deleted when TestEnvironment cleans up.

## `7.0.0-next.202112201801`

- BugFix: Removed usage of internal Imperative method to delete team config profiles.

## `7.0.0-next.202110211759`

- Add option to create team configuration or old style profiles.

## `7.0.0-next.202108302038`

- Corrected an attempt to rethrow an error with the NEW keyword which fails to compile with the latest version of typescript

## `7.0.0-next.202107091339`

- Change private methods to protected in `TestEnvironment` class for easier extensibility

## `7.0.0-next.202104121327`

- Initial release
