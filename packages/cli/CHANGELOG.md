# Change Log

All notable changes to the Zowe CLI package will be documented in this file.

## Recent Changes

- **BREAKING** Enhancement: Make the `user` field on SSH profiles secure. [#682](https://github.com/zowe/zowe-cli/issues/682)

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
- Breaking: Changed default log level from DEBUG to WARN to reduce the volume of logs written to disk. The log level can still be overridden using environment variables.

## `7.0.0-next.202109281609`

- Enhancement: Added `config import` command that imports team config files from a local path or web URL. [#1083](https://github.com/zowe/zowe-cli/issues/1083)
- Enhancement: Added Help Doc examples for the `zowe config` group of commands. [#1061](https://github.com/zowe/zowe-cli/issues/1061)

## `7.0.0-next.202109032014`

- Enhancement: Log in to API ML to obtain token value instead of prompting for it in `config secure` command.

## `7.0.0-next.202108311536`

- Security: Don't expose port that daemon server listens on (default port is 4000).

## `7.0.0-next.202108202027`

- Update Imperative dependency for the following new features:
  - Breaking: Make `fail-on-error` option true by default on `zowe plugins validate` command.
  - Enhancement: Improved command suggestions
  - Performance: Improved the way that HTTP response chunks are saved, reducing time complexity from O(n<sup>2</sup>) to O(n). This dramatically improves performance for larger requests. [#618](https://github.com/zowe/imperative/pull/618)

## `7.0.0-next.202108121907`

- Enhancement: Flattened the default profiles structure created by the `config init` command.
- Breaking: Split up authToken property in team config into tokenType and tokenValue properties to be consistent with Zowe v1 profiles.

## `7.0.0-next.202107131230`

- Enhancement: Adds the `config auto-init` command, allowing users to automatically generate a configuration using information stored in conformant installed plugins and the API Mediation Layer.

## `7.0.0-next.202102011525`

- Enhancement: Added new "config" command group to manage config JSON files. This is intended to replace the profiles API, and makes it easier for users to create, share, and switch between profile configurations.
- Enhancement: Added daemon mode which runs a persistent background process "zowex" to improve CLI response time. The "zowex" binary can be downloaded from GitHub releases.
- Enhancement: Added support for secure credential storage without any plug-ins required. On Linux there are some software requirements for this feature which are listed [here](https://github.com/zowe/zowe-cli-scs-plugin#software-requirements).
- Deprecated: The "profiles" command group for managing global profiles in "~/.zowe/profiles". Use the new "config" command group instead.
- **Breaking**: Removed "config" command group for managing app settings in "~/.zowe/imperative/settings.json". If app settings already exist they are still loaded for backwards compatibility.

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
- Development: Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.33.0`

- Enhancement: Exposed new option `start` for the `zowe zos-files list data-set` command. [#495](https://github.com/zowe/zowe-cli/issues/495)
- Enhancement: Updated Imperative to add the following features:
  - Enhancement: Improved command suggestions for mistyped commands, add aliases to command suggestions.
  - Enhancement: The `plugins validate` command will return an error code when plugins have errors if the new `--fail-on-error` option is specified. Also adds `--fail-on-warning` option to return with an error code when plugins have warnings. [#463](https://github.com/zowe/imperative/issues/463)
  - BugFix: Fixed regression where characters are not correctly escaped in web help causing extra slashes ("\") to appear. [#644](https://github.com/zowe/imperative/issues/644)
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