# Change Log
All notable changes to the Zowe CLI package will be documented in this file.

## `8.24.4`

- BugFix: Fixed an issue where inconsistent formatting for an example in the `zowe zos-files create data-set-sequential` command caused the example to be improperly displayed in the Zowe web help. Now, the full example command is shown in the code block when displayed through the web help. [#2557](https://github.com/zowe/zowe-cli/issues/2557)

## `8.24.0`

- Enhancement: Added a `search-exact-name` option to the `zowe zos-files search data-set` command to search the contents of one data set or PDS. [#2529](https://github.com/zowe/zowe-cli/pull/2529)

## `8.23.1`

- BugFix: Updated the `brace-expansion` dependency for technical currency. [#2523](https://github.com/zowe/zowe-cli/pull/2523)

## `8.22.0`

- Enhancement: Added a new configuration property named authOrder with which a user can specify a desired choice of authentication. [#1794](https://github.com/zowe/zowe-cli/issues/1794)
- BugFix: Avoid prompting for a password, when a token is available for authentication [#2500](https://github.com/zowe/zowe-cli/issues/2500)
- BugFix: Updated the `zowe auth login apiml` command to place its retrieved token into the specified (or default) base profile instead of creating a new base profile. [#2181](https://github.com/zowe/zowe-cli/issues/2181) & [#1650](https://github.com/zowe/zowe-cli/issues/1650)
  - The update also places a directive to use token authentication for the default `zosmf` profile if that profile is configured to connect to API-ML.
- Enhancement: Updated Node.js types for technical currency. [#2511](https://github.com/zowe/zowe-cli/pull/2511)

## `8.20.0`

- Enhancement: Added the `--establish-connection-timeout` option to the `z/OSMF Connection Options`. This allows users to specify a maximum limit for how long the REST client should attempt to establish a connection to the server, and returns an error if the request takes too long. [#2490](https://github.com/zowe/zowe-cli/pull/2490)
- Enhancement: Added the `--completion-timeout` option to the `z/OSMF Connection Options`. This allows users to specify a maximum limit for how long a REST request should take, and returns an error if the request takes too long. [#2490](https://github.com/zowe/zowe-cli/pull/2490)

## `8.19.0`

- Enhancement: Updated help examples to replace short option aliases (e.g. `-h`) with full option names (e.g. `--help`) for improved clarity and consistency in documentation. [#2484](https://github.com/zowe/zowe-cli/pull/2484)

## `8.18.1`

- BugFix: Updated the Daemon binary version for technical currency. [#2479](https://github.com/zowe/zowe-cli/pull/2479)

## `8.17.0`

- BugFix: Fixed a bug that resulted in daemon commands running slower with every additional command. [#2470](https://github.com/zowe/zowe-cli/issues/2470)

## `8.16.0`

- Enhancement: Add the ability to search data sets with regex patterns by passing `--regex` into the search command. [#2432](https://github.com/zowe/zowe-cli/issues/2432)

## `8.15.1`

- BugFix: Fixed the `--show-inputs-only` option on commands with chained command handlers, such as `zowe zos-files copy data-set-cross-lpar`. [#2446](https://github.com/zowe/zowe-cli/issues/2446)

## `8.15.0`

- Enhancement: Added the `--overwrite` flag to the `zowe files copy ds` command to allow for overwriting all members of a target data set with source data set members. [#2450] (https://github.com/zowe/zowe-cli/pull/2450)

## `8.14.1`

- BugFix: When using the `copy` command, if a target partitioned data set has a smaller record length than a source partitioned data set, the operation for subsequent members no longer stops. The user can now view the affected members in a local file. [#2349] (https://github.com/zowe/zowe-cli/issues/2349)
- BugFix: Users were not warned when copying partitioned data sets with identical member names. Now, the user is prompted to confirm before continuing the copy operation to avoid potential data loss. [#2349] (https://github.com/zowe/zowe-cli/issues/2349)

## `8.14.0`

- Enhancement: Added the ability to see secure properties when running `zowe config list` when the `ZOWE_SHOW_SECURE_ARGS` environment variable is set to `true`. [#2259](https://github.com/zowe/zowe-cli/issues/2259)

## `8.13.0`

- Enhancement: Added the `--data-set-type` flag to create sequential data set command to allow for creating extended and large formatted sequential data sets. [#2141](https://github.com/zowe/zowe-cli/issues/2141)
- Enhancement: Added `--recordRange` flag to `zowe jobs download output` command to allow users to select a specific range of records to output from a spool file. [#2411](https://github.com/zowe/zowe-cli/pull/2411)
- BugFix: The `zowe zos-files copy data-set` command overwrites the contents of the target data set without user confirmation. A `--safe-replace` option was added which prompts the user to confirm before overwriting the contents of the target data set. [#2369] (https://github.com/zowe/zowe-cli/issues/2369)

## `8.12.0`

- Enhancement: The `zowe zos-files copy data-set` command no longer requires the target data set to be preallocated. [##2349] (https://github.com/zowe/zowe-cli/issues/2349)

## `8.10.4`
- BugFix: Fixed an issue where the `zowe files upload dir-to-uss` command was missing progress bar to track progress of file uploads. [#2344](https://github.com/zowe/zowe-cli/issues/2344)

## `8.10.3`

- BugFix: The `zowe files copy data-set` command no longer copies all partitioned data set members if a member is specified. [#2402](https://github.com/zowe/zowe-cli/pull/2402)

## `8.10.0`
-Enhancement: The `zowe zos-files copy data-set` command now copies members from a source partitioned data set to an existing target partitioned data set.[#2386](https://github.com/zowe/zowe-cli/pull/2386)

## `8.9.0`
- Enhancement: Added new command zowe zos-files download all-members-matching, (zowe files dl amm), to download members matching specified pattern(s). The success message for the Download.allMembers API was changed from originally "Data set downloaded successfully" to "Member(s) downloaded successfully." The change also alters the commandResponse when using the --rfj flag. [#2359](https://github.com/zowe/zowe-cli/pull/2359)

## `8.8.0`

- Enhancement: Pass a `.zosattributes` file path for the download encoding format by adding the new `--attributes` flag to the `zowe zos-files upload` command. [#2322](https://github.com/zowe/zowe-cli/issues/2322)
- BugFix: Added support for the `--encoding` flag to the `zowe upload dir-to-uss` to allow for encoding uploaded directories for command group consistency. [#2337](https://github.com/zowe/zowe-cli/issues/2337)
- BugFix: Improved output formatting for `zowe zos-tso start app` and `zowe zos-tso send app` commands by parsing and displaying relevant data rather than the entire JSON response. [#2347](https://github.com/zowe/zowe-cli/pull/2347)
- Enhancement: Add the --ignore-not-found flag to avoid file-not-found error messages when deleting files so scripts are not interupted during automated batch processing. The flag bypasses warning prompts to confirm delete actions. [#2254](https://github.com/zowe/zowe-cli/pull/2254)

## `8.7.0`

- Enhancement: Added --wait-for-active and --wait-for-output to download options on zosjobs. [#2328](https://github.com/zowe/zowe-cli/pull/2328)

## `8.6.2`

- BugFix: Resolved issue where `zowe zos-files upload file-to-uss` was not properly handling command flags. [#2234](https://github.com/zowe/zowe-cli/pull/2334)

## `8.6.1`

- BugFix: Fixed an issue where the `zowe zos-logs list logs` command could fail or not return all logs if a start time was not supplied. [#2336](https://github.com/zowe/zowe-cli/pull/2336)

## `8.6.0`

- Enhancement: Added support for running applications on TSO/E address spaces. Start applications and receive/transmit messages using the new `tso start`, `tso receive` and `tso send` commands. [#2280](https://github.com/zowe/zowe-cli/pull/2280)


## `8.4.0`

- Enhancement: Added optional `--attributes` flag to `zowe zos-files upload file-to-uss` to allow passing a .zosattributes file path for upload encoding format. [#2319](https://github.com/zowe/zowe-cli/pull/2319)


## `8.3.0`

- Enhancement: Issue the `zowe files search data-sets` command with the new `encoding` option to use a different code page when searching data set contents. [#2161](https://github.com/zowe/zowe-cli/issues/2161)

## `8.1.2`

- BugFix: Fixed issues flagged by Coverity [#2291](https://github.com/zowe/zowe-cli/pull/2291)

## `8.1.0`

- Enhancement: Added `--stateful` flag to `zos-tso issue cmd` to allow declaring the statefulness of the address space being created.  [#2240](https://github.com/zowe/zowe-cli/pull/2240)
- Enhancement: `--suppress-startup-messages` flag default value changed to `true`. [#2240](https://github.com/zowe/zowe-cli/pull/2240)

## `8.0.0`

- MAJOR: v8.0.0 Release

## `8.0.0-next.202409191615`

- Update: Final prerelease

## `8.0.0-next.202408261543`

- BugFix: Updated `micromatch` dependency for technical currency. [#2242](https://github.com/zowe/zowe-cli/pull/2242)

## `8.0.0-next.202408131445`

- Update: See `7.28.3` for details

## `8.0.0-next.202407181904`

- Enhancement: The 'zowe config auto-init' command now generates a base profile name of 'global_base' or 'project_base', depending on whether a global or project configuration file is being generated. Related to Zowe Explorer issue https://github.com/zowe/zowe-explorer-vscode/issues/2682.

## `8.0.0-next.202407021516`

- BugFix: Updated dependencies for technical currency [#2188](https://github.com/zowe/zowe-cli/pull/2188)

## `8.0.0-next.202406140245`

- BugFix: Updated documentation for the `zos-files search ds` command's `--mainframe-search` option to include a disclaimer about z/OSMF API limitations. [#2160](https://github.com/zowe/zowe-cli/issues/2160)

## `8.0.0-next.202406061600`

- BugFix: Updated `braces` dependency for technical currency. [#2158](https://github.com/zowe/zowe-cli/pull/2158)

## `8.0.0-next.202405231927`

- LTS Breaking: Send all Zowe Daemon informational messages, progress messages, and error messages to standard error instead of standard output [#1451](https://github.com/zowe/zowe-cli/issues/1451)

## `8.0.0-next.202405202020`

- BugFix: Fixed a bug where a data set search would not return a search term if it was at the beginning of a line. [#2147](https://github.com/zowe/zowe-cli/pull/2147)

## `8.0.0-next.202405101931`

- Enhancement: Added the ability to search for a string in a data set or PDS member matching a pattern with the `zowe zos-files search data-sets` command.[#2095](https://github.com/zowe/zowe-cli/issues/2095)

## `8.0.0-next.202405061946`

- Enhancement: Consolidated the Zowe client log files into the same directory. [#2116](https://github.com/zowe/zowe-cli/issues/2116)

## `8.0.0-next.202404301428`

- LTS Breaking: Add informative messages identifying why a user is being prompted for connection property values during a CLI command.

## `8.0.0-next.202404032038`

- BugFix: Fixed error in `zos-files list all-members` command that could occur when members contain control characters in the name. [#2104](https://github.com/zowe/zowe-cli/pull/2104)

## `8.0.0-next.202403272026`

- BugFix: Resolved technical currency by updating `tar` dependency. [#2102](https://github.com/zowe/zowe-cli/issues/2102)
- BugFix: Resolved technical currency by updating `markdown-it` dependency. [#2107](https://github.com/zowe/zowe-cli/pull/2107)

## `8.0.0-next.202403141949`

- Enhancement: Changed references in command output from 'Team Configuration' to 'Zowe client configuration' [#2019](https://github.com/zowe/zowe-cli/issues/2019).

## `8.0.0-next.202403132009`

- Enhancement: Prompt for user/password on SSH commands when a token is stored in the config. [#2081](https://github.com/zowe/zowe-cli/pull/2081)

## `8.0.0-next.202403131702`

- BugFix: Removing stack trace for zosjobs errors. [#2078](https://github.com/zowe/zowe-cli/pull/2078)

## `8.0.0-next.202403122137`

- BugFix: Fixed default base profile missing in config generated by `zowe config auto-init` [#2088](https://github.com/zowe/zowe-cli/pull/2088)

## `8.0.0-next.202403061549`

- BugFix: Update daemon dependencies for technical currency [#2077](https://github.com/zowe/zowe-cli/pull/2077)

## `8.0.0-next.202403041352`

- BugFix: Updated engine to Node 18.12.0. [#2074](https://github.com/zowe/zowe-cli/pull/2074)
- BugFix: Eliminated a Node Version Manager (NVM) GUI popup dialog which NVM now displays during the `zowe config report-env` command by removing the NVM version number from our report.
- Enhancement: Replaced the term "Team configuration" with "Zowe client configuration" in the `zowe config report-env` command.

## `8.0.0-next.202402261705`

- BugFix: Updated additional dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)
- BugFix: Updated engine to Node 16.7.0. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202402211923`

- Enhancement: Added new `zowe zos-jobs search job` command, which allows the user to search spool files for a specified string or regular expresion.
- BugFix: Updated dependencies for technical currency. [#2057](https://github.com/zowe/zowe-cli/pull/2057)

## `8.0.0-next.202402132108`

- LTS Breaking: Removed record format (recfm) validation when issuing `zowe files create` commands [#1699](https://github.com/zowe/zowe-cli/issues/1699)
- LTS Breaking: Added Zowe release version output for `--version` [#2028](https://github.com/zowe/zowe-cli/issues/2028)
- Enhancement: Added `name-only` alias to `root` on `config list` command [#1797](https://github.com/zowe/zowe-cli/issues/1797)
- BugFix: Resolved technical currency by updating `socks` transitive dependency

## `8.0.0-next.202402021649`

LTS Breaking: Removed the following previously deprecated items: [#1981](https://github.com/zowe/zowe-cli/pull/1981)
  - Moved the many constants from `zowe-cli/packages/cli/src/Constants.ts` to `zowe-cli/packages/core/src/constants/Core.constants.ts`
  - Removing `ZosFilesCreateExtraOptions.showAttributes` without replacement
  - Moved all constants from `zowe-cli/packages/cli/src/zostso/constants/ZosTso.constants.ts` to  `@zowe/zos-tso-for-zowe-sdk`
  - Removed `isStderrEmptyForProfilesCommand` use `stripProfileDeprecationMessages` from `zowe-cli/__tests__/__packages__/cli-test-utils/src/TestUtils.ts` instead
  - Removed  `allDataSetsArchived`, `datasetsDownloadedSuccessfully`, `noDataSetsMatchingPatternRemain` and `onlyEmptyPartitionedDataSets` from    ZosFiles.messages.ts
  - Removed `getSpoolDownloadFile` use `getSpoolDownloadFilePath` instead
  - Removed constants from ZosmfSession
    - ZOSMF_OPTION_HOST_PROFILE use ZOSMF_OPTION_HOST instead
    - ZOSMF_OPTION_USER_PROFILE use ZOSMF_OPTION_USER instead
    - ZOSMF_OPTION_PASSWORD_PROFILE use ZOSMF_OPTION_PASSWORD instead
  - Removed constants from SshSession.ts
    - SSH_OPTION_USER_PROFILE use SSH_OPTION_USER
    - SSH_OPTION_HOST_PROFILE use SSH_OPTION_HOST
  - Removed zosmfProfile from `ZosFilesBase.handler.ts`
  - Removed statCmdFlag as an export from Shell.ts

## `8.0.0-next.202401262128`

- Enhancement: Adding `--binary` and `--encoding` options to `zosfiles edit`

## `8.0.0-next.202401191954`

- LTS Breaking: Removed all 'profiles' commands, since they only worked with now-obsolete V1 profiles.
- BugFix: Properly construct workflow error messages to display properly with V3 error formatting.

## `8.0.0-next.202401081937`

- BugFix: Fixed typo in command help for `zowe zos-workflows create` commands.

## `8.0.0-next.202401031939`

- Enhancement: Revised help text for consistency [#1756](https://github.com/zowe/zowe-cli/issues/1756)

## `8.0.0-next.202311291643`

- LTS Breaking: Replaced the `ZOWE_EDITOR` environment variable with `ZOWE_OPT_EDITOR` and `--editor` option on commands [#1867](https://github.com/zowe/zowe-cli/issues/1867)

## `8.0.0-next.202311282012`

- LTS Breaking: Moved `getDataSet` from the `zosfiles` command group to the `zosfiles` SDK as `ZosFilesUtils.getDataSetFromName` [#1696](https://github.com/zowe/zowe-cli/issues/1696)

## `8.0.0-next.202311141517`

- LTS Breaking: Alter the format of error messages to be more clear and actionable.
- LTS Breaking: Remove the ```bright``` command from the product.

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.29.1`

- BugFix: Updated `micromatch` dependency for technical currency. [#2242](https://github.com/zowe/zowe-cli/pull/2242)

## `7.28.3`

- BugFix: Refactored code to reduce the use of deprecated functions to prepare for upcoming Node.js 22 support. [#2191](https://github.com/zowe/zowe-cli/issues/2191)

## `7.25.1`

- BugFix: Updated `braces` dependency for technical currency. [#2157](https://github.com/zowe/zowe-cli/pull/2157)

## `7.25.0`

- Enhancement: Added the ability to set JCL reader properties for `--jobRecordLength`, `--jobRecordFormat` and `--jobEncoding` on the `zowe jobs submit local-file` and `zowe jobs submit stdin` commands. [#2139](https://github.com/zowe/zowe-cli/pull/2139)
- Enhancement: Added the ability to download job spool files using other codepages with `--encoding` on the `zowe jobs download output`, `zowe jobs view spool-file-by-id` and `zowe jobs view all-spool-content` commands. This allows users to download job spool files in other languages (i.e. IBM-1147 for French). [#1822](https://github.com/zowe/zowe-cli/pull/1822)

## `7.24.2`

- BugFix: Fixed `zowe daemon enable` installing an invalid daemon binary on macOS. [#2126](https://github.com/zowe/zowe-cli/pull/2126)

## `7.24.0`

- Enhancement: Prompt for user/password on SSH commands when a token is stored in the config. [#2081](https://github.com/zowe/zowe-cli/pull/2081)
- BugFix: Fixed error in `zos-files list all-members` command that could occur when members contain control characters in the name. [#2104](https://github.com/zowe/zowe-cli/pull/2104)

## `7.23.9`

- BugFix: Resolved technical currency by updating `tar` dependency. [#2101](https://github.com/zowe/zowe-cli/issues/2101)
- BugFix: Resolved technical currency by updating `markdown-it` dependency. [#2106](https://github.com/zowe/zowe-cli/pull/2106)

## `7.23.5`

- BugFix: Fixed default base profile missing in config generated by `zowe config auto-init` [#2084](https://github.com/zowe/zowe-cli/pull/2084)

## `7.23.4`

- BugFix: Updated dependencies of the daemon client for technical currency [#2076](https://github.com/zowe/zowe-cli/pull/2076)

## `7.23.3`

- BugFix: Fixed race condition in `config convert-profiles` command that may fail to delete secure values for old profiles

## `7.23.2`

- BugFix: Resolved technical currency by updating `socks` transitive dependency

## `7.23.1`

- Enhancement: Adding `--binary` and `--encoding` options to `zosfiles edit` to zowe V2

## `7.23.0`

- BugFix: Update zos-files copy dsclp system tests to include large mock files.

## `7.22.0`

- Enhancement: Hid the progress bar if `CI` environment variable is set, or if `FORCE_COLOR` environment variable is set to `0`. [#1845](https://github.com/zowe/zowe-cli/issues/1845)

## `7.21.2`

- BugFix: Correct extra character being displayed at the end of lines when issuing `zowe files compare` on Windows. [#1992](https://github.com/zowe/zowe-cli/issues/1992)
- BugFix: Correct the online help description for `zowe files compare uss`. [#1754](https://github.com/zowe/zowe-cli/issues/1754)
- BugFix: Fixed typo in command help for `zowe zos-workflows create` commands.

## `7.20.1`

- BugFix: Add missing npm-shrinkwrap

## `7.20.0`

- Deprecated: `getDataSet` in the `zosfiles` command group utility functions, use `zosfiles` SDK's `ZosFilesUtils.getDataSetFromName` instead. [#1696](https://github.com/zowe/zowe-cli/issues/1696)

## `7.18.10`

- BugFix: Added missing z/OSMF connection options to the z/OS Logs command group.

## `7.18.9`

- Enhancement: Incorporate all source code from the zowe/imperative Github repository into the zowe/zowe-cli repository. This change should have no user impact.
- BugFix: Removed out of date `Perf-Timing` performance timing package.
- BugFix: Fix behavior where a specified directory was being lowercased on non-PDS datasets when downloading all datasets [#1722](https://github.com/zowe/zowe-cli/issues/1722)

## `7.18.8`

- BugFix: Fix bug where encoding is not passed to the Download USS Directory API [#1825](https://github.com/zowe/zowe-cli/issues/1825)

## `7.18.7`

- BugFix: Bump Imperative to `5.18.2` to fix issues with normalizing newlines on file uploads [#1815](https://github.com/zowe/zowe-cli/issues/1815)

## `7.18.6`

- BugFix: Bump Secrets SDK to `7.18.6` to use `core-foundation-rs` instead of the now-archived `security-framework` crate, and to include the edge-case bug fix for Linux.

## `7.18.5`

- BugFix: Bump Secrets SDK to `7.18.5` to resolve build failures for FreeBSD users.

## `7.18.4`

- BugFix: Bump Secrets SDK to `7.18.4` - uses more reliable resolution logic for `prebuilds` folder; adds static CRT for Windows builds.

## `7.18.0`

- Enhancement: Updated daemon on MacOS to use universal binary which adds support for Apple Silicon.
- Enhancement: Added support for mutliple `zowe auth login apiml` operations on a single `zowe config secure` call. [#1734](https://github.com/zowe/zowe-cli/pull/1734)
- Enhancement: Replaced use of `node-keytar` with the `keyring` module from `@zowe/secrets-for-zowe-sdk`.
- Enhancement: Updated the Imperative Framework to add support for unique cookie identifiers from API ML. [#1734](https://github.com/zowe/zowe-cli/pull/1734)
- BugFix: Fixed an issue in the Daemon server which prevents users on Windows with uppercase letters in their username from using the Daemon
- BugFix: Add check for invalid block size when creating a sequential dataset. [#1439](https://github.com/zowe/zowe-cli/issues/1439)
- BugFix: Allowed `logout` operations with invalid and/or expired tokens. [#1734](https://github.com/zowe/zowe-cli/pull/1734)
- BugFix: Prevented misleading `basePath error` when credentials are invalid. [#1734](https://github.com/zowe/zowe-cli/pull/1734)

## `7.17.0`

- Enhancement: Created zos-files edit commands to edit a dataset or uss file locally [PR #1672](https://github.com/zowe/zowe-cli/pull/1672)

## `7.16.5`

- BugFix: Fixed `zowe files create data-set` failing when no additional options are specified.
- BugFix: Added check for invalid block size when creating a sequential data set. [#1439](https://github.com/zowe/zowe-cli/issues/1439)
- BugFix: Added the ability to list all data set members when some members have invalid names.
- BugFix: Removed extra calls to list datasets matching patterns if authentication to z/OSMF fails.

## `7.16.4`

- BugFix: Fixed `secondary` option being specified as `1` on `BLANK` type datasets with the `zowe files create data-set` command [#1595](https://github.com/zowe/zowe-cli/issues/1595)


## `7.16.3`

- BugFix: Updated `imperative` to fix undesired behavior in the `zowe config list` command in certain situations.

## `7.16.2`

- BugFix: Updated `tar` dependency.

## `7.16.1`

- BugFix: Fixed `--range` option ignored on `zowe files view uss-file` command.
- BugFix: Fixed `--binary` option ignored by commands that upload and download USS directories when ".zosattributes" file is used.
- BugFix: Fixed `--include-hidden` option ignored by `zowe files upload dir-to-uss` without the `--recursive` option.

## `7.16.0`

- Enhancement: Updated daemon to use `tokio` library instead of unmaintained `named_pipe` library.

## `7.15.0`

- Enhancement: Added the `zowe files copy dsclp` command to copy a dataset from one LPAR to another.  [#1098](https://github.com/zowe/zowe-cli/issues/1098)

## `7.14.1`:

- Enhancement: Re-enabled color in the daemon client [#1379](https://github.com/zowe/zowe-cli/issues/1379)
- BugFix: Enabled ANSI in Windows based terminals [#1701](https://github.com/zowe/zowe-cli/issues/1701)
- BugFix: Changed daemon to spawn as its own process [#1241](https://github.com/zowe/zowe-cli/issues/1241) [#1277](https://github.com/zowe/zowe-cli/issues/1277) [#1309](https://github.com/zowe/zowe-cli/issues/1309)
- BugFix: Updated Imperative to allow for special handling of chalk and coloring in daemon client

## `7.13.0`

- Enhancement: Updated Imperative to add `--prune` option to `zowe config secure` command. [Imperative #547](https://github.com/zowe/imperative/issues/547)

## `7.12.0`

- Enhancement: Added `range` option to `zos-files view uss-file` command
- BugFix: Fixed `encoding` option for `zos-files view uss-file` command [#1495](https://github.com/zowe/zowe-cli/issues/1495)
- BugFix: Adds notification that `encoding`, `binary`, and `record` options conflict on the `zos-files view data-set` and `zos-files view uss-file` commands
- BugFix: Updated Imperative to fix the `zowe auth li` and `zowe auth lo` aliases [Imperative #964](https://github.com/zowe/imperative/issues/964)

## `7.11.3`

- BugFix: Fixed URI encoding on `zos-jobs` commands [#1596](https://github.com/zowe/zowe-cli/issues/1596)
- BugFix: Updated Imperative to fix an error on Windows preventing plug-ins from installing if a local file or directory contains a space. [Imperative #959](https://github.com/zowe/imperative/issues/959)

## `7.11.2`

- BugFix: Updated daemon executable to resolve technical debt
- BugFix: Fixed URI encoding on `zos-files` commands [#1073](https://github.com/zowe/zowe-cli/issues/1073)

## `7.11.1`

- BugFix: Solved daemon issue where Windows usernames were treated as case-sensitive when checking the daemon process owner during Zowe commands.

## `7.11.0`
- Enhancement: Added support for a CLI specific environment variable file. [#1484](https://github.com/zowe/zowe-cli/issues/1484)
- BugFix: Enabled option to download output from a submitted job with the -d flag. The -e flag now enables changes to file extension as originally intended. [#729](https://github.com/zowe/zowe-cli/issues/729)

## `7.10.4`
- BugFix: Changed default value for modify-jobs option in the zowe jobs command group to 2.0. This change results in calls to z/OSMF becoming synchronous, and a successful response from the modify, cancel, and delete commands indicates the requested action was completed successfully. [#1459](https://github.com/zowe/zowe-cli/issues/1459)

## `7.10.3`
- BugFix: Fix in employing `--context-lines` option for all diff/compare commands. Fixed broken `--seqnum` option implementation.[#1529](https://github.com/zowe/zowe-cli/issues/1529)

## `7.10.2`
- BugFix: Updated Imperative to include bugfixes in version `5.8.2`.

## `7.10.0`

- Enhancement: Added support for downloading job spool content in binary and record formats.

## `7.9.7`

- BugFix: Updated Imperative to include bugfixes in version `5.7.7`.

## `7.9.6`

- BugFix: Updated Imperative to include bugfixes in version `5.7.6`.

## `7.9.5`

- BugFix: Fixed daemon broken pipe error on Windows [#1538](https://github.com/zowe/zowe-cli/issues/1538)

## `7.9.4`

- BugFix: Removed all line break encodings from strings for `zos-files compare local-file-data-set` [#1528](https://github.com/zowe/zowe-cli/issues/1528)

## `7.9.3`

- BugFix: Updated Imperative to include bugfixes in version `5.7.5`.

## `7.9.0`

- Enhancement: Added new functions to support the changing of a job class and the hold status of a job. Can now call `zowe jobs modify job [jobid]` with options `--jobclass`, `--hold` and `--release`. [#1156](https://github.com/zowe/zowe-cli/issues/1156)
- BugFix: Documented that token-type and token-value do not apply to SSH commands.
- BugFix: Updated Imperative to include bugfixes in version `5.7.2`.

## `7.8.0`

- Enhancement: Updated Imperative to incorporate new `zowe config report-env` command from version `5.7.0`.
- Enhancement: Added design documentation for roadmap feature to store secure properties in memory.

## `7.7.0`

- Enhancement: Allow `zowe files view ds ... --range SSS-EEE | SSS,NNN`. [#1539](https://github.com/zowe/zowe-cli/issues/1539)
- Enhancement: Added `ZosFilesCreateOptions.alcunit` option to PDS definition. [#1203](https://github.com/zowe/zowe-cli/issues/1203)
- BugFix: Fixed example 3 where no `--like` option is specified in `zowe zos-files create data-set`. [#1252](https://github.com/zowe/zowe-cli/issues/1252)

## `7.6.2`

- BugFix: Updated `minimatch` and `keytar` dependencies for technical currency.
- BugFix: Updated example for `zowe profiles create zosmf-profile` command. [#1152](https://github.com/zowe/zowe-cli/issues/1152)
- BugFix: Restore info message on daemon startup. [#1506](https://github.com/zowe/zowe-cli/issues/1506)

## `7.6.1`

- BugFix: Updated `ssh2` dependency to fix "Received unexpected packet type" error on SSH commands. [#1516](https://github.com/zowe/zowe-cli/issues/1516)
- BugFix: Updated Imperative to include bugfixes in version `5.5.3`.

## `7.6.0`

- Enhancement: Added the `zowe files download uss-dir` command to download the contents of a USS directory. [#1038](https://github.com/zowe/zowe-cli/issues/1038)
- Enhancement: Updated the `zowe files upload file-to-uss` and `zowe files upload dir-to-uss` commands to improve how they handle file encoding. [#1479](https://github.com/zowe/zowe-cli/issues/1479)
  - Both commands now "chtag" files after uploading them to indicate their remote encoding. This matches the already existing behavior of the `zowe files download uss-file` command which checks file tags before downloading.
  - The behavior of ".zosattributes" files which can specify local and remote encoding has been changed. Files are now converted to the remote encoding, not just tagged. If no encoding is specified, the default transfer mode is text instead of binary to be consistent with z/OSMF default behavior.
- BugFix: Updated Imperative to include bugfixes in version `5.5.2`.

## `7.5.1`

- BugFix: Updated Imperative to include bugfixes in version `5.5.1`.

## `7.5.0`

- Enhancement: Added the browser-view option to `zowe zos-files compare data-set` command to compare two datasets and display the differences on the browser. [#1443](https://github.com/zowe/zowe-cli/issues/1443)
- Enhancement: Added a command `zowe zos-files compare local-file-data-set` to compare a local-file and a dataset, & display the differences in the browser and terminal. [#1444](https://github.com/zowe/zowe-cli/issues/1444)
- Enhancement: Added a command `zowe zos-files compare uss-files` to compare two uss-files, & display the differences in the browser and terminal. [#1445](https://github.com/zowe/zowe-cli/issues/1445)
- Enhancement: Added a command `zowe zos-files compare local-file-uss-file` to compare a local-file and a uss-file, & display the differences in the browser and terminal. [#1446](https://github.com/zowe/zowe-cli/issues/1446)
- Enhancement: Added a command `zowe zos-files compare spool-dd` to compare two spool-dds', & display the differences in the browser and terminal. [#1447](https://github.com/zowe/zowe-cli/issues/1447)
- Enhancement: Added a command `zowe zos-files compare local-file-spool-dd` to compare a local-file and a spool-dd', & display the differences in the browser and terminal. [#1448](https://github.com/zowe/zowe-cli/issues/1448)
- Enhancement: Added `ZOWE_CLI_PLUGINS_DIR` environment variable to override location where plugins are installed. [#1483](https://github.com/zowe/zowe-cli/issues/1483)
- BugFix: Updated Imperative to include bugfixes in version `5.5.0`.

## `7.4.2`

- BugFix: Renamed `download data-set-matching` to `download data-sets-matching`. The old name still exists as an alias.
- BugFix: Fixed output of `download data-sets-matching` being printed twice when some data sets fail to download.

## `7.4.1`

- BugFix: Updated Imperative to fix error when installing plug-ins that do not define profiles.

## `7.4.0`

- Enhancement: Added the `zowe zos-files compare data-set` command to compare two datasets and display the differences on the terminal. [#1442](https://github.com/zowe/zowe-cli/issues/1442)
- BugFix: Alter the `zowe daemon disable` command to only kill the daemon running for the current user.

## `7.3.1`

- BugFix: Updated Imperative to fix CLI commands failing with error "Cannot find module 'ansi-colors'".

## `7.3.0`

- Enhancement: Added the `zowe files download data-sets-matching` command to download multiple data sets at once. [#1287](https://github.com/zowe/zowe-cli/issues/1287)
  - Note: If you used this command previously in the extended files plug-in for Zowe v1, the `--fail-fast` option now defaults to true which is different from the original behavior.

## `7.2.4`

- BugFix: Fixed the Zowe Daemon binary exiting with an error if the daemon server does not start within 3 seconds.

## `7.2.3`

- BugFix: Updated Imperative to address `ProfileInfo` related issues.

## `7.2.2`

- BugFix: Updated Imperative to address `ProfileInfo` related issues.

## `7.2.1`

- BugFix: Fixed name of the positional in `zowe zos-jobs submit uss-file` command.
- BugFix: Updated the description of the `zowe zos-jobs view all-spool-content` command.
- BugFix: Updated the descriptions of the `zowe zos-files view uss-file` and  `zowe zos-files view data-set` commands.
- BugFix: Removed the `zowe zos-files view uss-file <file> --record` option.
- BugFix: Fixed description of the `zowe zos-jobs delete` command group.
- BugFix: Added `--modify-version` option to `zowe zos-jobs delete old-jobs` command for feature parity with `zowe zos-jobs delete job`.

## `7.2.0`

- Enhancement: Added the `zowe zos-jobs view all-spool-content` command to view all spool content given a job id. [#946](https://github.com/zowe/zowe-cli/issues/946)
- Enhancement: Added the `zowe jobs submit uss-file` command to submit a job from a USS file. [#1286](https://github.com/zowe/zowe-cli/issues/1286)
- Enhancement: Added the `zowe files view data-set` and `zowe files view uss-file` commands to view a dataset or USS file. [#1283](https://github.com/zowe/zowe-cli/issues/1283)
- Enhancement: Added the `zowe jobs delete old-jobs` command to delete (purge) jobs in OUTPUT status. [#1285](https://github.com/zowe/zowe-cli/issues/1285)
- BugFix: Updated Imperative to address `ProfileInfo` related issues. [zowe/vscode-extension-for-zowe#1777](https://github.com/zowe/vscode-extension-for-zowe/issues/1777)

## `7.1.3`

- BugFix: Fixed issue where `config auto-init` could report that it modified a config file that did not yet exist.
- BugFix: Updated Imperative to fix `config import` and `config secure` commands not respecting the `--reject-unauthorized` option.

## `7.1.2`

- BugFix: Fixed an issue where privateKey is not being respected. [#1398](https://github.com/zowe/zowe-cli/issues/1398) [#1392](https://github.com/zowe/zowe-cli/issues/1392)

## `7.1.1`

- BugFix: Moved `authConfig` object from the core SDK into the CLI's base profile definition to fix invalid handler path.

## `7.1.0`

- Enhancement: Updated the `zowe config auto-init` command to allow using certificates for authentication. [#1359](https://github.com/zowe/zowe-cli/issues/1359)
- Enhancement: Exposed profile type configuration from the respective SDKs.
- BugFix: Fixed issue where SSH command waits forever when user has expired password. [#989](https://github.com/zowe/zowe-cli/issues/989)

## `7.0.2`

- BugFix: Updated Imperative to fix a v1 profiles bug when storing a profile with no secure properties.

## `7.0.1`

- BugFix: Fixed ProfileInfo API targeting default base profile instead of the operating layer's base profile. [Imperative #791](https://github.com/zowe/imperative/issues/791)

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `7.0.0-next.202204142300`

- BugFix: Updated the imperative version to consume ProfileInfo API updates and to remove the `moment` dependency.

## `7.0.0-next.202204141408`

- Enhancement: Updated the version number of the Zowe-CLI executable.

## `7.0.0-next.202204111828`

- Enhancement: Added help for `zowe daemon restart` command.
- Enhancement: Changed type of `encoding` property on z/OSMF profile from number to string to support more values (e.g., "ISO8859-1").

## `7.0.0-next.202204111523`

- Enhancement: Launch a separate Zowe CLI daemon for each user on multi-user systems.
- **Next Breaking**: Removed environment variables ZOWE_DAEMON and ZOWE_DAEMON_LOCK. Replaced them with ZOWE_DAEMON_DIR and ZOWE_DAEMON_PIPE.

## `7.0.0-next.202204111431`

- BugFix: Updated Imperative to enhance backward compatibility with v1 profiles and other enhancements and bug fixes (More details: Imperative [v5.0.0-next.202204051515](https://github.com/zowe/imperative/blob/next/CHANGELOG.md#500-next202204051515) and [v5.0.0-next.202204081605](https://github.com/zowe/imperative/blob/next/CHANGELOG.md#500-next202204081605))

## `7.0.0-next.202203311904`

- BugFix: Updated `zowe auth login apiml`, `zowe auth logout apiml` and `zowe config auto-init` comamnds to use v2 APIML APIs [#1339](https://github.com/zowe/zowe-cli/issues/1339)
- BugFix: Updated Imperative to avoid loading the credential manager if the given config file is not secure. [Imperative #762](https://github.com/zowe/imperative/issues/762)

## `7.0.0-next.202203282106`

- Enhancement: Added support for `--record` format on `zowe zos-files download (data-set|all-members)` and `zowe zos-files upload (dir-to-pds|file-to-data-set|stdin-to-data-set)` [#539](https://github.com/zowe/zowe-cli/issues/539)

## `7.0.0-next.202203211751`

- BugFix: Updated Imperative to allow applications to update credentials from the `ProfileInfo` APIs. [zowe/vscode-extension-for-zowe#1646](https://github.com/zowe/vscode-extension-for-zowe/issues/1646)

## `7.0.0-next.202203101634`

- Enhancement: Added prompt for base profile host property to `zowe config init`. [#1219](https://github.com/zowe/zowe-cli/issues/1219)

## `7.0.0-next.202203042035`

- BugFix: Allows the CLI to complete installation when there is invalid config JSON [#1198](https://github.com/zowe/zowe-cli/issues/1198)

## `7.0.0-next.202203041732`

- Enhancement: The `zowe daemon enable` and `zowe daemon disable` commands run a process in the background so that they no longer require a user to copy and paste another command to successfully perform the operation.

## `7.0.0-next.202202241854`

- **LTS Breaking**: Added `stdin` property to `IHandlerParameters` which defaults to `process.stdin` and is overridden with another readable stream in daemon mode.
  - CLI plug-ins that read from `process.stdin` in their command handlers should replace it with `{IHandlerParameters}.stdin` to be compatible with Zowe v2 daemon mode.
  - This may be a breaking change for unit tests that mock the `IHandlerParameters` interface since a required property has been added.
  - It is recommended to replace `IHandlerParameters` mocks with the `mockHandlerParameters` method in the @zowe/cli-test-utils package which should protect you from future breaking changes to this interface.
- BugFix: Fixed Daemon Concurrency problems in Windows by introducing a lock file

## `7.0.0-next.202202171858`

- **Next Breaking**: Use sockets and named pipes instead of ports for daemon communication for improved access control.
- BugFix: Fixed Keytar not present in top level dependencies when CLI is installed non-globally. [#1314](https://github.com/zowe/zowe-cli/issues/1314)

## `7.0.0-next.202202151759`

- BugFix: Updated Imperative to convert previously used profile property names into V2-compliant property names.

## `7.0.0-next.202202112312`

- BugFix: Fixed packaging of daemon binary for macOS.

## `7.0.0-next.202202092037`

- BugFix: Fixed some optional dependencies missing from npm-shrinkwrap file.

## `7.0.0-next.202202041954`

- BugFix: Fixed daemon binaries missing from package and Keytar binaries not found at install time.

## `7.0.0-next.202202041533`

- BugFix: Updated Imperative to improve log messages when Keytar module fails to load.

## `7.0.0-next.202201261615`

- BugFix: Included an npm-shrinkwrap file to lock-down all transitive dependencies.

## `7.0.0-next.202201252014`

- BugFix: Fixed 'daemon disable' command to kill any running zowe daemon on Linux and Mac. [#1270](https://github.com/zowe/zowe-cli/issues/1270)
- BugFix: Fixed stdin data being corrupted when daemon server processes CLI command containing double-byte characters.
- Enhancement: Added a user message within 'daemon enable' and disable to open a new terminal when needed.
- **LTS Breaking**: Make the `user` field on SSH profiles secure. [#682](https://github.com/zowe/zowe-cli/issues/682)

## `7.0.0-next.202201121428`

- BugFix: Set executable attribute on zowe executable file on Linux and Mac.
- Enhancement: Ensure `zowe config auto-init` command saves the `rejectUnauthorized` value. [#1109](https://github.com/zowe/zowe-cli/issues/1109)

## `7.0.0-next.202201111811`

- BugFix: Update Imperative to absorb bugfixes introduced in version `5.0.0-next.202201102100`.
- Enhancement: Add the commands `zowe daemon enable` and `zowe daemon disable`. These commands enable end-users to set up daemon mode without having to download a separate executable and place it by hand into some directory.
- Enhancement: Refactored communication between Imperative daemon client and server. Previously the client only sent CLI arguments and the current working directory. Now it sends a JSON object that also includes environment variables and input piped from stdin. [#1179](https://github.com/zowe/zowe-cli/issues/1179)
- **Next Breaking**: The Daemon-related class named `Processor` was renamed to `DaemonDecider`.
- **Next Breaking**: Remove `--dcd` argument which was reserved for `--daemon-current-directory`.
- **Next Breaking**: Add user check to daemon communication

## `7.0.0-next.202112281543`

- Enhancement: update a "show attributes" flag to be `-a` instead of `--pa`.  `--pa` is a "hidden" alias.

## `7.0.0-next.202112201801`

- BugFix: Fixed socket connection error on macOS after commands that run in daemon mode. [#1192](https://github.com/zowe/zowe-cli/issues/1192)
- BugFix: Fixed daemon failing to run in path that contains space in directory name. [#1237](https://github.com/zowe/zowe-cli/issues/1237)

## `7.0.0-next.202112142155`

- Enhancement: Upgrade Imperative so that secure prompts do not show input and zowe.config.json secure properties are not logged. [#1106](https://github.com/zowe/zowe-cli/issues/1106)

## `7.0.0-next.202112081943`

- **Next Breaking**: Remove hardcoded `--dcd` argument sent between imperative daemon server and client.

## `7.0.0-next.202112021313`

- **Next Breaking**: Use JSON-based communication protocol between imperative daemon server and client.

## `7.0.0-next.202111221932`

- BugFix: Changed credentials to be stored securely by default for v1 profiles to be consistent with the experience for v2 profiles. [#1128](https://github.com/zowe/zowe-cli/issues/1128)

## `7.0.0-next.202111111904`

- Daemon mode updates:
    - Enhancements:
        - Renamed the platform-specific executable from zowex to zowe, so that existing zowe commands used from the command line or in scripts do not have to change when running in daemon mode.
        - Automatically launch the background daemon when one is not running.
        - The daemon no longer has its own visible window, making it much more daemon-like.
        - An environment variable named ZOWE_USE_DAEMON can be set to "no" to prevent the use of the daemon. Commands are then passed to the traditional zowe-CLI command. Thus, you can temporarily use the traditional Zowe CLI command to correct some display limitations (like displaying colors).
    - Bug fixes:
        - Eliminate the display of escape characters when colors are displayed while running in daemon mode. [#938](https://github.com/zowe/zowe-cli/issues/938). Currently accomplished by not displaying colors in daemon mode.
        - Command-line arguments that contain spaces no longer require extra quotes or escapes. [#978](https://github.com/zowe/zowe-cli/issues/978)

## `7.0.0-next.202111111709`

- Enhancement: Upgrade Imperative so Daemon Mode can launch and warn about invalid team configuration files. [#943](https://github.com/zowe/zowe-cli/issues/943) [#1190](https://github.com/zowe/zowe-cli/issues/1190)

## `7.0.0-next.202111041425`

- Enhancement: Added `autoStore` property to config JSON files which defaults to true. When this property is enabled and the CLI prompts you to enter connection info, the values you enter will be saved to disk (or credential vault if they are secure) for future use. [zowe/zowe-cli#923](https://github.com/zowe/zowe-cli/issues/923)

## `7.0.0-next.202110211759`

- Enhancement: Display the set of changes made by the 'zowe config auto-init' command.

## `7.0.0-next.202110071909`

- Enhancement: Added `config update-schemas [--depth <value>]` command. [#1059](https://github.com/zowe/zowe-cli/issues/1059)
- **LTS Breaking**: Changed default log level from DEBUG to WARN to reduce the volume of logs written to disk. The log level can still be overridden using environment variables.

## `7.0.0-next.202109281609`

- Enhancement: Added `config import` command that imports team config files from a local path or web URL. [#1083](https://github.com/zowe/zowe-cli/issues/1083)
- Enhancement: Added Help Doc examples for the `zowe config` group of commands. [#1061](https://github.com/zowe/zowe-cli/issues/1061)

## `7.0.0-next.202109032014`

- Enhancement: Log in to API ML to obtain token value instead of prompting for it in `config secure` command.

## `7.0.0-next.202108311536`

- Security: Don't expose port that daemon server listens on (default port is 4000).

## `7.0.0-next.202108202027`

- Update Imperative dependency for the following new features:
  - **LTS Breaking**: Make `fail-on-error` option true by default on `zowe plugins validate` command.
  - Enhancement: Improved command suggestions
  - Performance: Improved the way that HTTP response chunks are saved, reducing time complexity from O(n<sup>2</sup>) to O(n). This dramatically improves performance for larger requests. [Imperative #618](https://github.com/zowe/imperative/pull/618)

## `7.0.0-next.202108121907`

- Enhancement: Flattened the default profiles structure created by the `config init` command.
- **Next Breaking**: Split up authToken property in team config into tokenType and tokenValue properties to be consistent with Zowe v1 profiles.

## `7.0.0-next.202107131230`

- Enhancement: Adds the `config auto-init` command, allowing users to automatically generate a configuration using information stored in conformant installed plugins and the API Mediation Layer.

## `7.0.0-next.202102011525`

- Enhancement: Added new "config" command group to manage config JSON files. This is intended to replace the profiles API, and makes it easier for users to create, share, and switch between profile configurations.
- Enhancement: Added daemon mode which runs a persistent background process "zowex" to improve CLI response time. The "zowex" binary can be downloaded from GitHub releases.
- Enhancement: Added support for secure credential storage without any plug-ins required. On Linux there are some software requirements for this feature which are listed [here](https://github.com/zowe/zowe-cli-scs-plugin#software-requirements).
- Deprecated: The "profiles" command group for managing global profiles in "~/.zowe/profiles". Use the new "config" command group instead.
- **LTS Breaking**: Removed "config" command group for managing app settings in "~/.zowe/imperative/settings.json". If app settings already exist they are still loaded for backwards compatibility.

## `6.40.1`

- BugFix: Updated the imperative version to remove the `moment` dependency.

## `6.40.0`

- Enhancement: Added the `exec-data` option for `zowe jobs list jobs` command to return execution data about the job in addition to the default information. [#1158](https://github.com/zowe/zowe-cli/issues/1158)

## `6.39.1`

- BugFix: Updated Imperative to consume security updates in `4.18.2`.


## `6.39.0`

- BugFix: Provided more accurate output for `zowe zos-jobs delete job` and `zowe zos-jobs cancel job` commands [#1333](https://github.com/zowe/zowe-cli/issues/1333)
- BugFix: Fixed inconsistent case on `modify-version` option for `zowe zos-jobs delete job` and `zowe zos-jobs cancel job` commands [#1333](https://github.com/zowe/zowe-cli/issues/1333)
- Enhancement: Added support for `--record` format on `zowe zos-files download (data-set|all-members)` and `zowe zos-files upload (dir-to-pds|file-to-data-set|stdin-to-data-set)` [#539](https://github.com/zowe/zowe-cli/issues/539)

## `6.38.0`

- Enhancement: Exported the `@zowe/imperative` package as the `imperative` namespace.
  If your project depends on both Zowe CLI and Imperative, you can now `import { imperative } from "@zowe/cli"` without declaring `@zowe/imperative` as a separate dependency in package.json. No change is required for CLI plug-ins.
- BugFix: Fixed inconsistent capitalization with z/OS console command. [#961](https://github.com/zowe/zowe-cli/issues/961)

## `6.37.8`

- Documentation: Updated help text for the `zowe jobs submit stdin` command. [#1284](https://github.com/zowe/zowe-cli/issues/1284)

## `6.37.7`

- BugFix: Fixed some optional dependencies missing from npm-shrinkwrap file.

## `6.37.6`

- BugFix: Pruned dev dependencies from npm-shrinkwrap file.

## `6.37.5`

- BugFix: Included an npm-shrinkwrap file to lock-down all transitive dependencies.

## `6.37.3`

- BugFix: Updated imperative to resolve `--hw` line-break issues. [Imperative #715](https://github.com/zowe/imperative/issues/715)

## `6.37.2`

- BugFix: Disabled gzip compression for z/OSMF requests that download binary files. [#1170](https://github.com/zowe/zowe-cli/issues/1170)

## `6.37.1`

- BugFix: Updated Imperative to absorb bugfixes introduced in version `4.17.2`.

## `6.37.0`

- Enhancement: Added new feature to manage zos-logs. z/OSMF version 2.4 or higher is required. Ensure that the [z/OSMF Operations Log Support is available via APAR and associated PTFs](https://www.ibm.com/support/pages/apar/PH35930). [#1104](https://github.com/zowe/zowe-cli/issues/1104)

## `6.36.1`

- BugFix: Fixed an issue where plugin install and uninstall did not work with NPM version 8. [Imperative #683](https://github.com/zowe/imperative/issues/683)

## `6.36.0`

- Enhancement: Added the command tree JSON object to the `zowe --available-commands` command's data object, returned when `--response-format-json` is specified.

## `6.35.0`

- Enhancement: Removed the misleading `workflow-name` option for the `zowe zos-workflows list definition-file-details` help example. [#659](https://github.com/zowe/zowe-cli/issues/659)
- Enhancement: Exposed new option `modifyVersion` for the `zowe zos-jobs delete job` and `zowe zos-jobs cancel job` commands. [#1092](https://github.com/zowe/zowe-cli/issues/1092)

## `6.34.1`

- BugFix: Reverts hiding the cert-key-file path so users can see what path was specified and check if the file exists.

## `6.34.0`

- Enhancement: Add support for PEM certificate based authentication.

## `6.33.4`

- BugFix: Updated dependencies to resolve problems with the ansi-regex package.

## `6.33.3`

- Enhancement: Update post-install script to display a message when the CLI successfully installs due to increased error messaging from USS SDK when optional pre-requisites are not installed.

## `6.33.1`

- Bugfix: Fixed capitalization of handler paths for `zowe files rename ds` and `zowe files rename dsm` commands.

## `6.33.0`

- Enhancement: Exposed new option `start` for the `zowe zos-files list data-set` command. [#495](https://github.com/zowe/zowe-cli/issues/495)
- Enhancement: Updated Imperative to add the following features:
  - Enhancement: Improved command suggestions for mistyped commands, add aliases to command suggestions.
  - Enhancement: The `plugins validate` command will return an error code when plugins have errors if the new `--fail-on-error` option is specified. Also adds `--fail-on-warning` option to return with an error code when plugins have warnings. [Imperative #463](https://github.com/zowe/imperative/issues/463)
  - BugFix: Fixed regression where characters are not correctly escaped in web help causing extra slashes ("\") to appear. [Imperative #644](https://github.com/zowe/imperative/issues/644)
- Renamed the zos-files `--responseTimeout` option to `--response-timeout` in help docs for consistency. [#803](https://github.com/zowe/zowe-cli/issues/803)

## `6.32.2`

- Fixed inconsistencies in punctuation for command descriptions by adding missing periods. [#66](https://github.com/zowe/zowe-cli/issues/66)

## `6.32.1`

- BugFix: Updated Imperative version to fix web help issues.
- Expanded help text of --data-set-type on create data set command by adding an example of creating PDSE. [#52](https://github.com/zowe/zowe-cli/issues/52)

## `6.32.0`

- Enhancement: Added a `--volume-serial` option to the `zowe zos-files list data-set` command. Use this option to filter data sets by volume serial. [#61](https://github.com/zowe/zowe-cli/issues/61)
- Enhancement: Removed 'z/OS' from zos-files help upload and download commands. [#60](https://github.com/zowe/zowe-cli/issues/60)

## `6.31.2`

- Enhancement: Added new aliases for zos-files commands in delete, download, and list relating to USS files. You can now interact with `uf` or `uss`.  [#983](https://github.com/zowe/zowe-cli/issues/983)

## `6.31.0`

- Enhancement: Add the option --jcl-symbols to the jobs submit command to enable users to specify JCL symbol names and values.

## `6.30.0`

- Enhancement: made changes to definition files for zowe ssh commands  [#603](https://github.com/zowe/zowe-cli/issues/603)

## `6.29.0`

- Enhancement: Added a standard data set template with no parameters set.

## `6.28.0`

- Enhancement: Updated Imperative version to handle GZIP compression on REST requests.

## `6.27.1`

- BugFix: Removed the conflicting alias `-o` for `--protocol` option.

## `6.27.0`

- Enhancement: Added a `like` option to the `zowe zos-files create data-set` command. Use this option to like datasets. [#771](https://github.com/zowe/zowe-cli/issues/771)
- Enhancement: Added a `--protocol` option to allow you to specify the HTTP or HTTPS protocol used. Default value remains HTTPS.[#498](https://github.com/zowe/zowe-cli/issues/498)
- Enhancement: Added an example for running a Db2 command with the `zowe zos-console issue command` command. [#641](https://github.com/zowe/zowe-cli/issues/641)

## `6.26.0`

- Enhancement: Updated Imperative version to support npm@7. This fixes an error when installing plugins.

## `6.25.2`

- Documented early access features that are available in "next" release.

## `6.25.1`

- Bugfix: Updated Imperative version to fix vulnerability.

## `6.25.0`

- Enhancement: Added a `--replace` option to the `zowe zos-files copy data-set` command. Use this option if you want to replace members with identical names in the target data set. [#808](https://github.com/zowe/zowe-cli/issues/808)
- Enhancement: Improved a cryptic error message that was shown if TSO address space failed to start for the `zowe zos-tso issue command` command. [#28](https://github.com/zowe/zowe-cli/issues/28)
- Bugfix: Removed "[object Object]" text that appeared in some error messages. The proper text "Imperative API Error" is now displayed. [#836](https://github.com/zowe/zowe-cli/pull/836)

## `6.24.6`

- BugFix: Improved performance of `zowe zos-files list` commands when very long lists are printed to console. [#861](https://github.com/zowe/zowe-cli/issues/861)

## `6.24.5`

- Bugfix: Updated Imperative dependency version to one that does not contain a vulnerable dependency

## `6.24.3`

- Bugfix: Fixed incorrect syntax of example for `zowe files create data-set-vsam`. [#823](https://github.com/zowe/zowe-cli/issues/823)

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Enhancement: Published the APIs in Zowe CLI as separate SDK packages. [#750](https://github.com/zowe/zowe-cli/issues/750)
- The "@zowe/cli" package still includes both API and CLI methods. In addition, the following SDK packages are now available:
  - @zowe/provisioning-for-zowe-sdk
  - @zowe/zos-console-for-zowe-sdk
  - @zowe/zos-files-for-zowe-sdk
  - @zowe/zos-jobs-for-zowe-sdk
  - @zowe/zos-tso-for-zowe-sdk
  - @zowe/zos-uss-for-zowe-sdk
  - @zowe/zos-workflows-for-zowe-sdk
  - @zowe/zosmf-for-zowe-sdk
  - @zowe/core-for-zowe-sdk

## `6.23.0`

- Enhancement: Added a `--pattern` option to the `zowe files list all-members` command. The option lets you restrict returned member names to only names that match a given pattern. The argument syntax is the same as the "pattern" parameter of the ISPF LMMLIST service. [#810](https://github.com/zowe/zowe-cli/issues/810)
- Enhancement: Added new options `--lrecl` and `--recfm` to the `zos-files create` command. Use these options to specify a logical record length and record format for data sets that you create. [#788](https://github.com/zowe/zowe-cli/issues/788)

## `6.22.0`

- Enhancement: Added the `--encoding` option for the `zowe zos-files upload dir-to-pds` command. This option lets you upload multiple members with a single command. [#764](https://github.com/zowe/zowe-cli/issues/764)
- BugFix: Fixed an issue where the output of the `zowe zos-uss issue ssh` command would sometimes omit the last line. [#795](https://github.com/zowe/zowe-cli/issues/795)

## `6.21.1`

- BugFix: Renamed the z/OS Files API option from `storeclass` to `storclass`. This fixed an issue where the CLI could define the wrong storage class on `create dataset` commands. [#503](https://github.com/zowe/zowe-cli/issues/503)

## `6.21.0`

- Enhancement: Added a `--responseTimeout` option to the z/OS Files APIs, CLI commands, and z/OSMF profiles. Specify `--responseTimeout <###>` to set the number of seconds that the TSO servlet request runs before a timout occurs. The default is 30 seconds. You can set the option to between 5 and 600 seconds (inclusive). [#760](https://github.com/zowe/zowe-cli/issues/760)

## `6.20.0`

- Added API usage examples to each package Readme (files, jobs, etc...). [#751](https://github.com/zowe/zowe-cli/issues/751).
- Fixed an issue where the CLI exited with status code 0 in case of an error. [#748](https://github.com/zowe/zowe-cli/issues/748)
- Added new method "dataSetLike(session, dataSetName, options)" to `Create` class, for use when creating a dataset with parameters like another data set. [#766](https://github.com/zowe/zowe-cli/issues/766)

## `6.19.1`

- Update Imperative version
- Fix compilation error

## `6.19.0`

- Add CLI command to delete migrated data sets `zowe zos-files delete migrated-data-sets`.

## `6.18.0`

- Add the --fail-fast option to the `zowe zos-files download all-members` command
  - Specifying `--fail-fast false` allows member downloads to continue if one or more fail

## `6.17.3`

- Update Imperative version to include compatibility fix for `ISession` type

## `6.17.2`

- Update Imperative version (again) to include security fix

## `6.17.1`

- Update Imperative version to fix issue "Can't use service profile after storing token in base profile"

## `6.17.0`

- Added API to delete migrated data sets.

## `6.16.0`

- Upgrade Zowe commands to prompt for any of the following values if the option is missing: host, port, user, and password.
- Add ability to log into and out of the APIML, getting and using a token
- Add `--base-profile` option to all commands that use profiles, allowing them to make use of base profiles containing shared values.

## `6.15.0`

- Add `encoding` option to `zosmf` profile type.

## `6.14.0`

- Add encoding / code page support for data set upload and download operations in library and CLI.

## `6.13.0`

- Add `files hrec ds` command to recall data sets.
- Make account optional in TSO profiles.
- Make user and host optional in SSH profiles.
- Fix broken links in readme.

## `6.12.0`

- Make username, password, and host optional on z/OSMF profiles and update profile creation doc to reflect the change.
- Don't overwrite files when downloading spool output from job with duplicate step names.

## `6.11.2`

- Update imperative version (again) in order to fix vulnerabilities

## `6.11.1`

- Update imperative version (to fix EPERM issues on Windows)

## `6.11.0`

- Add preserve-original-letter-case option for download to keep generated folders and files in original uppercase.

## `6.10.3`

- Update Migrate and Recall data set APIs to have a base handler function.

## `6.10.2`

- Update Imperative to 4.6.
- Update top-level doc links in help description.

## `6.10.1`

- Update Imperative dependency to fix vulnerability.

## `6.10.0`

- Add `files rename ds` and `files rename dsm` commands to rename data sets and data set members. Thanks @CForrest97

## `6.9.2`

- Return non-zero exit code when upload command fails. Thanks @tjohnsonBCM

## `6.9.1`

- Support `#` character in account number supplied to TSO commands. Thanks @awharn

## `6.9.0`

- Add API to recall migrated datasets. Thanks @Pranay154

## `6.8.2`

- Update the Zowe logo to the new logo. Thanks @awharn

## `6.8.1`

- Add utility function to access ImperativeConfig. Thanks @tjohnsonBCM

## `6.8.0`

- Add possibility to use Etags with download and upload APIs. Thanks @Alexandru-Dimitru
- Add option to return Etag on upload. Thanks @Alexandru-Dimitru

## `6.0.0`

- Rename `files list zfs` command to `files list fs` since it is not specific to zFS file systems.

## `5.0.0`

- Use new streaming RestClient APIs to reduce memory usage when downloading and uploading files.

## `4.0.0`

- Remove the method `Get.dataSetStreamed`. Use `ZosmfRestClient.getStreamed` instead.

## `3.0.0`

- Rename package from "@brightside/core" to "@zowe/cli".
- Change behavior of the method `Shell.executeSsh` to use `stdoutHandler` instead of `streamCallBack`. This eliminates dependency on the `ClientChannel` type of the ssh2 package.
