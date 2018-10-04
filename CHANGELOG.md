# Changelog
All notable changes to this project will be documented in this file.

## [2.0.0] - 2018-09-24

## BREAKING CHANGES
### Changed
Two breaking changes were made in order to accommodate the donation of this repository to the Zowe Organization:

 - 	The home directory for Zowe CLI, which contains the Zowe CLI logs, profiles, and plug-ins, was changed from `~/.brightside` to `~/.zowe`. The character “~” denotes your home directory on your computer, which is typically `C:/Users/<yourUserId>` on Windows operating systems. When you update CA Brightside and issue `zowe` commands, the profiles that you created previously will not be available.  
   
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
