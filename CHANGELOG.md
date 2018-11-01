# Changelog
All notable changes to this project will be documented in this file.

## [2.0.0] prerelease -2018-11-6

### Changed

* Progress bars were introduced for the following commands: 
   * `zowe zos-jobs submit data-set`
   * `zowe zos-jobs submit local-file`
   * `zowe zos-files download all-members`
   * `zowe zos-files upload dir-to-pds`

## [2.0.0] prerelease -2018-10-29


## BREAKING CHANGES 

* When creating a zosmf profile with  `zowe profiles create zosmf`, or updating a profile with `zowe profiles update zosmf`,  you must now specify --pass rather than --password.  

### Changed
* It is now possible to use Zowe CLI without the creation of profiles. 
Options have been added to all commands that connect to z/OSMF that allow you to fully qualify your connection details 
without creating a profile first. For example, you can issue the following command without a profile:

`bright zos-files download data-set "my.data.set" --user myuser --pass mypass --host mymainframe.com --port 1443`

* You can also now specify any option on any command via environmental variables using the prefix `ZOWE_OPT_`. 
For example, you can specify the option --host via setting an environmental variable called `ZOWE_OPT_HOST` to the desired value. 

## [2.0.0] prerelease -2018-10-8

## BREAKING CHANGES 

### Changed 

You will be impacted by the following change when you update your version of Zowe CLI on or after October 8, 2018:

Zowe CLI no longer uses keytar to store credentials securely in your operating system's credential vault. The user names and passwords that are stored in zosmf profiles and other profile types are now stored in plain text. 
When you update from a previous version of Zowe CLI, where credentials are stored securely, you must update, or optionally, re-create your profiles.

**Important**! Use the following steps only if you were using an older version of Zowe CLI and updated to version 2.0.0 on or after October 8, 2018.

Follow these steps:

1. Follow the steps that are described in the 2018-09-24 section to migrate your profiles from ~/.brightside to ~/.zowe.

2. After you migrate your profiles, issue the following command to list your existing profiles.

`zowe profiles list zosmf`

3. Update each profile for compatibility with the credential storage changes by issuing the following command:

`zowe profiles update zosmf <profilename> -u <username> -p <password>`

4. (Optional) If you do not want to migrate your profiles from ~/.brightside to ~/.zowe, you can recreate your profiles using the following command:

`zowe profiles create zosmf` (Use `--help` to see examples and options)
## [2.0.0] prerelease - 2018-09-24

## BREAKING CHANGES
### Changed

Two breaking changes were made in order to accommodate the donation of this repository to the Zowe Organization:

 - 	The home directory for Zowe CLI, which contains the Zowe CLI logs, profiles, and plug-ins, was changed from `~/.brightside` to `~/.zowe`. The character “~” denotes your home directory on your computer, which is typically `C:/Users/<yourUserId>` on Windows operating systems. When you update Zowe CLI and issue `zowe` commands, the profiles that you created previously will not be available.  
   
   To correct this behavior and migrate from an older version of Zowe CLI 2.0.0 or greater, complete the following steps: 
   
   1.	Issue any zowe command to create the ~/.zowe home directory.
   2.	After you create the directory, copy the complete contents of the ~/.brightside directory to the newly created ~/.zowe directory. Copying the contents of the ~/.brightside directory to the ~/.zowe directory restores the profiles you created previously. 
   3.	To help ensure that your plug-ins function properly, reinstall the plug-ins that you installed with older versions of Zowe CLI.

- The environment variables that control logging and the location of your home directory were previously prefixed with `BRIGHTSIDE_`.  
  They are now prefixed with `ZOWE_`. If you were not using these environmental variables before this change, no action is required. If you were, 
  update any usage of these variables. The following environmental variables are affected:
    - `BRIGHTSIDE_CLI_HOME`: changed to `ZOWE_CLI_HOME`. 
    - `BRIGHTSIDE_APP_LOG_LEVEL`: changed to `ZOWE_APP_LOG_LEVEL`.
    - `BRIGHTSIDE_IMPERATIVE_LOG_LEVEL`: changed to `ZOWE_IMPERATIVE_LOG_LEVEL`.


### Added
 - `zowe zos-jobs delete job` command: cancel a job and purge its output by providing the JOB ID
- `zowe zos-files upload file-to-uss` command: upload a local file to a file on USS
- `zowe zos-files download uss-file` command: download a file on USS to a local file
- `zowe zos-jobs submit local-file` command: submit a job contained in a local file on your PC rather than a data set
- `zowe zos-jobs download output`  command: download the complete spool output for a job to a local directory on your PC.
- `--view-all-spool-content` option was added to the `zos-jobs submit data-set` and `zos-jobs submit local-file` commands. This allows you to submit a job and view its complete spool output in one command. 
  
## [1.0.5] 

### Fixed 

- `zowe zos-tso start address-space` and `zowe zos-tso issue command` were previously not honoring configured logon procedures and other settings from the `tso` profile.
  This has been fixed and both commands now use the values from the `tso` profile.
  
## [1.0.0] 
Initial version             
