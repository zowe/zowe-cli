# Change Log

All notable changes to the Zowe CLI package will be documented in this file.

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
