# Change Log

All notable changes to the Zowe CLI package will be documented in this file.

## Recent Changes

- BugFix: Add check for invalid block size when creating a sequential dataset. [#1439](https://github.com/zowe/zowe-cli/issues/1439)

## `7.16.4`

BugFix: Fixed `secondary` option being specified as `1` on `BLANK` type datasets with the `zowe files create data-set` command [#1595](https://github.com/zowe/zowe-cli/issues/1595)

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

- Enhancement: Added a `--replace` option to the `zowe zos-files copy data-set` command. Use this option if you want to replace like-named members in the target data set. [#808](https://github.com/zowe/zowe-cli/issues/808)
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
