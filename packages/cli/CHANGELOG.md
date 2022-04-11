# Change Log

All notable changes to the Zowe CLI package will be documented in this file.

## Recent Changes

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