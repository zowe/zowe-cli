# Zowe CLI Help


Welcome to Zowe CLI!

Zowe CLI is a command line interface (CLI) that provides a simple and streamlined way to interact with IBM z/OS.

For additional Zowe CLI documentation, visit https://zowe.github.io/docs-site

For Zowe CLI support, visit https://zowe.org


### Table of Contents
* [config](#config)
	* [set](#config-set)
	* [reset](#config-reset)
	* [list](#config-list)
	* [get](#config-get)
* [plugins](#plugins)
	* [install](#plugins-install)
	* [list](#plugins-list)
	* [uninstall](#plugins-uninstall)
	* [update](#plugins-update)
	* [validate](#plugins-validate)
* [profiles](#profiles)
	* [create | cre](#profiles-create)
		* [zosmf-profile](#profiles-create-zosmf-profile)
		* [tso-profile](#profiles-create-tso-profile)
		* [ssh-profile](#profiles-create-ssh-profile)
	* [update | upd](#profiles-update)
		* [zosmf-profile](#profiles-update-zosmf-profile)
		* [tso-profile](#profiles-update-tso-profile)
		* [ssh-profile](#profiles-update-ssh-profile)
	* [delete | rm](#profiles-delete)
		* [zosmf-profile](#profiles-delete-zosmf-profile)
		* [tso-profile](#profiles-delete-tso-profile)
		* [ssh-profile](#profiles-delete-ssh-profile)
	* [list | ls](#profiles-list)
		* [zosmf-profiles](#profiles-list-zosmf-profiles)
		* [tso-profiles](#profiles-list-tso-profiles)
		* [ssh-profiles](#profiles-list-ssh-profiles)
	* [set-default | set](#profiles-set-default)
		* [zosmf-profile](#profiles-set-default-zosmf-profile)
		* [tso-profile](#profiles-set-default-tso-profile)
		* [ssh-profile](#profiles-set-default-ssh-profile)
* [provisioning | pv](#provisioning)
	* [list | ls](#provisioning-list)
		* [template-info](#provisioning-list-template-info)
		* [catalog-templates](#provisioning-list-catalog-templates)
		* [instance-info](#provisioning-list-instance-info)
		* [instance-variables](#provisioning-list-instance-variables)
		* [registry-instances](#provisioning-list-registry-instances)
	* [provision | prov](#provisioning-provision)
		* [template](#provisioning-provision-template)
	* [perform | perf](#provisioning-perform)
		* [action](#provisioning-perform-action)
	* [delete | del](#provisioning-delete)
		* [instance](#provisioning-delete-instance)
* [zos-console | console](#zos-console)
	* [collect](#zos-console-collect)
		* [sync-responses](#zos-console-collect-sync-responses)
	* [issue](#zos-console-issue)
		* [command](#zos-console-issue-command)
* [zos-files | files](#zos-files)
	* [create | cre](#zos-files-create)
		* [data-set-sequential](#zos-files-create-data-set-sequential)
		* [data-set-partitioned](#zos-files-create-data-set-partitioned)
		* [data-set-binary](#zos-files-create-data-set-binary)
		* [data-set-c](#zos-files-create-data-set-c)
		* [data-set-classic](#zos-files-create-data-set-classic)
		* [data-set-vsam](#zos-files-create-data-set-vsam)
		* [zos-file-system](#zos-files-create-zos-file-system)
		* [uss-file](#zos-files-create-uss-file)
		* [uss-directory](#zos-files-create-uss-directory)
	* [delete | del](#zos-files-delete)
		* [data-set](#zos-files-delete-data-set)
		* [data-set-vsam](#zos-files-delete-data-set-vsam)
		* [uss-file](#zos-files-delete-uss-file)
		* [zos-file-system](#zos-files-delete-zos-file-system)
	* [invoke | call](#zos-files-invoke)
		* [ams-statements](#zos-files-invoke-ams-statements)
		* [ams-file](#zos-files-invoke-ams-file)
	* [download | dl](#zos-files-download)
		* [data-set](#zos-files-download-data-set)
		* [all-members](#zos-files-download-all-members)
		* [uss-file](#zos-files-download-uss-file)
	* [list | ls](#zos-files-list)
		* [all-members](#zos-files-list-all-members)
		* [data-set](#zos-files-list-data-set)
		* [uss-files](#zos-files-list-uss-files)
		* [file-system](#zos-files-list-file-system)
	* [upload | ul](#zos-files-upload)
		* [file-to-data-set](#zos-files-upload-file-to-data-set)
		* [stdin-to-data-set](#zos-files-upload-stdin-to-data-set)
		* [dir-to-pds](#zos-files-upload-dir-to-pds)
		* [file-to-uss](#zos-files-upload-file-to-uss)
		* [dir-to-uss](#zos-files-upload-dir-to-uss)
	* [mount](#zos-files-mount)
		* [file-system](#zos-files-mount-file-system)
	* [unmount | umount](#zos-files-unmount)
		* [file-system](#zos-files-unmount-file-system)
* [zos-jobs | jobs](#zos-jobs)
	* [submit | sub](#zos-jobs-submit)
		* [data-set](#zos-jobs-submit-data-set)
		* [local-file](#zos-jobs-submit-local-file)
		* [stdin](#zos-jobs-submit-stdin)
	* [download | dl](#zos-jobs-download)
		* [output](#zos-jobs-download-output)
	* [view | vw](#zos-jobs-view)
		* [job-status-by-jobid](#zos-jobs-view-job-status-by-jobid)
		* [spool-file-by-id](#zos-jobs-view-spool-file-by-id)
	* [list | ls](#zos-jobs-list)
		* [spool-files-by-jobid](#zos-jobs-list-spool-files-by-jobid)
		* [jobs](#zos-jobs-list-jobs)
	* [delete | del](#zos-jobs-delete)
		* [job](#zos-jobs-delete-job)
	* [cancel | can](#zos-jobs-cancel)
		* [job](#zos-jobs-cancel-job)
* [zos-tso | tso](#zos-tso)
	* [send](#zos-tso-send)
		* [address-space](#zos-tso-send-address-space)
	* [start | st](#zos-tso-start)
		* [address-space](#zos-tso-start-address-space)
	* [ping](#zos-tso-ping)
		* [address-space](#zos-tso-ping-address-space)
	* [stop | sp](#zos-tso-stop)
		* [address-space](#zos-tso-stop-address-space)
	* [issue](#zos-tso-issue)
		* [command](#zos-tso-issue-command)
* [zos-uss | uss](#zos-uss)
	* [issue | iss](#zos-uss-issue)
		* [ssh](#zos-uss-issue-ssh)
* [zos-workflows | wf](#zos-workflows)
	* [create | cre](#zos-workflows-create)
		* [workflow-from-data-set](#zos-workflows-create-workflow-from-data-set)
		* [workflow-from-uss-file](#zos-workflows-create-workflow-from-uss-file)
		* [workflow-from-local-file](#zos-workflows-create-workflow-from-local-file)
	* [start | sta](#zos-workflows-start)
		* [workflow-full](#zos-workflows-start-workflow-full)
		* [workflow-step](#zos-workflows-start-workflow-step)
	* [list | ls](#zos-workflows-list)
		* [active-workflows](#zos-workflows-list-active-workflows)
		* [active-workflow-details](#zos-workflows-list-active-workflow-details)
		* [definition-file-details](#zos-workflows-list-definition-file-details)
		* [archived-workflows](#zos-workflows-list-archived-workflows)
	* [archive](#zos-workflows-archive)
		* [active-workflow](#zos-workflows-archive-active-workflow)
	* [delete | del](#zos-workflows-delete)
		* [active-workflow](#zos-workflows-delete-active-workflow)
		* [archived-workflow](#zos-workflows-delete-archived-workflow)
* [zosmf](#zosmf)
	* [check](#zosmf-check)
		* [status](#zosmf-check-status)
	* [list](#zosmf-list)
		* [systems](#zosmf-list-systems)


# config<a name="config"></a>
Manage configuration and overrides. To see all set-able options use "list" command.
## set<a name="config-set"></a>
Set a configuration setting\.

#### Usage

   zowe config set <configName> <configValue> [options]

#### Positional Arguments

*   `configName`		 *(string)*

	* Setting name\. Possible values:
      CredentialManager \- The package name of a plugin that will override the default
      credential manager to allow for different credential storage methods\.

*   `configValue`		 *(string)*

	* Value to set

#### Examples

*  Set the default credential manager to my-credential-manager:

      * `$  zowe config set CredentialManager my-credential-manager`

## reset<a name="config-reset"></a>
Reset a configuration setting to default value\.

#### Usage

   zowe config reset <configName> [options]

#### Positional Arguments

*   `configName`		 *(string)*

	* Setting name to reset

#### Examples

*  Reset the credential manager to default value:

      * `$  zowe config reset CredentialManager`

## list<a name="config-list"></a>
List all configuration setting options\.

#### Usage

   zowe config list [options]

#### Options

*   `--values`  *(boolean)*

	* Show values for every option

#### Examples

*  List all configuration setting options:

      * `$  zowe config list`

*  List all configuration setting options with values:

      * `$  zowe config list --values`

## get<a name="config-get"></a>
Get a value of single setting option\.

#### Usage

   zowe config get <configName> [options]

#### Positional Arguments

*   `configName`		 *(string)*

	* Setting name

#### Examples

*  Get a value of CredentialManager setting:

      * `$  zowe config get CredentialManager`

# plugins<a name="plugins"></a>
Install and manage plug-ins
## install<a name="plugins-install"></a>
Install plug\-ins to an application\.

#### Usage

   zowe plugins install [plugin...] [options]

#### Positional Arguments

*   `plugin...`		 *(string)*

	* A space\-separated list of plug\-ins to install\. A plug\-in can be any format
      that is accepted by the \`npm install\` command (local directory, TAR file, git
      URL, public package, private package, etc\.\.\.)\.

      To use a relative local directory, at least one '/' or '\' must exist in the
      plug\-in path\. For example, you have a local plug\-in in a folder called
      'test\-plugin' that you want to install\. Specify the relative local directory
      by issuing the following command:

      zowe plugins install \./test\-plugin

      If you omit the '\./', then the install command looks for 'test\-plugin' in an
      npm registry\.

      If the plugin argument is omitted, the plugins\.json file will determine which
      plug\-ins are installed\. For more information on the plugins\.json file, see
      the \-\-file option\.

#### Options

*   `--file`  *(local file path)*

	* Specifies the location of a plugins\.json file that contains the plug\-ins you
      want to install\.

      All plug\-ins specified in plugins\.json will be installed to the base CLI and
      the contents will be placed into
      C:\Users\\\<user>\\.zowe\plugins\plugins\.json\.

      If you do not specify a plugins\.json file and do not specify a plug\-in, the
      default plugin\.json file (C:\Users\\\<user>\\.zowe\plugins\plugins\.json\) will
      be used\. This provides a way to install plug\-ins that were lost or corrupted
      after reinstalling or updating Zowe CLI\.

*   `--registry`  *(string)*

	* The npm registry that is used when installing remote packages\. When this value
      is omitted, the value returned by \`npm config get registry\` is used\.

      For more information about npm registries, see:
      https://docs\.npmjs\.com/misc/registry

*   `--login`  *(boolean)*

	* The flag to add a registry user account to install from secure registry\. It
      saves credentials to the \.npmrc file using \`npm adduser\`\. When this value is
      omitted, credentials from \.npmrc file is used\. If you used this flag once for
      specific registry, you don't have to use it again, it uses credentials from
      \.npmrc file\.

      For more information about npm registries, see:
      https://docs\.npmjs\.com/cli/adduser

#### Examples

*  Install plug-ins saved in
C:\Users\\\<user>\\.zowe\plugins\plugins.json:

      * `$  zowe plugins install`

*  Install plug-ins saved in a properly formatted config file:

      * `$  zowe plugins install --file /some/file/path/file_name.json`

*  Install a remote plug-in:

      * `$  zowe plugins install my-plugin`

*  Install a remote plug-in using semver:

      * `$  zowe plugins install my-plugin@"^1.2.3"`

*  Install a remote plug-in from the specified registry:

      * `$  zowe plugins install my-plugin --registry https://registry.npmjs.org/`

*  Install a local folder, local TAR file, and a git URL:

      * `$  zowe plugins install ./local-file /root/tar/some-tar.tgz git://github.com/project/repository.git#v1.0.0`

*  Install a remote plug-in from the registry which requires
authorization(don't need to use this flag if you have already logged in before):

      * `$  zowe plugins install my-plugin --registry https://registry.npmjs.org/ --login`

## list<a name="plugins-list"></a>
List all plug\-ins installed\.

#### Usage

   zowe plugins list [options]

## uninstall<a name="plugins-uninstall"></a>
Uninstall plug\-ins\.

#### Usage

   zowe plugins uninstall [plugin...] [options]

#### Positional Arguments

*   `plugin...`		 *(string)*

	* The name of the plug\-in to uninstall\.

      If the plug\-in argument is omitted, no action is taken\.

#### Examples

*  Uninstall a plug-in:

      * `$  zowe plugins uninstall my-plugin`

## update<a name="plugins-update"></a>
Update plug\-ins\.

#### Usage

   zowe plugins update [plugin...] [options]

#### Positional Arguments

*   `plugin...`		 *(string)*

	* The name of the plug\-in to update\.

      If the plug\-in argument is omitted, no action is taken\.

#### Options

*   `--registry`  *(string)*

	* The npm registry that is used when installing remote packages\. When this value
      is omitted, the value returned by \`npm config get registry\` is used\.

      For more information about npm registries, see:
      https://docs\.npmjs\.com/misc/registry

*   `--login`  *(boolean)*

	* The flag to add a registry user account to install from secure registry\. It
      saves credentials to the \.npmrc file using \`npm adduser\`\. When this value is
      omitted, credentials from \.npmrc file is used\. If you used this flag once for
      specific registry, you don't have to use it again, it uses credentials from
      \.npmrc file\.

      For more information about npm registries, see:
      https://docs\.npmjs\.com/cli/adduser

#### Examples

*  Update a plug-in:

      * `$  zowe plugins update my-plugin`

*  Update a remote plug-in from the registry which requires
authorization(don't need to use this flag if you have already logged in before):

      * `$  zowe plugins update my-plugin --registry https://registry.npmjs.org/ --login`

## validate<a name="plugins-validate"></a>
Validate a plug\-in that has been installed\.

#### Usage

   zowe plugins validate [plugin] [options]

#### Positional Arguments

*   `plugin`		 *(string)*

	* The name of the plug\-in to validate\.
      Validation issues identified for this plug\-in are displayed\.

      If the plug\-in argument is omitted, all installed plug\-ins are validated\.

#### Examples

*  Validate a plug-in named my-plugin:

      * `$  zowe plugins validate my-plugin`

*  Validate all installed plug-ins:

      * `$  zowe plugins validate`

# profiles<a name="profiles"></a>
Create and manage configuration profiles
## create | cre<a name="profiles-create"></a>
Create new configuration profiles.
### zosmf-profile<a name="profiles-create-zosmf-profile"></a>
z/OSMF Profile

#### Usage

   zowe profiles create zosmf-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new zosmf profile\. You can load this profile by using
      the name on commands that support the "\-\-zosmf\-profile" option\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Options

*   `--overwrite`  | `--ow` *(boolean)*

	* Overwrite the zosmf profile when a profile of the same name exists\.

#### Examples

*  Create a zosmf profile called 'zos123' to connect to z/OSMF
at host zos123 and port 1443:

      * `$  zowe profiles create zosmf-profile zos123 --host zos123 --port 1443 --user ibmuser --password myp4ss`

*  Create a zosmf profile called 'zos124' to connect to z/OSMF
at the host zos124 (default port - 443) and allow self-signed certificates:

      * `$  zowe profiles create zosmf-profile zos124 --host zos124 --user ibmuser --password myp4ss --reject-unauthorized false`

*  Create a zosmf profile called 'zos124' to connect to z/OSMF
at the host zos124 (default port - 443) and allow self-signed certificates:

      * `$  zowe profiles create zosmf-profile zosAPIML --host zosAPIML --port 2020 --user ibmuser --password myp4ss --reject-unauthorized false --base-path basePath`

### tso-profile<a name="profiles-create-tso-profile"></a>
z/OS TSO/E User Profile

#### Usage

   zowe profiles create tso-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new tso profile\. You can load this profile by using
      the name on commands that support the "\-\-tso\-profile" option\.

#### TSO ADDRESS SPACE OPTIONS

*   `--account`  | `-a` *(string)*

	* Your z/OS TSO/E accounting information\.

*   `--character-set`  | `--cs` *(string)*

	* Character set for address space to convert messages and responses from UTF\-8 to
      EBCDIC\.

      Default value: 697

*   `--code-page`  | `--cp` *(string)*

	* Codepage value for TSO/E address space to convert messages and responses from
      UTF\-8 to EBCDIC\.

      Default value: 1047

*   `--columns`  | `--cols` *(number)*

	* The number of columns on a screen\.

      Default value: 80

*   `--logon-procedure`  | `-l` *(string)*

	* The logon procedure to use when creating TSO procedures on your behalf\.

      Default value: IZUFPROC

*   `--region-size`  | `--rs` *(number)*

	* Region size for the TSO/E address space\.

      Default value: 4096

*   `--rows`  *(number)*

	* The number of rows on a screen\.

      Default value: 24

#### Options

*   `--overwrite`  | `--ow` *(boolean)*

	* Overwrite the tso profile when a profile of the same name exists\.

#### Examples

*  Create a tso profile called 'myprof' with default settings
and JES accounting information of 'IZUACCT':

      * `$  zowe profiles create tso-profile myprof -a IZUACCT`

*  Create a tso profile called 'largeregion' with a region size
of 8192, a logon procedure of MYPROC, and JES accounting information of '1234':

      * `$  zowe profiles create tso-profile largeregion -a 1234 --rs 8192`

### ssh-profile<a name="profiles-create-ssh-profile"></a>
z/OS SSH Profile

#### Usage

   zowe profiles create ssh-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new ssh profile\. You can load this profile by using
      the name on commands that support the "\-\-ssh\-profile" option\.

#### z/OS Ssh Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OS SSH server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OS SSH server port\.

      Default value: 22

*   `--user`  | `-u` *(string)*

	* Mainframe user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe password, which can be the same as your TSO password\.

*   `--privateKey`  | `--key` | `--pk` *(string)*

	* Path to a file containing your private key, that must match a public key stored
      in the server for authentication

*   `--keyPassphrase`  | `--passphrase` | `--kp` *(string)*

	* Private key passphrase, which unlocks the private key\.

*   `--handshakeTimeout`  | `--timeout` | `--to` *(number)*

	* How long in milliseconds to wait for the SSH handshake to complete\.

#### Options

*   `--overwrite`  | `--ow` *(boolean)*

	* Overwrite the ssh profile when a profile of the same name exists\.

#### Examples

*  Create a ssh profile called 'ssh111' to connect to z/OS SSH
server at host 'zos123' and default port 22:

      * `$  zowe profiles create ssh-profile ssh111 --host sshhost --user ibmuser --password myp4ss`

*  Create a ssh profile called 'ssh222' to connect to z/OS SSH
server at host 'zos123' and port 13022:

      * `$  zowe profiles create ssh-profile ssh222 --host sshhost --port 13022 --user ibmuser --password myp4ss`

*  Create a ssh profile called 'ssh333' to connect to z/OS SSH
server at host 'zos123' using a privatekey '/path/to/privatekey' and its
decryption passphrase 'privateKeyPassphrase' for privatekey authentication:

      * `$  zowe profiles create ssh-profile ssh333 --host sshhost --user ibmuser --privateKey /path/to/privatekey --keyPassphrase privateKeyPassphrase`

## update | upd<a name="profiles-update"></a>
Update a  profile. You can update any property present within the profile configuration. The updated profile will be printed so that you can review the result of the updates.
### zosmf-profile<a name="profiles-update-zosmf-profile"></a>
z/OSMF Profile

#### Usage

   zowe profiles update zosmf-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new zosmf profile\. You can load this profile by using
      the name on commands that support the "\-\-zosmf\-profile" option\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Examples

*  Update a zosmf profile named 'zos123' with a new username
and password:

      * `$  zowe profiles update zosmf-profile zos123 --user newuser --password newp4ss`

### tso-profile<a name="profiles-update-tso-profile"></a>
z/OS TSO/E User Profile

#### Usage

   zowe profiles update tso-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new tso profile\. You can load this profile by using
      the name on commands that support the "\-\-tso\-profile" option\.

#### TSO ADDRESS SPACE OPTIONS

*   `--account`  | `-a` *(string)*

	* Your z/OS TSO/E accounting information\.

*   `--character-set`  | `--cs` *(string)*

	* Character set for address space to convert messages and responses from UTF\-8 to
      EBCDIC\.

*   `--code-page`  | `--cp` *(string)*

	* Codepage value for TSO/E address space to convert messages and responses from
      UTF\-8 to EBCDIC\.

*   `--columns`  | `--cols` *(number)*

	* The number of columns on a screen\.

*   `--logon-procedure`  | `-l` *(string)*

	* The logon procedure to use when creating TSO procedures on your behalf\.

*   `--region-size`  | `--rs` *(number)*

	* Region size for the TSO/E address space\.

*   `--rows`  *(number)*

	* The number of rows on a screen\.

#### Examples

*  Update a tso profile called myprof with new JES accounting
information:

      * `$  zowe profiles update tso-profile myprof -a NEWACCT`

### ssh-profile<a name="profiles-update-ssh-profile"></a>
z/OS SSH Profile

#### Usage

   zowe profiles update ssh-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new ssh profile\. You can load this profile by using
      the name on commands that support the "\-\-ssh\-profile" option\.

#### z/OS Ssh Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OS SSH server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OS SSH server port\.

*   `--user`  | `-u` *(string)*

	* Mainframe user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe password, which can be the same as your TSO password\.

*   `--privateKey`  | `--key` | `--pk` *(string)*

	* Path to a file containing your private key, that must match a public key stored
      in the server for authentication

*   `--keyPassphrase`  | `--passphrase` | `--kp` *(string)*

	* Private key passphrase, which unlocks the private key\.

*   `--handshakeTimeout`  | `--timeout` | `--to` *(number)*

	* How long in milliseconds to wait for the SSH handshake to complete\.

## delete | rm<a name="profiles-delete"></a>
Delete existing profiles.
### zosmf-profile<a name="profiles-delete-zosmf-profile"></a>
Delete a zosmf profile\. You must specify a profile name to be deleted\. To find
a list of available profiles for deletion, issue the profiles list command\. By
default, you will be prompted to confirm the profile removal\.

#### Usage

   zowe profiles delete zosmf-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the zosmf profile to be deleted\. You can also load this
      profile by using the name on commands that support the "\-\-zosmf\-profile"
      option\.

#### Options

*   `--force`  *(boolean)*

	* Force deletion of profile, and dependent profiles if specified\. No prompt will
      be displayed before deletion occurs\.

#### Examples

*  Delete a zosmf profile named profilename:

      * `$  zowe profiles delete zosmf-profile profilename`

### tso-profile<a name="profiles-delete-tso-profile"></a>
Delete a tso profile\. You must specify a profile name to be deleted\. To find a
list of available profiles for deletion, issue the profiles list command\. By
default, you will be prompted to confirm the profile removal\.

#### Usage

   zowe profiles delete tso-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the tso profile to be deleted\. You can also load this
      profile by using the name on commands that support the "\-\-tso\-profile"
      option\.

#### Options

*   `--force`  *(boolean)*

	* Force deletion of profile, and dependent profiles if specified\. No prompt will
      be displayed before deletion occurs\.

#### Examples

*  Delete a tso profile named profilename:

      * `$  zowe profiles delete tso-profile profilename`

### ssh-profile<a name="profiles-delete-ssh-profile"></a>
Delete a ssh profile\. You must specify a profile name to be deleted\. To find a
list of available profiles for deletion, issue the profiles list command\. By
default, you will be prompted to confirm the profile removal\.

#### Usage

   zowe profiles delete ssh-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the ssh profile to be deleted\. You can also load this
      profile by using the name on commands that support the "\-\-ssh\-profile"
      option\.

#### Options

*   `--force`  *(boolean)*

	* Force deletion of profile, and dependent profiles if specified\. No prompt will
      be displayed before deletion occurs\.

#### Examples

*  Delete a ssh profile named profilename:

      * `$  zowe profiles delete ssh-profile profilename`

## list | ls<a name="profiles-list"></a>
List profiles of the type 
### zosmf-profiles<a name="profiles-list-zosmf-profiles"></a>
z/OSMF Profile

#### Usage

   zowe profiles list zosmf-profiles [options]

#### Options

*   `--show-contents`  | `--sc` *(boolean)*

	* List zosmf profiles and their contents\. All profile details will be printed as
      part of command output\.

#### Examples

*  List profiles of type zosmf:

      * `$  zowe profiles list zosmf-profiles`

*  List profiles of type zosmf and display their contents:

      * `$  zowe profiles list zosmf-profiles --sc`

### tso-profiles<a name="profiles-list-tso-profiles"></a>
z/OS TSO/E User Profile

#### Usage

   zowe profiles list tso-profiles [options]

#### Options

*   `--show-contents`  | `--sc` *(boolean)*

	* List tso profiles and their contents\. All profile details will be printed as
      part of command output\.

#### Examples

*  List profiles of type tso:

      * `$  zowe profiles list tso-profiles`

*  List profiles of type tso and display their contents:

      * `$  zowe profiles list tso-profiles --sc`

### ssh-profiles<a name="profiles-list-ssh-profiles"></a>
z/OS SSH Profile

#### Usage

   zowe profiles list ssh-profiles [options]

#### Options

*   `--show-contents`  | `--sc` *(boolean)*

	* List ssh profiles and their contents\. All profile details will be printed as
      part of command output\.

#### Examples

*  List profiles of type ssh:

      * `$  zowe profiles list ssh-profiles`

*  List profiles of type ssh and display their contents:

      * `$  zowe profiles list ssh-profiles --sc`

## set-default | set<a name="profiles-set-default"></a>
Set which profiles are loaded by default.
### zosmf-profile<a name="profiles-set-default-zosmf-profile"></a>
The zosmf set default\-profiles command allows you to set the default profiles
for this command group\. When a zosmf command is issued and no profile override
options are specified, the default profiles for the command group are
automatically loaded for the command based on the commands profile
requirements\.

#### Usage

   zowe profiles set-default zosmf-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specify a
      profile for default usage within the zosmf group\. When you issue commands
      within the zosmf group without a profile specified as part of the command, the
      default will be loaded instead\.

#### Examples

*  Set the default profile for type zosmf to the profile named
'profilename':

      * `$  zowe profiles set-default zosmf-profile profilename`

### tso-profile<a name="profiles-set-default-tso-profile"></a>
The tso set default\-profiles command allows you to set the default profiles for
this command group\. When a tso command is issued and no profile override
options are specified, the default profiles for the command group are
automatically loaded for the command based on the commands profile
requirements\.

#### Usage

   zowe profiles set-default tso-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specify a
      profile for default usage within the tso group\. When you issue commands within
      the tso group without a profile specified as part of the command, the default
      will be loaded instead\.

#### Examples

*  Set the default profile for type tso to the profile named
'profilename':

      * `$  zowe profiles set-default tso-profile profilename`

### ssh-profile<a name="profiles-set-default-ssh-profile"></a>
The ssh set default\-profiles command allows you to set the default profiles for
this command group\. When a ssh command is issued and no profile override
options are specified, the default profiles for the command group are
automatically loaded for the command based on the commands profile
requirements\.

#### Usage

   zowe profiles set-default ssh-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specify a
      profile for default usage within the ssh group\. When you issue commands within
      the ssh group without a profile specified as part of the command, the default
      will be loaded instead\.

#### Examples

*  Set the default profile for type ssh to the profile named
'profilename':

      * `$  zowe profiles set-default ssh-profile profilename`

# provisioning | pv<a name="provisioning"></a>
Perform z/OSMF provisioning tasks on Published Templates in the Service Catalog and Provisioned Instances in the Service Registry.
## list | ls<a name="provisioning-list"></a>
Lists z/OSMF provisioning information such as the provisioned instances from the registry, the provisioned instance details, the available provisioning templates and provisioning template details.
### template-info<a name="provisioning-list-template-info"></a>
List details about a template published with z/OSMF Cloud Provisioning\.

#### Usage

   zowe provisioning list template-info <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* The name of a z/OSMF cloud provisioning template\.

#### Options

*   `--all-info`  | `--ai` *(boolean)*

	* Display detailed information about published z/OSMF service catalog template
      (summary information is printed by default)\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  List summary information for template "template1":

      * `$  zowe provisioning list template-info template1`

### catalog-templates<a name="provisioning-list-catalog-templates"></a>
Lists the z/OSMF service catalog published templates\.

#### Usage

   zowe provisioning list catalog-templates [options]

#### Options

*   `--all-info`  | `--ai` *(boolean)*

	* Display information about published z/OSMF service catalog templates (summary
      information is printed by default)\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  List all published templates in the z/OSMF service catalog
(with full detail):

      * `$  zowe provisioning list catalog-templates --all-info`

### instance-info<a name="provisioning-list-instance-info"></a>
List details about an instance provisioned with z/OSMF\.

#### Usage

   zowe provisioning list instance-info <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* Provisioned Instance Name

#### Options

*   `--display`  *(string)*

	* Level of information to display for the provisioned instance\. Possible values:

      summary 	\- summary information, no actions or variables
      actions 	\- (default) summary with actions, no variables
      vars 	\- summary information with variables, no actions
      extended 	\- extended information with actions
      full 	\- all available information


      Allowed values: extended, summary, vars, actions, full

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  List summary information with a list of actions for an
instance with the name "instance1":

      * `$  zowe provisioning list instance-info instance1`

*  Show extended general information with actions for a
provisioned instance with the name "instance1":

      * `$  zowe provisioning list instance-info instance1 --display extended`

### instance-variables<a name="provisioning-list-instance-variables"></a>
List a set of variables and their values for a given name\.

#### Usage

   zowe provisioning list instance-variables <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* Provisioned Instance Name

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  List instance variables of "instance1":

      * `$  zowe provisioning list instance-variables instance1`

### registry-instances<a name="provisioning-list-registry-instances"></a>
List the provisioned instances from the z/OSMF software registry\.

#### Usage

   zowe provisioning list registry-instances [options]

#### Options

*   `--all-info`  | `--ai` *(boolean)*

	* Display all available information about provisioned instances (summary by
      default)\.

*   `--filter-by-type`  | `--fbt` *(string)*

	* Filter the list of provisioned instances by type (e\.g\. DB2 or CICS)\.

*   `--filter-by-external-name`  | `--fben` *(string)*

	* Filter the list of provisioned instances by External Name\.

*   `--types`  | `-t` *(boolean)*

	* Display a list of all types for provisioned instances (e\.g\. DB2 or CICS)\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  List all provisioned instances (with full detail):

      * `$  zowe provisioning list registry-instances --all-info`

## provision | prov<a name="provisioning-provision"></a>
Using z/OSMF cloud provisioning services provision available templates.
### template<a name="provisioning-provision-template"></a>
Using z/OSMF cloud provisioning services, provision available templates\.
You can view available templates using the zowe provisioning list
catalog\-templates command\.

#### Usage

   zowe provisioning provision template <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* The name of a z/OSMF cloud provisioning template\.

#### Options

*   `--properties`  | `-p` *(string)*

	* A sequence of string enclosed "name=value" pairs of prompt variables\.
      e\.g: "CSQ\_MQ\_SSID=ZCT1,CSQ\_CMD\_PFX=\!ZCT1"\.

*   `--properties-file`  | `--pf` *(string)*

	* Path to \.yml file containing properties\.

*   `--domain-name`  | `--dn` *(string)*

	* Required if the user has consumer authorization to more than one domain with
      this template name\.

*   `--tenant-name`  | `--tn` *(string)*

	* Required if the user has consumer authorization to more than one tenant in the
      same domain that contains this template name\.

*   `--user-data-id`  | `--udi` *(string)*

	* ID for the user data specified with user\-data\. Passed into the software
      services registry\.

*   `--user-data`  | `--ud` *(string)*

	* User data that is passed into the software services registry\. Can be specified
      only if user\-data\-id is provided\.

*   `--account-info`  | `--ai` *(string)*

	* Account information to use in the JCL JOB statement\. The default is the account
      information that is associated with the resource pool for the tenant\.

*   `--system-nick-names`  | `--snn` *(string)*

	* Each string is the nickname of the system upon which to provision the software
      service defined by the template\. The field is required if the resource pool
      associated with the tenant used for this operation is not set up to
      automatically select a system\. Only one nickname is allowed\.If the field is
      provided it is validated\.
      e\.g: "SYSNAME1,SYSNAME2"\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Provision a published software service template.:

      * `$  zowe provisioning provision template template1`

## perform | perf<a name="provisioning-perform"></a>
Perform actions against instances provisioned with z/OSMF.
### action<a name="provisioning-perform-action"></a>
Perform actions on instances previously provisioned with z/OSMF cloud
provisioning services\. To view the list of provisioned instances, use the
"zowe provisioning list registry\-instances" command\. Once you have
obtained an instance name you can use the "zowe provisioning list
instance\-info <name>" command to view the available instance actions\.

#### Usage

   zowe provisioning perform action <name> <actionname> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* Provisioned Instance name\.

*   `actionname`		 *(string)*

	* The action name\. Use the "zowe provisioning list instance\-info <name>"
      command to view available instance actions\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Perform the "start" action on the provisioned instance
"instance1":

      * `$  zowe provisioning perform action instance1 start`

## delete | del<a name="provisioning-delete"></a>
Deletes instance previously provisioned with z/OSMF cloud provisioning services.
### instance<a name="provisioning-delete-instance"></a>
Deletes selected deprovisioned instance\.

#### Usage

   zowe provisioning delete instance <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* Deprovisioned Instance name\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Delete deprovisioned instance "instance1":

      * `$  zowe provisioning delete instance instance1`

# zos-console | console<a name="zos-console"></a>
Interact with z/OSMF console services. Issue z/OS console commands and collect responses. z/OS console services establishes extended MCS (EMCS) consoles on behalf of the user, which are used to issue the commands and collect responses.

Important! Before you use commands in the zos-console command group, ensure that you understand the implications of issuing z/OS console commands in your environment.
## collect<a name="zos-console-collect"></a>
z/OSMF console services provides a command response key upon successful issue of a console command. You can use this key to collect additional console message responses.
### sync-responses<a name="zos-console-collect-sync-responses"></a>
The z/OSMF console REST APIs return a "solicited response key" after
successfully issuing a synchronous console command that produces solicited
responses\. You can use the "solicited response key"on the "sync\-responses"
command to collect any additional outstanding solicited responses from the
console the command was issued\.

In general, when issuing a z/OS console command, z/OS applications route
responses to the originating console\. The command response messages are
referred to as "solicited command responses" (i\.e\. direct responses to the
command issued)\. When issuing a z/OS console command using Zowe CLI, collection
of all solicited command responses is attempted by default\. However, there is
no z/OS mechanism that indicates the total number of response messages that may
be produced from a given command\. Therefore, the Zowe CLI console APIs return a
"solicited response key" that can be used to "follow\-up" and collect any
additional solicited command responses\.

#### Usage

   zowe zos-console collect sync-responses <responsekey> [options]

#### Positional Arguments

*   `responsekey`		 *(string)*

	* The "solicited response key" provided in response to a previously issued console
      command\. Used by the z/OSMF console API to collect any additional outstanding
      solicited responses from a previously issued console command\. Must match
      regular expression: `^\[a\-zA\-Z0\-9\]\+$`

#### Options

*   `--console-name`  | `--cn` | `-c` *(string)*

	* The name of the z/OS extended MCS console to direct the command\. You must have
      the required authority to access the console specified\. You may also specify an
      arbitrary name, if your installation allows dynamic creation of consoles with
      arbitrary names\.

      Allowed values: ^\[a\-zA\-Z0\-9\]\+$

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Collect any outstanding additional solicited response
messages:

      * `$  zowe zos-console collect sync-responses C4866969`

## issue<a name="zos-console-issue"></a>
Issue z/OS console commands and optionally collect responses.
### command<a name="zos-console-issue-command"></a>
Issue a z/OS console command and print command responses (known as "solicited
command responses")\.

In general, when issuing a z/OS console command, z/OS applications route
responses to the originating console\. The command response messages are
referred to as "solicited command responses" (i\.e\. direct responses to the
command issued)\. When issuing a z/OS console command using Zowe CLI, collection
of all solicited command responses is attempted by default\. However, there is
no z/OS mechanism that indicates the total number of response messages that may
be produced from a given command\. Therefore, the Zowe CLI console APIs return a
"solicited response key" that can be used to "follow\-up" and collect any
additional solicited command responses\.

Zowe CLI will issue "follow\-up" API requests by default to collect any
additional outstanding solicited command responses until a request returns no
additional responses\. At that time, Zowe CLI will attempt a final collection
attempt\. If no messages are present, the command is complete\. If additional
messages are present, the process is repeated\. However, this does not guarantee
that all messages produced in direct response (i\.e\. solicited) have been
collected\. The z/OS application may produce additional messages in direct
response to your command at some point in the future\. You can manually collect
additional responses using the "command response key" OR specify additional
processing options to, for example, delay collection attempts by a specified
interval\.

#### Usage

   zowe zos-console issue command <commandtext> [options]

#### Positional Arguments

*   `commandtext`		 *(string)*

	* The z/OS console command to issue.

#### Options

*   `--console-name`  | `--cn` | `-c` *(string)*

	* The name of the z/OS extended MCS console to direct the command\. You must have
      the required authority to access the console specified\. You may also specify an
      arbitrary name, if your installation allows dynamic creation of consoles with
      arbitrary names\.

      Allowed values: ^\[a\-zA\-Z0\-9\]\+$

*   `--include-details`  | `--id` | `-i` *(boolean)*

	* Include additional details at the end of the Zowe CLI command response, such as
      the "command response key" and the z/OSMF command response URL\.

*   `--key-only`  | `--ko` | `-k` *(boolean)*

	* Displays only the "command response key" returned from the z/OSMF console API\.
      You can collect additional messages using the command key with 'zowe
      zos\-console collect sync\-responses <key>'\. Note that when using this option,
      you will not be presented with the "first set" of command response messages (if
      present in the API response)\. However, you can view them by using the
      \-\-response\-format\-json option\.

*   `--return-first`  | `--rf` | `-r` *(boolean)*

	* Indicates that Zowe CLI should return immediately with the response message set
      returned in the first z/OSMF API request (even if no responses are present)\.
      Using this option may result in partial or no response, but quicker Zowe CLI
      command response time\. The z/OSMF console API has an implicit wait when
      collecting the first set of console command responses, i\.e you will normally
      receive at least one set of response messages\.

*   `--solicited-keyword`  | `--sk` | `-s` *(string)*

	* For solicited responses (direct command responses) the response is considered
      complete if the keyword specified is present\. If the keyword is detected, the
      command will immediately return, meaning the full command response may not be
      provided\. The key only applies to the first request issued, follow up requests
      do not support searching for the keyword\.

*   `--sysplex-system`  | `--ss` | `--sys` *(string)*

	* Specifies the z/OS system (LPAR) in the current SYSPLEX (where your target
      z/OSMF resides) to route the z/OS console command\.

*   `--wait-to-collect`  | `--wtc` | `-w` *(number)*

	* Indicates that Zowe CLI wait at least the specified number of seconds before
      attempting to collect additional solicited response messages\. If additional
      messages are collected on "follow\-up" requests, the timer is reset until an
      attempt is made that results in no additional response messages\.

*   `--follow-up-attempts`  | `--fua` | `-a` *(number)*

	* Number of request attempts if no response returned.

      Default value: 1

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Issue a z/OS console command to display the IPL information
for the system:

      * `$  zowe zos-console issue command "D IPLINFO"`

*  Issue a z/OS console command to display the local and
coordinated universal time and date:

      * `$  zowe zos-console issue command "D T"`

*  Issue a Db2 command to display information about the status
and configuration of DDF:

      * `$  zowe zos-console issue command "\-DB1G DISPLAY DDF"`

# zos-files | files<a name="zos-files"></a>
Manage z/OS data sets, create data sets, and more
## create | cre<a name="zos-files-create"></a>
Create data sets
### data-set-sequential<a name="zos-files-create-data-set-sequential"></a>
Create physical sequential data sets (PS)

#### Usage

   zowe zos-files create data-set-sequential <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set that you want to create

#### Options

*   `--block-size`  | `--bs` *(number)*

	* The block size for the data set (for example, 6160)

      Default value: 6160

*   `--data-class`  | `--dc` *(string)*

	* The SMS data class to use for the allocation

*   `--device-type`  | `--dt` *(string)*

	* The device type, also known as 'unit'

*   `--directory-blocks`  | `--db` *(number)*

	* The number of directory blocks (for example, 25)

*   `--management-class`  | `--mc` *(string)*

	* The SMS management class to use for the allocation

*   `--record-format`  | `--rf` *(string)*

	* The record format for the data set (for example, FB for "Fixed Block")

      Default value: FB

*   `--record-length`  | `--rl` *(number)*

	* The logical record length\. Analogous to the length of a line (for example, 80)

      Default value: 80

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

      Default value: 1

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK \- where n is the number of
      cylinders or tracks)\. Sets the primary allocation (the secondary allocation
      becomes ~10% of the primary)\.

      Default value: 1CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed\. A
      VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Create an empty physical sequential data set with default
parameters:

      * `$  zowe zos-files create data-set-sequential NEW.PS.DATASET`

### data-set-partitioned<a name="zos-files-create-data-set-partitioned"></a>
Create partitioned data sets (PDS)

#### Usage

   zowe zos-files create data-set-partitioned <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set that you want to create

#### Options

*   `--block-size`  | `--bs` *(number)*

	* The block size for the data set (for example, 6160)

      Default value: 6160

*   `--data-class`  | `--dc` *(string)*

	* The SMS data class to use for the allocation

*   `--data-set-type`  | `--dst` *(string)*

	* The data set type (for example, type LIBRARY for "PDSE")

*   `--device-type`  | `--dt` *(string)*

	* The device type, also known as 'unit'

*   `--directory-blocks`  | `--db` *(number)*

	* The number of directory blocks (for example, 25)

      Default value: 5

*   `--management-class`  | `--mc` *(string)*

	* The SMS management class to use for the allocation

*   `--record-format`  | `--rf` *(string)*

	* The record format for the data set (for example, FB for "Fixed Block")

      Default value: FB

*   `--record-length`  | `--rl` *(number)*

	* The logical record length\. Analogous to the length of a line (for example, 80)

      Default value: 80

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

      Default value: 1

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK \- where n is the number of
      cylinders or tracks)\. Sets the primary allocation (the secondary allocation
      becomes ~10% of the primary)\.

      Default value: 1CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed\. A
      VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Create an empty PDS with default parameters:

      * `$  zowe zos-files create data-set-partitioned NEW.PDS.DATASET`

*  Create an empty PDSE with data set type LIBRARY:

      * `$  zowe zos-files create data-set-partitioned NEW.PDSE.DATASET --data-set-type LIBRARY`

### data-set-binary<a name="zos-files-create-data-set-binary"></a>
Create executable data sets

#### Usage

   zowe zos-files create data-set-binary <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set that you want to create

#### Options

*   `--block-size`  | `--bs` *(number)*

	* The block size for the data set (for example, 6160)

      Default value: 27998

*   `--data-class`  | `--dc` *(string)*

	* The SMS data class to use for the allocation

*   `--data-set-type`  | `--dst` *(string)*

	* The data set type

*   `--device-type`  | `--dt` *(string)*

	* The device type, also known as 'unit'

*   `--directory-blocks`  | `--db` *(number)*

	* The number of directory blocks (for example, 25)

      Default value: 25

*   `--management-class`  | `--mc` *(string)*

	* The SMS management class to use for the allocation

*   `--record-format`  | `--rf` *(string)*

	* The record format for the data set (for example, FB for "Fixed Block")

      Default value: U

*   `--record-length`  | `--rl` *(number)*

	* The logical record length\. Analogous to the length of a line (for example, 80)

      Default value: 27998

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

      Default value: 10

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK \- where n is the number of
      cylinders or tracks)\. Sets the primary allocation (the secondary allocation
      becomes ~10% of the primary)\.

      Default value: 10CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed\. A
      VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Create an empty binary partitioned data set (PDS) with
default parameters:

      * `$  zowe zos-files create data-set-binary NEW.BINARY.DATASET`

### data-set-c<a name="zos-files-create-data-set-c"></a>
Create data sets for C code programming

#### Usage

   zowe zos-files create data-set-c <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set that you want to create

#### Options

*   `--block-size`  | `--bs` *(number)*

	* The block size for the data set (for example, 6160)

      Default value: 32760

*   `--data-class`  | `--dc` *(string)*

	* The SMS data class to use for the allocation

*   `--data-set-type`  | `--dst` *(string)*

	* The data set type

*   `--device-type`  | `--dt` *(string)*

	* The device type, also known as 'unit'

*   `--directory-blocks`  | `--db` *(number)*

	* The number of directory blocks (for example, 25)

      Default value: 25

*   `--management-class`  | `--mc` *(string)*

	* The SMS management class to use for the allocation

*   `--record-format`  | `--rf` *(string)*

	* The record format for the data set (for example, FB for "Fixed Block")

      Default value: VB

*   `--record-length`  | `--rl` *(number)*

	* The logical record length\. Analogous to the length of a line (for example, 80)

      Default value: 260

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

      Default value: 1

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK \- where n is the number of
      cylinders or tracks)\. Sets the primary allocation (the secondary allocation
      becomes ~10% of the primary)\.

      Default value: 1CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed\. A
      VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Create an empty C code PDS with default parameters:

      * `$  zowe zos-files create data-set-c NEW.CCODE.DATASET`

### data-set-classic<a name="zos-files-create-data-set-classic"></a>
Create classic data sets (JCL, HLASM, CBL, etc\.\.\.)

#### Usage

   zowe zos-files create data-set-classic <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set that you want to create

#### Options

*   `--block-size`  | `--bs` *(number)*

	* The block size for the data set (for example, 6160)

      Default value: 6160

*   `--data-class`  | `--dc` *(string)*

	* The SMS data class to use for the allocation

*   `--data-set-type`  | `--dst` *(string)*

	* The data set type

*   `--device-type`  | `--dt` *(string)*

	* The device type, also known as 'unit'

*   `--directory-blocks`  | `--db` *(number)*

	* The number of directory blocks (for example, 25)

      Default value: 25

*   `--management-class`  | `--mc` *(string)*

	* The SMS management class to use for the allocation

*   `--record-format`  | `--rf` *(string)*

	* The record format for the data set (for example, FB for "Fixed Block")

      Default value: FB

*   `--record-length`  | `--rl` *(number)*

	* The logical record length\. Analogous to the length of a line (for example, 80)

      Default value: 80

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

      Default value: 1

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK \- where n is the number of
      cylinders or tracks)\. Sets the primary allocation (the secondary allocation
      becomes ~10% of the primary)\.

      Default value: 1CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed\. A
      VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Create an empty z/OS 'classic' PDS with default parameters:

      * `$  zowe zos-files create data-set-classic NEW.CLASSIC.DATASET`

### data-set-vsam<a name="zos-files-create-data-set-vsam"></a>
Create a VSAM cluster

#### Usage

   zowe zos-files create data-set-vsam <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the dataset in which to create a VSAM cluster

#### Options

*   `--data-class`  | `--dc` *(string)*

	* The SMS data class to use for the allocation

*   `--data-set-organization`  | `--dso` *(string)*

	* The data set organization\.

      Default value: INDEXED
      Allowed values: INDEXED, IXD, LINEAR, LIN, NONINDEXED, NIXD, NUMBERED, NUMD, ZFS

*   `--management-class`  | `--mc` *(string)*

	* The SMS management class to use for the allocation

*   `--retain-for`  | `--rf` *(number)*

	* The number of days that the VSAM cluster will be retained on the system\. You
      can delete the cluster at any time when neither retain\-for nor retain\-to is
      specified\.

*   `--retain-to`  | `--rt` *(string)*

	* The earliest date that a command without the PURGE parameter can delete an
      entry\. Specify the expiration date in the form yyyyddd, where yyyy is a
      four\-digit year (maximum value: 2155) and ddd is the three\-digit day of the
      year from 001 through 365 (for non\-leap years) or 366 (for leap years)\. You
      can delete the cluster at any time when neither retain\-for nor retain\-to is
      used\. You cannot specify both the 'retain\-to' and 'retain\-for' options\.

*   `--secondary-space`  | `--ss` *(number)*

	* The number of items for the secondary space allocation (for example, 840)\. The
      type of item allocated is the same as the type used for the '\-\-size' option\.
      If you do not specify a secondary allocation, a value of ~10% of the primary
      allocation is used\.

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The primary size to allocate for the VSAM cluster\. Specify size as the number
      of items to allocate (nItems)\. You specify the type of item by keyword\.

      Default value: 840KB

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volumes`  | `-v` *(string)*

	* The storage volumes on which to allocate a VSAM cluster\. Specify a single
      volume by its volume serial (VOLSER)\. To specify more than one volume, enclose
      the option in double\-quotes and separate each VOLSER with a space\. You must
      specify the volumes option when your cluster is not SMS\-managed\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Create a VSAM data set named "SOME.DATA.SET.NAME" using
default values of INDEXED, 840 KB primary storage and 84 KB secondary storage:

      * `$  zowe zos-files create data-set-vsam SOME.DATA.SET.NAME`

*  Create a 5 MB LINEAR VSAM data set named
"SOME.DATA.SET.NAME" with 1 MB of secondary space. Show the properties of the
data set when it is created:

      * `$  zowe zos-files create data-set-vsam SOME.DATA.SET.NAME --data-set-organization LINEAR --size 5MB --secondary-space 1 --show-attributes`

*  Create a VSAM data set named "SOME.DATA.SET.NAME", which is
retained for 100 days:

      * `$  zowe zos-files create data-set-vsam SOME.DATA.SET.NAME --retain-for 100 `

### zos-file-system<a name="zos-files-create-zos-file-system"></a>
Create a z/OS file system\.

#### Usage

   zowe zos-files create zos-file-system <fileSystemName> [options]

#### Positional Arguments

*   `fileSystemName`		 *(string)*

	* The name of the file system to create\.

#### Options

*   `--cyls-pri`  | `--cp` *(number)*

	* The number of primary cylinders to allocate for the ZFS\.

      Default value: 10

*   `--cyls-sec`  | `--cs` *(number)*

	* The number of secondary cylinders to allocate for the ZFS\.

      Default value: 2

*   `--data-class`  | `--dc` *(string)*

	* The SMS data class to use for the allocation

*   `--group`  | `-g` *(string)*

	* The z/OS group ID or GID for the group of the ZFS root directory\.

*   `--management-class`  | `--mc` *(string)*

	* The SMS management class to use for the allocation

*   `--owner`  | `-o` *(string)*

	* The z/OS user ID or UID for the owner of the ZFS root directory\.

*   `--perms`  | `-p` *(number)*

	* The permissions code for the ZFS root directory\.

      Default value: 755

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--timeout`  | `-t` *(number)*

	* The number of seconds to wait for the underlying "zfsadm format" command to
      complete\. If this command times out, the ZFS may have been created but not
      formatted correctly\.

      Default value: 20

*   `--volumes`  | `-v` *(array)*

	* The storage volumes on which to allocate the z/OS file system\. Specify a single
      volume by its volume serial (VOLSER)\. To specify more than one volume, separate
      each VOLSER with a space\. You must specify the volumes option when your cluster
      is not SMS\-managed\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Create a ZFS named "HLQ.MYNEW.ZFS" using default values of
755 permissions, 10 primary and 2 secondary cylinders allocated, and a timeout
of 20 seconds:

      * `$  zowe zos-files create zos-file-system HLQ.MYNEW.ZFS`

*  Create a ZFS with 100 primary and 10 secondary cylinders
allocated:

      * `$  zowe zos-files create zos-file-system HLQ.MYNEW.ZFS --cp 100 --cs 10`

*  Create a ZFS specifying the volumes that should be used:

      * `$  zowe zos-files create zos-file-system HLQ.MYNEW.ZFS -v ZFS001 ZFS002`

### uss-file<a name="zos-files-create-uss-file"></a>
Create a UNIX file\.

#### Usage

   zowe zos-files create uss-file <ussPath> [options]

#### Positional Arguments

*   `ussPath`		 *(string)*

	* The name of the file that you want to create\.

#### Options

*   `--mode`  | `-m` *(string)*

	* Specifies the file permission bits to use when creating the file\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Create a USS file named "test.ext" :

      * `$  zowe zos-files create uss-file text.txt`

*  Create a USS file named "text.txt" with mode "rwxrwxrwx" :

      * `$  zowe zos-files create uss-file text.txt -m rwxrwxrwx`

### uss-directory<a name="zos-files-create-uss-directory"></a>
Create a UNIX directory\.

#### Usage

   zowe zos-files create uss-directory <ussPath> [options]

#### Positional Arguments

*   `ussPath`		 *(string)*

	* The name of the directory that you want to create\.

#### Options

*   `--mode`  | `-m` *(string)*

	* Specifies the file permission bits to use when creating the directory\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Create a USS directory named "testDir" :

      * `$  zowe zos-files create uss-directory testDir`

*  Create a USS directory named "testDir" with mode "rwxrwxrwx"
:

      * `$  zowe zos-files create uss-directory testDir -m rwxrwxrwx`

## delete | del<a name="zos-files-delete"></a>
Delete a data set or Unix System Services file
### data-set<a name="zos-files-delete-data-set"></a>
Delete a data set permanently

#### Usage

   zowe zos-files delete data-set <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set that you want to delete

#### Required Options

*   `--for-sure`  | `-f` *(boolean)*

	* Specify this option to confirm that you want to delete the data set
      permanently\.

#### Options

*   `--volume`  | `--vol` *(string)*

	* The volume serial (VOLSER) where the data set resides\. The option is required
      only when the data set is not catalogued on the system\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Delete the data set named 'ibmuser.cntl':

      * `$  zowe zos-files delete data-set "ibmuser.cntl" -f`

### data-set-vsam<a name="zos-files-delete-data-set-vsam"></a>
Delete a VSAM cluster permanently

#### Usage

   zowe zos-files delete data-set-vsam <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the VSAM cluster that you want to delete

#### Options

*   `--erase`  | `-e` *(boolean)*

	* Specify this option to overwrite the data component for the cluster with binary
      zeros\. This option is ignored if the NOERASE attribute was specified when the
      cluster was defined or altered\.

*   `--purge`  | `-p` *(boolean)*

	* Specify this option to delete the VSAM cluster regardless of its retention
      period or date\.

#### Required Options

*   `--for-sure`  | `-f` *(boolean)*

	* Specify this option to confirm that you want to delete the VSAM cluster
      permanently\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Delete the VSAM data set named 'ibmuser.cntl.vsam':

      * `$  zowe zos-files delete data-set-vsam "ibmuser.cntl.vsam" -f`

*  Delete all expired VSAM data sets that match
'ibmuser.AAA.**.FFF':

      * `$  zowe zos-files delete data-set-vsam "ibmuser.AAA.**.FFF" -f`

*  Delete a non-expired VSAM data set named
'ibmuser.cntl.vsam':

      * `$  zowe zos-files delete data-set-vsam "ibmuser.cntl.vsam" -f --purge`

*  Delete an expired VSAM data set named 'ibmuser.cntl.vsam' by
overwriting the components with zeros:

      * `$  zowe zos-files delete data-set-vsam "ibmuser.cntl.vsam" -f --erase`

### uss-file<a name="zos-files-delete-uss-file"></a>
Delete a Unix Systems Services (USS) File or directory permanently

#### Usage

   zowe zos-files delete uss-file <fileName> [options]

#### Positional Arguments

*   `fileName`		 *(string)*

	* The name of the file or directory that you want to delete

#### Required Options

*   `--for-sure`  | `-f` *(boolean)*

	* Specify this option to confirm that you want to delete the file or directory
      permanently\.

#### Options

*   `--recursive`  | `-r` *(boolean)*

	* Delete directories recursively\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Delete the empty directory '/u/ibmuser/testcases':

      * `$  zowe zos-files delete uss-file "/a/ibmuser/testcases" -f`

*  Delete the file named '/a/ibmuser/my_text.txt':

      * `$  zowe zos-files delete uss-file "/a/ibmuser/testcases/my_text.txt" -f`

*  Recursively delete the directory named
'/u/ibmuser/testcases':

      * `$  zowe zos-files delete uss-file "/a/ibmuser/testcases" -rf`

### zos-file-system<a name="zos-files-delete-zos-file-system"></a>
Delete a z/OS file system permanently\.

#### Usage

   zowe zos-files delete zos-file-system <fileSystemName> [options]

#### Positional Arguments

*   `fileSystemName`		 *(string)*

	* The name of the z/OS file system that you want to delete\.

#### Required Options

*   `--for-sure`  | `-f` *(boolean)*

	* Specify this option to confirm that you want to delete the ZFS permanently\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Delete the z/OS file system 'HLQ.MYNEW.ZFS':

      * `$  zowe zos-files delete zos-file-system "HLQ.MYNEW.ZFS" -f`

## invoke | call<a name="zos-files-invoke"></a>
Invoke z/OS utilities such as Access Method Services (AMS)
### ams-statements<a name="zos-files-invoke-ams-statements"></a>
Submit control statements for execution by Access Method Services (IDCAMS)\. You
can use IDCAMS to create VSAM data sets (CSI, ZFS, etc\.\.\.), delete data sets,
and more\. You must format the control statements exactly as the IDCAMS utility
expects\. For more information about control statements, see the IBM publication
'z/OS DFSMS Access Method Services Commands'\.

#### Usage

   zowe zos-files invoke ams-statements <controlStatements> [options]

#### Positional Arguments

*   `controlStatements`		 *(string)*

	* The IDCAMS control statement that you want to submit\. Zowe CLI attempts to
      split the inline control statement at 255 characters\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Defines a cluster named 'DUMMY.VSAM.CLUSTER':

      * `$  zowe zos-files invoke ams-statements "DEFINE CLUSTER ( NAME (DUMMY.VSAM.CLUSTER) CYL(1 1))"`

*  Deletes a cluster named 'DUMMY.VSAM.CLUSTER':

      * `$  zowe zos-files invoke ams-statements "DELETE DUMMY.VSAM.CLUSTER CLUSTER"`

### ams-file<a name="zos-files-invoke-ams-file"></a>
Submit control statements for execution by Access Method Services (IDCAMS)\. You
can use IDCAMS to create VSAM data sets (CSI, ZFS, etc\.\.\.), delete data sets,
and more\. You must format the control statements exactly as the IDCAMS utility
expects\. For more information about control statements, see the IBM publication
'z/OS DFSMS Access Method Services Commands'\.

#### Usage

   zowe zos-files invoke ams-file <controlStatementsFile> [options]

#### Positional Arguments

*   `controlStatementsFile`		 *(string)*

	* The path to a file that contains IDCAMS control statements\. Ensure that your
      file does not contain statements that are longer than 255 characters (maximum
      allowed length)\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Reads the specified file and submits the controls
statements:

      * `$  zowe zos-files invoke ams-file "./path/to/file/MyControlStatements.idcams"`

## download | dl<a name="zos-files-download"></a>
Download content from z/OS data sets and USS files to your PC
### data-set<a name="zos-files-download-data-set"></a>
Download content from a z/OS data set to a local file

#### Usage

   zowe zos-files download data-set <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set that you want to download

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Download the file content in binary mode, which means that no data conversion is
      performed\. The data transfer process returns each line as\-is, without
      translation\. No delimiters are added between records\.

*   `--extension`  | `-e` *(string)*

	* Save the local files with a specified file extension\. For example, \.txt\. Or
      "" for no extension\. When no extension is specified, \.txt is used as the
      default file extension\.

*   `--file`  | `-f` *(string)*

	* The path to the local file where you want to download the content\. When you
      omit the option, the command generates a file name automatically for you\.

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides\. You can use this option
      at any time\. However, the VOLSER is required only when the data set is not
      cataloged on the system\. A VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Download the data set "ibmuser.loadlib(main)" in binary mode
to the local file "main.obj":

      * `$  zowe zos-files download data-set "ibmuser.loadlib(main)" -b -f main.obj`

### all-members<a name="zos-files-download-all-members"></a>
Download all members from a partitioned data set to a local folder

#### Usage

   zowe zos-files download all-members <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set from which you want to download members

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Download the file content in binary mode, which means that no data conversion is
      performed\. The data transfer process returns each line as\-is, without
      translation\. No delimiters are added between records\.

*   `--directory`  | `-d` *(string)*

	* The directory to where you want to save the members\. The command creates the
      directory for you when it does not already exist\. By default, the command
      creates a folder structure based on the data set qualifiers\. For example, the
      data set ibmuser\.new\.cntl's members are downloaded to ibmuser/new/cntl)\.

*   `--extension`  | `-e` *(string)*

	* Save the local files with a specified file extension\. For example, \.txt\. Or
      "" for no extension\. When no extension is specified, \.txt is used as the
      default file extension\.

*   `--max-concurrent-requests`  | `--mcr` *(number)*

	* Specifies the maximum number of concurrent z/OSMF REST API requests to download
      members\. Increasing the value results in faster downloads\. However, increasing
      the value increases resource consumption on z/OS and can be prone to errors
      caused by making too many concurrent requests\. If the download process
      encounters an error, the following message displays:
      The maximum number of TSO address spaces have been created\. When you specify 0,
      Zowe CLI attempts to download all members at once without a maximum number of
      concurrent requests\.

      Default value: 1

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides\. You can use this option
      at any time\. However, the VOLSER is required only when the data set is not
      cataloged on the system\. A VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Download the members of the data set "ibmuser.loadlib" in
binary mode to the directory "loadlib/":

      * `$  zowe zos-files download all-members "ibmuser.loadlib" -b -d loadlib`

*  Download the members of the data set "ibmuser.cntl" in text
mode to the directory "jcl/":

      * `$  zowe zos-files download all-members "ibmuser.cntl" -d jcl`

### uss-file<a name="zos-files-download-uss-file"></a>
Download content from a USS file to a local file on your PC

#### Usage

   zowe zos-files download uss-file <ussFileName> [options]

#### Positional Arguments

*   `ussFileName`		 *(string)*

	* The name of the USS file you want to download

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Download the file content in binary mode, which means that no data conversion is
      performed\. The data transfer process returns each line as\-is, without
      translation\. No delimiters are added between records\.

*   `--file`  | `-f` *(string)*

	* The path to the local file where you want to download the content\. When you
      omit the option, the command generates a file name automatically for you\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Download the file "/a/ibmuser/my_text.txt" to ./my_text.txt:

      * `$  zowe zos-files download uss-file "/a/ibmuser/my_text.txt" -f ./my_text.txt`

*  Download the file "/a/ibmuser/MyJava.class" to
"java/MyJava.class" in binary mode:

      * `$  zowe zos-files download uss-file "/a/ibmuser/MyJava.class" -b -f "java/MyJava.class"`

## list | ls<a name="zos-files-list"></a>
List data sets and data set members. Optionally, you can list their details and attributes.
### all-members<a name="zos-files-list-all-members"></a>
List all members of a partitioned data set\. To view additional information
about each member, use the \-\-attributes option under the Options section of
this help text\.

#### Usage

   zowe zos-files list all-members <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set for which you want to list the members

#### Options

*   `--attributes`  | `-a` *(boolean)*

	* Display more information about each member\. Data sets with an undefined record
      format display information related to executable modules\. Variable and fixed
      block data sets display information about when the members were created and
      modified\.

*   `--max-length`  | `--max` *(number)*

	* The option \-\-max\-length specifies the maximum number of items to return\.
      Skip this parameter to return all items\. If you specify an incorrect value, the
      parameter returns up to 1000 items\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Show members of the data set "ibmuser.asm":

      * `$  zowe zos-files list all-members "ibmuser.asm"`

*  Show attributes of members of the data set "ibmuser.cntl":

      * `$  zowe zos-files list all-members "ibmuser.cntl" -a`

*  Show the first 5 members of the data set "ibmuser.cntl":

      * `$  zowe zos-files list all-members "ibmuser.cntl" --max 5`

### data-set<a name="zos-files-list-data-set"></a>
List data sets that match a pattern in the data set name

#### Usage

   zowe zos-files list data-set <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name or pattern of the data set that you want to list

#### Options

*   `--attributes`  | `-a` *(boolean)*

	* Display more information about each member\. Data sets with an undefined record
      format display information related to executable modules\. Variable and fixed
      block data sets display information about when the members were created and
      modified\.

*   `--max-length`  | `--max` *(number)*

	* The option \-\-max\-length specifies the maximum number of items to return\.
      Skip this parameter to return all items\. If you specify an incorrect value, the
      parameter returns up to 1000 items\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Show the data set "ibmuser.asm":

      * `$  zowe zos-files list data-set "ibmuser.asm"`

*  Show attributes of the data set "ibmuser.cntl":

      * `$  zowe zos-files list data-set "ibmuser.cntl" -a`

*  Show all data sets of the user "ibmuser":

      * `$  zowe zos-files list data-set "ibmuser.*"`

*  Show attributes of all data sets of the user "ibmuser":

      * `$  zowe zos-files list data-set "ibmuser.*" -a`

*  Show the first 5 data sets of the user "ibmuser":

      * `$  zowe zos-files list data-set "ibmuser.cntl" --max 5`

### uss-files<a name="zos-files-list-uss-files"></a>
List USS files and directories in a UNIX file path

#### Usage

   zowe zos-files list uss-files <path> [options]

#### Positional Arguments

*   `path`		 *(string)*

	* The directory containing the files and directories to be listed

#### Options

*   `--max-length`  | `--max` *(number)*

	* The option \-\-max\-length specifies the maximum number of items to return\.
      Skip this parameter to return all items\. If you specify an incorrect value, the
      parameter returns up to 1000 items\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  Show the files and directories in path '/u/ibmuser':

      * `$  zowe zos-files list uss-files "/u/ibmuser"`

*  Show the files and directories in path '/u/ibmuser
displaying only the file or directory name:

      * `$  zowe zos-files list uss-files "/u/ibmuser" --rff name`

*  Show the files and directories in path '/u/ibmuser'
displaying the headers associated with the file detail:

      * `$  zowe zos-files list uss-files "/u/ibmuser" --rfh`

### file-system<a name="zos-files-list-file-system"></a>
List all mounted filesystems, or the specific filesystem mounted at a given
path, or the filesystem with a given filesystem name\.

#### Usage

   zowe zos-files list file-system [options]

#### Options

*   `--max-length`  | `--max` *(number)*

	* The option \-\-max\-length specifies the maximum number of items to return\.
      Skip this parameter to return all items\. If you specify an incorrect value, the
      parameter returns up to 1000 items\.

*   `--fsname`  | `-f` *(string)*

	* Specifies the name of the mounted file system\. This option and \-\-path are
      mutually exclusive\.

*   `--path`  | `-p` *(string)*

	* Specifies the path where the file system is mounted\. This option and \-\-fsname
      are mutually exclusive\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  To list all mounted filesystems:

      * `$  zowe zos-files list file-system`

*  To list filesystems mounted to a specific path:

      * `$  zowe zos-files list file-system -p /a/ibmuser`

*  To list filesystems mounted with a specific name:

      * `$  zowe zos-files list file-system -f MY.ZFS`

## upload | ul<a name="zos-files-upload"></a>
Upload the contents of a file to z/OS data sets
### file-to-data-set<a name="zos-files-upload-file-to-data-set"></a>
Upload the contents of a file to a z/OS data set

#### Usage

   zowe zos-files upload file-to-data-set <inputfile> <dataSetName> [options]

#### Positional Arguments

*   `inputfile`		 *(string)*

	* The local file that you want to upload to a data set

*   `dataSetName`		 *(string)*

	* The name of the data set to which you want to upload the file

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Data content in binary mode, which means that no data conversion is performed\.
      The data transfer process returns each record as\-is, without translation\. No
      delimiters are added between records\.

*   `--migrated-recall`  | `--mr` *(string)*

	* The method by which migrated data set is handled\. By default, a migrated data
      set is recalled synchronously\. You can specify the following values: wait,
      nowait, error

      Default value: nowait

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides\. You can use this option
      at any time\. However, the VOLSER is required only when the data set is not
      cataloged on the system\. A VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Upload file contents to a sequential data set named
"ibmuser.ps":

      * `$  zowe zos-files upload file-to-data-set "file.txt" "ibmuser.ps"`

*  Upload file contents to a PDS member named
"ibmuser.pds(mem)":

      * `$  zowe zos-files upload file-to-data-set "file.txt" "ibmuser.pds(mem)"`

*  Upload file contents to a migrated data set and wait for it
to be recalled:

      * `$  zowe zos-files upload file-to-data-set "file.txt" "ibmuser.ps" --mr wait`

### stdin-to-data-set<a name="zos-files-upload-stdin-to-data-set"></a>
Upload the content of a stdin to a z/OS data set

#### Usage

   zowe zos-files upload stdin-to-data-set <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set to which you want to upload data

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Data content in binary mode, which means that no data conversion is performed\.
      The data transfer process returns each record as\-is, without translation\. No
      delimiters are added between records\.

*   `--migrated-recall`  | `--mr` *(string)*

	* The method by which migrated data set is handled\. By default, a migrated data
      set is recalled synchronously\. You can specify the following values: wait,
      nowait, error

      Default value: nowait

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides\. You can use this option
      at any time\. However, the VOLSER is required only when the data set is not
      cataloged on the system\. A VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Stream content from stdin to a sequential data set named
"ibmuser.ps" from a Windows console:

      * `$  echo "hello world" |  zowe zos-files upload stdin-to-data-set "ibmuser.ps"`

*  Stream content from stdin to a partition data set member
named "ibmuser.pds(mem)" from a Windows console:

      * `$  echo "hello world" |  zowe zos-files upload stdin-to-data-set "ibmuser.pds(mem)"`

*  Stream content from stdin to a migrated data set and wait
for it to be recalled from a Windows console:

      * `$  echo "hello world" |  zowe zos-files upload stdin-to-data-set "ibmuser.ps" --mr wait`

### dir-to-pds<a name="zos-files-upload-dir-to-pds"></a>
Upload files from a local directory to a partitioned data set (PDS)

#### Usage

   zowe zos-files upload dir-to-pds <inputdir> <dataSetName> [options]

#### Positional Arguments

*   `inputdir`		 *(string)*

	* The path for a local directory that you want to upload to a PDS

*   `dataSetName`		 *(string)*

	* The name of the partitioned data set to which you want to upload the files

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Data content in binary mode, which means that no data conversion is performed\.
      The data transfer process returns each record as\-is, without translation\. No
      delimiters are added between records\.

*   `--migrated-recall`  | `--mr` *(string)*

	* The method by which migrated data set is handled\. By default, a migrated data
      set is recalled synchronously\. You can specify the following values: wait,
      nowait, error

      Default value: nowait

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides\. You can use this option
      at any time\. However, the VOLSER is required only when the data set is not
      cataloged on the system\. A VOLSER is analogous to a drive name on a PC\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Upload a directory named "src" to a PDS named "ibmuser.src":

      * `$  zowe zos-files upload dir-to-pds "src" "ibmuser.src"`

*  Upload a directory named "src" to a migrated PDS named
"ibmuser.src" and wait for it to be recalled:

      * `$  zowe zos-files upload dir-to-pds "src" "ibmuser.src" --mr wait`

### file-to-uss<a name="zos-files-upload-file-to-uss"></a>
Upload content to a USS file from local file

#### Usage

   zowe zos-files upload file-to-uss <inputfile> <USSFileName> [options]

#### Positional Arguments

*   `inputfile`		 *(string)*

	* The local file that you want to upload to a USS file

*   `USSFileName`		 *(string)*

	* The name of the USS file to which you want to upload the file

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Data content in binary mode, which means that no data conversion is performed\.
      The data transfer process returns each record as\-is, without translation\. No
      delimiters are added between records\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Upload to the USS file "/a/ibmuser/my_text.txt" from the
file "file.txt":

      * `$  zowe zos-files upload file-to-uss "file.txt" "/a/ibmuser/my_text.txt"`

### dir-to-uss<a name="zos-files-upload-dir-to-uss"></a>
Upload a local directory to a USS directory\.

An optional \.zosattributes file in the source directory can be used to control
file conversion and tagging\.

An example \.zosattributes file:  
\# pattern local\-encoding remote\-encoding  
\# Don't upload the node\_modules directory  
\.\* \-   
\*\.jpg binary binary  
\# Convert CICS Node\.js profiles to EBCDIC  
\*\.profile ISO8859\-1 EBCDIC  

Lines starting with the ‘\#’ character are comments\. Each line can specify up
to three positional attributes:
* A pattern to match a set of files\. Pattern\-matching syntax follows
the same rules as those that apply in \.gitignore files (note that negated
patterns that begin with ‘\!’ are not supported)\. See
https://git\-scm\.com/docs/gitignore\#\_pattern\_format\.
* A local\-encoding to identify a file’s encoding on the local
workstation\. If '\-' is specified for local\-encoding,files that match the
pattern are not transferred\.
* A remote\-encoding to specify the file’s desired character set on
USS\. This attribute must either match the local encoding or be set to EBCDIC\.
If set to EBCDIC, files are transferred in text mode and converted, otherwise
they are transferred in binary mode\. Remote files are tagged either with the
remote encoding or as binary\.

Due to a z/OSMF limitation, files that are transferred in text mode are
converted to the default EBCDIC code page on the z/OS system\. Therefore the
only EBCDIC code page to specify as the remote encoding is the default code page
for your system\.

A \.zosattributes file can either be placed in the top\-level directory you want
to upload, or its location can be specified by using the \-\-attributes
parameter\. \.zosattributes files that are placed in nested directories are
ignored\.


#### Usage

   zowe zos-files upload dir-to-uss <inputDir> <USSDir> [options]

#### Positional Arguments

*   `inputDir`		 *(string)*

	* The local directory path that you want to upload to a USS directory

*   `USSDir`		 *(string)*

	* The name of the USS directory to which you want to upload the local directory

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Data content in binary mode, which means that no data conversion is performed\.
      The data transfer process returns each record as\-is, without translation\. No
      delimiters are added between records\.

*   `--recursive`  | `-r` *(boolean)*

	* Upload all directories recursively\.

*   `--binary-files`  | `--bf` *(string)*

	* Comma separated list of file names to be uploaded in binary mode\. Use this
      option when you upload a directory in default ASCII mode, but you want to
      specify certain files to be uploaded in binary mode\. All files matching
      specified file names will be uploaded in binary mode\. If a \.zosattributes file
      (or equivalent file specified via \-\-attributes) is present, \-\-binary\-files
      will be ignored\.

*   `--ascii-files`  | `--af` *(string)*

	* Comma separated list of file names to be uploaded in ASCII mode\. Use this
      option when you upload a directory with \-\-binary/\-b flag, but you want to
      specify certain files to be uploaded in ASCII mode\. All files matching
      specified file names will be uploaded in ASCII mode\. If a \.zosattributes file
      (or equivalent file specified via \-\-attributes) is present, \-\-ascii\-files
      will be ignored\.

*   `--attributes`  | `--attrs` *(string)*

	* Path of an attributes file to control how files are uploaded

*   `--max-concurrent-requests`  | `--mcr` *(number)*

	* Specifies the maximum number of concurrent z/OSMF REST API requests to upload
      files\. Increasing the value results in faster uploads\. However, increasing the
      value increases resource consumption on z/OS and can be prone to errors caused
      by making too many concurrent requests\. If the upload process encounters an
      error, the following message displays:
      The maximum number of TSO address spaces have been created\. When you specify 0,
      Zowe CLI attempts to upload all members at once without a maximum number of
      concurrent requests\.

      Default value: 1

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Upload all files from the "local_dir" directory to the
"/a/ibmuser/my_dir" USS directory:":

      * `$  zowe zos-files upload dir-to-uss "local_dir" "/a/ibmuser/my_dir"`

*  Upload all files from the "local_dir" directory and all its
sub-directories, to the "/a/ibmuser/my_dir" USS directory::

      * `$  zowe zos-files upload dir-to-uss "local_dir" "/a/ibmuser/my_dir" --recursive`

*  Upload all files from the "local_dir" directory to the
"/a/ibmuser/my_dir" USS directory in default ASCII mode, while specifying a list
of file names (without path) to be uploaded in binary mode::

      * `$  zowe zos-files upload dir-to-uss "local_dir" "/a/ibmuser/my_dir" --binary-files "myFile1.exe,myFile2.exe,myFile3.exe"`

*  Upload all files from the "local_dir" directory to the
"/a/ibmuser/my_dir" USS directory in binary mode, while specifying a list of
file names (without path) to be uploaded in ASCII mode::

      * `$  zowe zos-files upload dir-to-uss "local_dir" "/a/ibmuser/my_dir" --binary --ascii-files "myFile1.txt,myFile2.txt,myFile3.txt"`

*  Recursively upload all files from the "local_dir" directory
to the "/a/ibmuser/my_dir" USS directory, specifying files to ignore and file
encodings in the local file my_global_attributes::

      * `$  zowe zos-files upload dir-to-uss "local_dir" "/a/ibmuser/my_dir" --recursive --attributes my_global_attributes`

## mount<a name="zos-files-mount"></a>
Mount z/OS UNIX file systems, such as HFS, ZFS, and more. This connects you to USS file systems.
### file-system<a name="zos-files-mount-file-system"></a>
Mount a UNIX file system on a specified directory\.

#### Usage

   zowe zos-files mount file-system <fileSystemName> <mountPoint> [options]

#### Positional Arguments

*   `fileSystemName`		 *(string)*

	* The name of the file system to mount\.

*   `mountPoint`		 *(string)*

	* The directory to use as a mount point\.

#### Options

*   `--fs-type`  | `--ft` *(string)*

	* Specify the file system type that you are going to mount\. The name must match
      the TYPE operand on a FILESYSTYPE statement in the BPXPRMxx parmlib member for
      the file system\.

      Default value: ZFS

*   `--mode`  | `-m` *(string)*

	* Specify the mode for mounting the file system (rdonly \- read\-only, rdwr \-
      read/write)\.

      Default value: rdonly
      Allowed values: rdonly, rdwr

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Mount a z/OS file system using default options:

      * `$  zowe zos-files mount file-system MY.ZFS /a/ibmuser/mountdir`

*  Mount a hierarchical file system with write access:

      * `$  zowe zos-files mount file-system MY.HFS /a/ibmuser/mountdir --ft HFS -m rdwr`

## unmount | umount<a name="zos-files-unmount"></a>
Unmount file systems, such as HFS, ZFS, and more. This disconnects you from USS file systems.
### file-system<a name="zos-files-unmount-file-system"></a>
Unmount a UNIX file system\.

#### Usage

   zowe zos-files unmount file-system <fileSystemName> [options]

#### Positional Arguments

*   `fileSystemName`		 *(string)*

	* The name of the file system to unmount\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Unmount a mounted file system:

      * `$  zowe zos-files unmount file-system MY.FS`

# zos-jobs | jobs<a name="zos-jobs"></a>
Manage z/OS jobs.
## submit | sub<a name="zos-jobs-submit"></a>
Submit jobs (JCL) contained in data sets.
### data-set<a name="zos-jobs-submit-data-set"></a>
Submit a job (JCL) contained in a data set\. The data set may be of type
physical sequential or a PDS member\. The command does not pre\-validate the
data set name\. The command presents errors verbatim from the z/OSMF Jobs REST
endpoints\. For more information about z/OSMF Jobs API errors, see the z/OSMF
Jobs API REST documentation\.

#### Usage

   zowe zos-jobs submit data-set <dataset> [options]

#### Positional Arguments

*   `dataset`		 *(string)*

	* The z/OS data set containing the JCL to submit\. You can specify a physical
      sequential data set (for example, "DATA\.SET") or a partitioned data set
      qualified by a member (for example, "DATA\.SET(MEMBER)")\.

#### Options

*   `--volume`  | `--vol` *(string)*

	* The volume serial (VOLSER) where the data set resides\. The option is required
      only when the data set is not catalogued on the system\.

*   `--wait-for-output`  | `--wfo` *(boolean)*

	* Wait for the job to enter OUTPUT status before completing the command\.

*   `--wait-for-active`  | `--wfa` *(boolean)*

	* Wait for the job to enter ACTIVE status before completing the command\.

*   `--view-all-spool-content`  | `--vasc` *(boolean)*

	* Print all spool output\. If you use this option you will wait the job to
      complete\.

*   `--directory`  | `-d` *(string)*

	* The local directory you would like to download the output of the job\. Creates a
      subdirectory using the jobID as the name and files are titled based on DD
      names\. If you use this option you will wait the job to complete\.

*   `--extension`  | `-e` *(string)*

	* A file extension to save the job output with\. Default is '\.txt'\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  Submit the JCL in the data set "ibmuser.cntl(deploy)":

      * `$  zowe zos-jobs submit data-set "ibmuser.cntl(deploy)"`

*  Submit the JCL in the data set "ibmuser.cntl(deploy)", wait
for the job to complete and print all output from the job:

      * `$  zowe zos-jobs submit data-set "ibmuser.cntl(deploy)" --vasc`

### local-file<a name="zos-jobs-submit-local-file"></a>
Submit a job (JCL) contained in a local file\. The command presents errors
verbatim from the z/OSMF Jobs REST endpoints\. For more information about z/OSMF
Jobs API errors, see the z/OSMF Jobs API REST documentation\.

#### Usage

   zowe zos-jobs submit local-file <localFile> [options]

#### Positional Arguments

*   `localFile`		 *(string)*

	* The local file containing the JCL to submit\.

#### Options

*   `--view-all-spool-content`  | `--vasc` *(boolean)*

	* Print all spool output\. If you use this option you will wait the job to
      complete\.

*   `--wait-for-output`  | `--wfo` *(boolean)*

	* Wait for the job to enter OUTPUT status before completing the command\.

*   `--wait-for-active`  | `--wfa` *(boolean)*

	* Wait for the job to enter ACTIVE status before completing the command\.

*   `--directory`  | `-d` *(string)*

	* The local directory you would like to download the output of the job\. Creates a
      subdirectory using the jobID as the name and files are titled based on DD
      names\. If you use this option you will wait the job to complete\.

*   `--extension`  | `-e` *(string)*

	* A file extension to save the job output with\. Default is '\.txt'\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  Submit the JCL in the file "iefbr14.txt":

      * `$  zowe zos-jobs submit local-file "iefbr14.txt"`

### stdin<a name="zos-jobs-submit-stdin"></a>
Submit a job (JCL) passed to the command via the stdin stream\. The command
presents errors verbatim from the z/OSMF Jobs REST endpoints\. For more
information about z/OSMF Jobs API errors, see the z/OSMF Jobs API REST
documentation\.

#### Usage

   zowe zos-jobs submit stdin [options]

#### Options

*   `--view-all-spool-content`  | `--vasc` *(boolean)*

	* Print all spool output\. If you use this option you will wait the job to
      complete\.

*   `--wait-for-output`  | `--wfo` *(boolean)*

	* Wait for the job to enter OUTPUT status before completing the command\.

*   `--wait-for-active`  | `--wfa` *(boolean)*

	* Wait for the job to enter ACTIVE status before completing the command\.

*   `--directory`  | `-d` *(string)*

	* The local directory you would like to download the output of the job\. Creates a
      subdirectory using the jobID as the name and files are titled based on DD
      names\. If you use this option you will wait the job to complete\.

*   `--extension`  | `-e` *(string)*

	* A file extension to save the job output with\. Default is '\.txt'\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

## download | dl<a name="zos-jobs-download"></a>
Download the output of a job as separate files.
### output<a name="zos-jobs-download-output"></a>
Download all job output to a local directory\. Each spool DD will be downloaded
to its own file in the directory\.

#### Usage

   zowe zos-jobs download output <jobid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The z/OS JOBID of the job containing the spool files you want to view\. No
      pre\-validation of the JOBID is performed\.

#### Options

*   `--directory`  | `-d` | `--dir` *(string)*

	* The local directory you would like to download the output for the job to\.

*   `--extension`  | `-e` *(string)*

	* A file extension to save the job output with\. Defaults to '\.txt'\.

*   `--omit-jobid-directory`  | `--ojd` *(boolean)*

	* If specified, job output will be saved directly to the specified directory
      rather than creating a subdirectory named after the ID of the job\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Download all the output of the job with job ID JOB00234 to
an automatically generated directory.:

      * `$  zowe zos-jobs download output JOB00234`

## view | vw<a name="zos-jobs-view"></a>
View details of z/OS jobs on spool/JES queues.
### job-status-by-jobid<a name="zos-jobs-view-job-status-by-jobid"></a>
View status details of a single z/OS job on spool/JES queues\. The command does
not prevalidate the JOBID\. The command presents errors verbatim from the z/OSMF
Jobs REST endpoints (expect for "no jobs found")\.

#### Usage

   zowe zos-jobs view job-status-by-jobid <jobid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The z/OS JOBID of the job you want to view\. No prevalidation of the JOBID is
      performed\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  View status and other details of the job with the job ID
JOB00123:

      * `$  zowe zos-jobs view job-status-by-jobid j123`

*  Print only the status (for example, "OUTPUT" or "ACTIVE") of
the job with the job ID JOB00123:

      * `$  zowe zos-jobs view job-status-by-jobid j123 --rff status --rft string`

### spool-file-by-id<a name="zos-jobs-view-spool-file-by-id"></a>
View the contents of a spool file from a z/OS job on spool/JES queues\. The
command does not pre\-validate the JOBID or spool ID\. The command presents
errors verbatim from the z/OSMF Jobs REST endpoints\.

#### Usage

   zowe zos-jobs view spool-file-by-id <jobid> <spoolfileid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The z/OS JOBID of the job containing the spool file you want to view\. No
      pre\-validation of the JOBID is performed\.

*   `spoolfileid`		 *(number)*

	* The spool file ID number for the spool file to view\. Use the "zowe zos\-jobs
      list spool\-files\-by\-jobid" command to obtain spool ID numbers\.No
      pre\-validation of the ID is performed\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  View the spool file with ID 4 for the job with job ID
JOB00123:

      * `$  zowe zos-jobs view spool-file-by-id JOB00123 4`

## list | ls<a name="zos-jobs-list"></a>
List z/OS jobs and list the spool files (DDs) for a z/OS job on the JES/spool queues.
### spool-files-by-jobid<a name="zos-jobs-list-spool-files-by-jobid"></a>
Given a z/OS job JOBID, list the spool files (DDs) for a z/OS job on the
JES/spool queues\. The command does not pre\-validate the JOBID\. The command
presents errors verbatim from the z/OSMF Jobs REST endpoints\.

#### Usage

   zowe zos-jobs list spool-files-by-jobid <jobid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The z/OS JOBID of the job with the spool files you want to list\. No
      pre\-validation of the JOBID is performed\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  List the spool files of the job with JOBID JOB00123:

      * `$  zowe zos-jobs list spool-files-by-jobid job00123`

### jobs<a name="zos-jobs-list-jobs"></a>
List jobs on JES spool/queues\. By default, the command lists jobs owned (owner)
by the user specified in your z/OSMF profile\. The default for prefix is "\*"\.
The command does not prevalidate your user ID\. The command surfaces errors
verbatim from the z/OSMF Jobs REST endpoints\.

#### Usage

   zowe zos-jobs list jobs [options]

#### Options

*   `--owner`  | `-o` *(string)*

	* Specify the owner of the jobs you want to list\. The owner is the
      individual/user who submitted the job OR the user ID assigned to the job\. The
      command does not prevalidate the owner\. You can specify a wildcard according to
      the z/OSMF Jobs REST endpoint documentation, which is usually in the form
      "USER\*"\.

*   `--prefix`  | `-p` *(string)*

	* Specify the job name prefix of the jobs you want to list\. The command does not
      prevalidate the owner\. You can specify a wildcard according to the z/OSMF Jobs
      REST endpoint documentation, which is usually in the form "JOB\*"\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  List all jobs with default settings. The command returns
jobs owned by your user ID with any job name:

      * `$  zowe zos-jobs list jobs`

*  List all jobs owned by user IDs starting with 'ibmu' and job
names starting with 'myjo':

      * `$  zowe zos-jobs list jobs -o "ibmu*" -p "myjo*"`

*  List all jobs with default owner and prefix settings,
displaying only the job ID of each job:

      * `$  zowe zos-jobs list jobs --rff jobid --rft table`

## delete | del<a name="zos-jobs-delete"></a>
Delete a single job by job ID in OUTPUT status. This cancels the job if it is running and purges its output from the system
### job<a name="zos-jobs-delete-job"></a>
Delete a single job by job ID

#### Usage

   zowe zos-jobs delete job <jobid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The job ID (e\.g\. JOB00123) of the job\. Job ID is a unique identifier for z/OS
      batch jobs \-\- no two jobs on one system can have the same ID\. Note: z/OS
      allows you to abbreviate the job ID if desired\. You can use, for example
      "J123"\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Delete job with job ID JOB03456.:

      * `$  zowe zos-jobs delete job JOB03456`

## cancel | can<a name="zos-jobs-cancel"></a>
Cancel a single job by job ID. This cancels the job if it is running or on input.
### job<a name="zos-jobs-cancel-job"></a>
Cancel a single job by job ID

#### Usage

   zowe zos-jobs cancel job <jobid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The job ID (e\.g\. JOB00123) of the job\. Job ID is a unique identifier for z/OS
      batch jobs \-\- no two jobs on one system can have the same ID\. Note: z/OS
      allows you to abbreviate the job ID if desired\. You can use, for example
      "J123"\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Cancel job with job ID JOB03456:

      * `$  zowe zos-jobs cancel job JOB03456`

# zos-tso | tso<a name="zos-tso"></a>
Issue TSO commands and interact with TSO address spaces
## send<a name="zos-tso-send"></a>
Send data to TSO and collect responses until the prompt is reached
### address-space<a name="zos-tso-send-address-space"></a>
Send data to the TSO address space, from which you previously started and
received a token (a\.k\.a 'servlet\-key')\.

#### Usage

   zowe zos-tso send address-space <servletKey> [options]

#### Positional Arguments

*   `servletKey`		 *(string)*

	* The servlet key from a previously started TSO address space\.

#### Required Options

*   `--data`  *(string)*

	* The data to which we want to send to the TSO address space represented by the
      servlet key\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  "Send the TIME TSO command to the TSO address space
identified by IBMUSER-329-aafkaaoc":

      * `$  zowe zos-tso send address-space IBMUSER-329-aafkaaoc --data "TIME"`

## start | st<a name="zos-tso-start"></a>
Start TSO/E address space
### address-space<a name="zos-tso-start-address-space"></a>
Start a TSO address space, from which you will receive a token (a\.k\.a
'servlet\-key') for further address space interaction (e\.g\. termination)\.

#### Usage

   zowe zos-tso start address-space [options]

#### TSO ADDRESS SPACE OPTIONS

*   `--account`  | `-a` *(string)*

	* Your z/OS TSO/E accounting information\.

*   `--character-set`  | `--cs` *(string)*

	* Character set for address space to convert messages and responses from UTF\-8 to
      EBCDIC\.

      Default value: 697

*   `--code-page`  | `--cp` *(string)*

	* Codepage value for TSO/E address space to convert messages and responses from
      UTF\-8 to EBCDIC\.

      Default value: 1047

*   `--columns`  | `--cols` *(number)*

	* The number of columns on a screen\.

      Default value: 80

*   `--logon-procedure`  | `-l` *(string)*

	* The logon procedure to use when creating TSO procedures on your behalf\.

      Default value: IZUFPROC

*   `--region-size`  | `--rs` *(number)*

	* Region size for the TSO/E address space\.

      Default value: 4096

*   `--rows`  *(number)*

	* The number of rows on a screen\.

      Default value: 24

#### Options

*   `--servlet-key-only`  | `--sko` *(boolean)*

	* Specify this option to print only the servlet key

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

*   `--tso-profile`  | `--tso-p` *(string)*

	* The name of a (tso) profile to load for this command execution\.

#### Examples

*  Start TSO/E address space:

      * `$  zowe zos-tso start address-space`

*  Start TSO/E address space, and receive response in JSON
format:

      * `$  zowe zos-tso start address-space --rfj`

*  Start TSO/E address space, and print only the servlet key:

      * `$  zowe zos-tso start address-space --sko`

## ping<a name="zos-tso-ping"></a>
Ping a TSO address space, from which you previously started and received a token (a.k.a 'servelet-key').
### address-space<a name="zos-tso-ping-address-space"></a>
Ping a TSO address space, from which you previously started and received a token
(a\.k\.a 'servlet\-key')\.

#### Usage

   zowe zos-tso ping address-space <servletKey> [options]

#### Positional Arguments

*   `servletKey`		 *(string)*

	* The servlet key from a previously started TSO address space\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Ping the TSO address space identified by
IBMUSER-329-aafkaaoc:

      * `$  zowe zos-tso ping address-space IBMUSER-329-aafkaaoc`

## stop | sp<a name="zos-tso-stop"></a>
Stop TSO/E address space
### address-space<a name="zos-tso-stop-address-space"></a>
Stop a TSO address space, from which you previously started and received a token
(a\.k\.a 'servlet\-key')\.

#### Usage

   zowe zos-tso stop address-space <servletkey> [options]

#### Positional Arguments

*   `servletkey`		 *(string)*

	* The servlet key from a previously started TSO address space\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Stop the TSO address space identified by
IBMUSER-329-aafkaaoc:

      * `$  zowe zos-tso stop address-space IBMUSER-329-aafkaaoc`

## issue<a name="zos-tso-issue"></a>
Issue TSO commands
### command<a name="zos-tso-issue-command"></a>
Creates a TSO address space, issues a TSO command through the newly created
address space, waits for the READY prompt to print the response, and terminates
the TSO address space\. All response data are returned to the user up to (but
not including) the TSO 'READY' prompt\.

#### Usage

   zowe zos-tso issue command <commandText> [options]

#### Positional Arguments

*   `commandText`		 *(string)*

	* The TSO command to issue\.

#### Options

*   `--suppress-startup-messages`  | `--ssm` *(boolean)*

	* Suppress console messages from start of address space\.

#### TSO ADDRESS SPACE OPTIONS

*   `--account`  | `-a` *(string)*

	* Your z/OS TSO/E accounting information\.

*   `--character-set`  | `--cs` *(string)*

	* Character set for address space to convert messages and responses from UTF\-8 to
      EBCDIC\.

      Default value: 697

*   `--code-page`  | `--cp` *(string)*

	* Codepage value for TSO/E address space to convert messages and responses from
      UTF\-8 to EBCDIC\.

      Default value: 1047

*   `--columns`  | `--cols` *(number)*

	* The number of columns on a screen\.

      Default value: 80

*   `--logon-procedure`  | `-l` *(string)*

	* The logon procedure to use when creating TSO procedures on your behalf\.

      Default value: IZUFPROC

*   `--region-size`  | `--rs` *(number)*

	* Region size for the TSO/E address space\.

      Default value: 4096

*   `--rows`  *(number)*

	* The number of rows on a screen\.

      Default value: 24

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

*   `--tso-profile`  | `--tso-p` *(string)*

	* The name of a (tso) profile to load for this command execution\.

#### Examples

*  Issue the TSO command "status" to display information about
jobs for your user ID.:

      * `$  zowe zos-tso issue command "status"`

# zos-uss | uss<a name="zos-uss"></a>
Issue z/OS USS commands remotely using an SSH session. Output from the commands is displayed on the local terminal.
## issue | iss<a name="zos-uss-issue"></a>
Issue a z/OS USS command
### ssh<a name="zos-uss-issue-ssh"></a>
Issue a z/OS USS command

#### Usage

   zowe zos-uss issue ssh <command> [options]

#### Positional Arguments

*   `command`		 *(string)*

	* z/OS USS command to issue

#### Options

*   `--cwd`  *(string)*

	* Working directory in which to execute the command

#### z/OS Ssh Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OS SSH server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OS SSH server port\.

      Default value: 22

*   `--user`  | `-u` *(string)*

	* Mainframe user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe password, which can be the same as your TSO password\.

*   `--privateKey`  | `--key` | `--pk` *(string)*

	* Path to a file containing your private key, that must match a public key stored
      in the server for authentication

*   `--keyPassphrase`  | `--passphrase` | `--kp` *(string)*

	* Private key passphrase, which unlocks the private key\.

*   `--handshakeTimeout`  | `--timeout` | `--to` *(number)*

	* How long in milliseconds to wait for the SSH handshake to complete\.

#### Profile Options

*   `--ssh-profile`  | `--ssh-p` *(string)*

	* The name of a (ssh) profile to load for this command execution\.

#### Examples

*  Issue a simple command, giving the working directory:

      * `$  zowe zos-uss issue ssh "npm install express" --cwd /u/cicprov/mnt/CICPY01I/bundles/myapp `

# zos-workflows | wf<a name="zos-workflows"></a>
Create and manage z/OSMF workflows on a z/OS system
## create | cre<a name="zos-workflows-create"></a>
Create a z/OSMF workflow on a z/OS system.
### workflow-from-data-set<a name="zos-workflows-create-workflow-from-data-set"></a>
Create a z/OSMF workflow on a z/OS system using a Data set

#### Usage

   zowe zos-workflows create workflow-from-data-set <workflowName> [options]

#### Positional Arguments

*   `workflowName`		 *(string)*

	* Name of the workflow

#### Required Options

*   `--data-set`  | `--ds` *(string)*

	* Data set that contains a workflow definiton\.

*   `--system-name`  | `--sn` *(string)*

	* z/OS system to execute the workflow\.

*   `--owner`  | `--ow` *(string)*

	* User ID of the workflow owner\. This user can perform the workflow steps or
      delegate the steps to other users\.

#### Options

*   `--variables-input-file`  | `--vif` *(string)*

	* Specifies an optional properties file that you can use to pre\-specify values
      for one or more of the variables that are defined in the workflow definition
      file\.

*   `--variables`  | `--vs` *(string)*

	* Includes a list of variables for the workflow\. The variables that you specify
      here take precedence over the variables that are specified in the workflow
      variable input file\. Make sure the value meets all regular expression
      requirements set for the corresponding variable\.

*   `--assign-to-owner`  | `--ato` *(boolean)*

	* Indicates whether the workflow steps are assigned to the workflow owner\.

*   `--access-type`  | `--at` *(string)*

	* Specifies the access type for the workflow\. Public, Restricted or Private\.

      Allowed values: Public, Restricted, Private

*   `--delete-completed`  | `--dc` *(boolean)*

	* Whether the successfully completed jobs to be deleted from the JES spool\.

*   `--overwrite`  | `--ov` *(boolean)*

	* Replaces an existing workflow with a new workflow\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  Create a workflow with name "testworkflow" using the data
set "TESTID.WKFLOW" that contains the workflow definition xml on the system
"TESTM1" with owner "OTHERID" and delete workflow with the same name if it
already exist in z/OSMF:

      * `$  zowe zos-workflows create workflow-from-data-set "testworkflow" --data-set "TESTID.WKFLOW" --system-name "TESTM1" --owner "OTHERID" --overwrite`

*  Create a workflow with name "testworkflow" using data set
"TESTID.WKFLOW" containing workflow definition xml, on system "TESTM1" with
owner "MYSYSID" and delete succesfully completed jobs:

      * `$  zowe zos-workflows create workflow-from-data-set "testworkflow" --data-set "TESTID.WKFLOW" --system-name "TESTM1" --owner "MYSYSID" --delete-completed`

*  Create a workflow with name "testworkflow" using data set
"TESTID.WKFLOW" containing workflow definition xml, on system "TESTM1" with
owner "MYSYSID" and with variable values in the member PROPERTIES of data set
TESTID.DATA:

      * `$  zowe zos-workflows create workflow-from-data-set "testworkflow" --data-set "TESTID.WKFLOW" --system-name "TESTM1" --owner "MYSYSID" --variables-input-file TESTID.DATA(PROPERTIES)`

*  Create a workflow with name "testworkflow" using the data
set "TESTID.WKFLOW" that contains a workflow definition xml, on a system
"TESTM1" with owner "MYSYSID" and with the variable name DUMMYVAR and the value
DUMMYVAL. Assign it to the owner:

      * `$  zowe zos-workflows create workflow-from-data-set "testworkflow" --data-set "TESTID.WKFLOW" --system-name "TESTM1" --owner "MYSYSID" --variables DUMMYVAR=DUMMYVAL --assign-to-owner`

### workflow-from-uss-file<a name="zos-workflows-create-workflow-from-uss-file"></a>
Create a workflow instance in z/OSMF using a USS file

#### Usage

   zowe zos-workflows create workflow-from-uss-file <workflowName> [options]

#### Positional Arguments

*   `workflowName`		 *(string)*

	* Name of the workflow instance to create

#### Required Options

*   `--uss-file`  | `--uf` *(string)*

	* Uss file that contains workflow definiton\.

*   `--system-name`  | `--sn` *(string)*

	* z/OS system to execute the workflow\.

*   `--owner`  | `--ow` *(string)*

	* User ID of the workflow owner\. This user can perform the workflow steps or
      delegate the steps to other users\.

#### Options

*   `--variables-input-file`  | `--vif` *(string)*

	* Specifies an optional properties file that you can use to pre\-specify values
      for one or more of the variables that are defined in the workflow definition
      file\.

*   `--variables`  | `--vs` *(string)*

	* Includes a list of variables for the workflow\. The variables that you specify
      here take precedence over the variables that are specified in the workflow
      variable input file\. Make sure the value meets all regular expression
      requirements set for the corresponding variable\.

*   `--assign-to-owner`  | `--ato` *(boolean)*

	* Indicates whether the workflow steps are assigned to the workflow owner\.

*   `--access-type`  | `--at` *(string)*

	* Specifies the access type for the workflow\. Public, Restricted or Private\.

      Allowed values: Public, Restricted, Private

*   `--delete-completed`  | `--dc` *(boolean)*

	* Whether the successfully completed jobs to be deleted from the JES spool\.

*   `--overwrite`  | `--ov` *(boolean)*

	* Replaces an existing workflow with a new workflow\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  Create a workflow with name "testworkflow" using uss file
"/path/workflow.xml" containing workflow definition, on system "TESTM1" with
owner "OTHERID" and delete workflow with the same name if it already exist in
z/OSMF:

      * `$  zowe zos-workflows create workflow-from-uss-file "testworkflow" --uss-file "/path/workflow.xml" --system-name "TESTM1" --owner "OTHERID" --overwrite`

*  Create a workflow with name "testworkflow" using uss file
"/path/workflow.xml" containing workflow definition, on system "TESTM1" with
owner "MYSYSID" and delete successfully completed jobs:

      * `$  zowe zos-workflows create workflow-from-uss-file "testworkflow" --uss-file "/path/workflow.xml" --system-name "TESTM1" --owner "MYSYSID" --delete-completed`

*  Create a workflow with name "testworkflow" using uss file
"/path/workflow.xml" containing workflow definition, on system "TESTM1" with
owner "MYSYSID" and with variable values in the member PROPERTIES of data set
TESTID.DATA:

      * `$  zowe zos-workflows create workflow-from-uss-file "testworkflow" --uss-file "/path/workflow.xml" --system-name "TESTM1" --owner "MYSYSID" --variables-input-file TESTID.DATA(PROPERTIES)`

*  Create a workflow with name "testworkflow" using uss file
"/path/workflow.xml" containing workflow definition, on system "TESTM1" with
owner "MYSYSID" and with variables VAR1 and VAR2 with values DUMMYVAL1 and
DUMMYVAL2, and assign it to the owner:

      * `$  zowe zos-workflows create workflow-from-uss-file "testworkflow" --uss-file "/path/workflow.xml" --system-name "TESTM1"--variables VAR1=DUMMYVAL1,VAR2=DUMMYVAL2 --owner "MYSYSID" --assign-to-owner`

### workflow-from-local-file<a name="zos-workflows-create-workflow-from-local-file"></a>
Create a z/OSMF workflow on a z/OS system using a Local file

#### Usage

   zowe zos-workflows create workflow-from-local-file <workflowName> [options]

#### Positional Arguments

*   `workflowName`		 *(string)*

	* Name of the workflow

#### Required Options

*   `--local-file`  | `--lf` *(string)*

	* Local file that contains workflow definiton\.

*   `--system-name`  | `--sn` *(string)*

	* z/OS system to execute the workflow\.

*   `--owner`  | `--ow` *(string)*

	* User ID of the workflow owner\. This user can perform the workflow steps or
      delegate the steps to other users\.

#### Options

*   `--variables-input-file`  | `--vif` *(string)*

	* Specifies an optional properties file that you can use to pre\-specify values
      for one or more of the variables that are defined in the workflow definition
      file\.

*   `--variables`  | `--vs` *(string)*

	* Includes a list of variables for the workflow\. The variables that you specify
      here take precedence over the variables that are specified in the workflow
      variable input file\. Make sure the value meets all regular expression
      requirements set for the corresponding variable\.

*   `--assign-to-owner`  | `--ato` *(boolean)*

	* Indicates whether the workflow steps are assigned to the workflow owner\.

*   `--access-type`  | `--at` *(string)*

	* Specifies the access type for the workflow\. Public, Restricted or Private\.

      Allowed values: Public, Restricted, Private

*   `--delete-completed`  | `--dc` *(boolean)*

	* Whether the successfully completed jobs to be deleted from the JES spool\.

*   `--overwrite`  | `--ov` *(boolean)*

	* Replaces an existing workflow with a new workflow\.

*   `--remote-directory`  | `--rd` *(string)*

	* The remote uss directory where the files are to be uploaded\. The directory has
      to exist

*   `--keep-files`  | `--kf` *(boolean)*

	* Avoid deletion the uploaded files in /tmp or another specified directory after
      successful execution\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  Create a workflow with name "testworkflow" using the local
file "TESTID_WKFLOW.xml" that contains the workflow definition xml on the system
"TESTM1" with owner "OTHERID" and delete workflow with the same name if it
already exist in z/OSMF:

      * `$  zowe zos-workflows create workflow-from-local-file "testworkflow" --local-file "TESTID_WKFLOW.xml" --system-name "TESTM1" --owner "OTHERID" --overwrite`

## start | sta<a name="zos-workflows-start"></a>
Start a z/OSMF workflow on a z/OS system.
### workflow-full<a name="zos-workflows-start-workflow-full"></a>
Will run workflow from the beginning to the end or to the first manual step\.

#### Usage

   zowe zos-workflows start workflow-full [options]

#### Options

*   `--workflow-key`  | `--wk` *(string)*

	* Workflow key of workflow instance to be started

*   `--workflow-name`  | `--wn` *(string)*

	* Workflow name of workflow instance to be started

*   `--resolve-conflict-by`  | `--rcb` *(string)*

	* How variable conflicts should be handled\.
      Options:
      outputFileValue: Allow the output file values to override the existing values\.
      existingValue: Use the existing variables values instead of the output file
      values\.
      leaveConflict: Automation is stopped\. The user must resolve the conflict
      manually\.

      Default value: outputFileValue
      Allowed values: outputFileValue, existingValue, leaveConflict

*   `--wait`  | `-w` *(boolean)*

	* Identifies whether to wait for workflow instance to finish\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  To start a workflow instance in z/OSMF with workflow key
"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0":

      * `$  zowe zos-workflows start workflow-full --workflow-key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0"`

*  To start a workflow instance in z/OSMF with workflow key
"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0" and wait forit to be finished:

      * `$  zowe zos-workflows start workflow-full --workflow-key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0" --wait`

*  To start a workflow instance in z/OSMF with workflow key
"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0"and if there is a conflict in variable's
value use the value that is in output file:

      * `$  zowe zos-workflows start workflow-full --workflow-key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0" --resolve-conflict-by "outputFileValue"`

*  To start a workflow instance in z/OSMF with workflow name
"testWorkflow":

      * `$  zowe zos-workflows start workflow-full --workflow-name "testWorkflow"`

### workflow-step<a name="zos-workflows-start-workflow-step"></a>
Will run given step of workflow instance plus following steps if specified by
\-\-perform\-following\-steps option\.

#### Usage

   zowe zos-workflows start workflow-step <stepName> [options]

#### Positional Arguments

*   `stepName`		 *(string)*

	* Specifies the step name that will be run\.

#### Options

*   `--workflow-key`  | `--wk` *(string)*

	* Workflow key of workflow instance to be started

*   `--workflow-name`  | `--wn` *(string)*

	* Workflow name of workflow instance to be started

*   `--resolve-conflict-by`  | `--rcb` *(string)*

	* How variable conflicts should be handled\.
      Options:
      outputFileValue: Allow the output file values to override the existing values\.
      existingValue: Use the existing variables values instead of the output file
      values\.
      leaveConflict: Automation is stopped\. The user must resolve the conflict
      manually\.

      Default value: outputFileValue
      Allowed values: outputFileValue, existingValue, leaveConflict

*   `--perform-following-steps`  | `--pfs` *(boolean)*

	* Identifies whether to perform also following steps in the workflow instance\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  To start step "Step1" only in a workflow instance in z/OSMF
with workflow key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0":

      * `$  zowe zos-workflows start workflow-step "Step1" --workflow-key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0"`

*  To start a workflow instance in z/OSMF from step "Step1"
with workflow key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0":

      * `$  zowe zos-workflows start workflow-step "Step1" --workflow-key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0" --perform-following-steps`

*  To start step "Step1" only in a workflow instance in z/OSMF
with workflow key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0"and if there is a
conflict in variable's value use the value that is in output file:

      * `$  zowe zos-workflows start workflow-step "Step1" --workflow-key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0" --resolve-conflict-by "outputFileValue"`

*  To start step "Step1" only in a workflow instance in z/OSMF
with workflow name "testWorkflow":

      * `$  zowe zos-workflows start workflow-step "Step1" --workflow-name "testWorkflow"`

## list | ls<a name="zos-workflows-list"></a>
List the z/OSMF workflows for a system or a sysplex with filter options.
### active-workflows<a name="zos-workflows-list-active-workflows"></a>
List active workflow instance(s) in z/OSMF\.
Multiple filters can be used together\.
Omitting all options will list all workflows on the sysplex

#### Usage

   zowe zos-workflows list active-workflows [options]

#### Options

*   `--workflow-name`  | `--wn` *(string)*

	* Filter by workflow name\. For wildcard use \.\*

*   `--category`  | `--cat` *(string)*

	* Filter by the category of the workflows, which is either general or
      configuration\.

*   `--system`  | `--sys` *(string)*

	* Filter by the nickname of the system on which the workflows is/are active\.

*   `--owner`  | `--ow` *(string)*

	* Filter by owner of the workflow(s) (a valid z/OS user ID)\.

*   `--vendor`  | `--vd` *(string)*

	* Filter by the name of the vendor that provided the workflow(s) definition file\.

*   `--status-name`  | `--sn` *(string)*

	* Filter by the status of the workflow(s)\.

      Allowed values: in\-progress, complete, automation\-in\-progress, canceled

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  List the workflow with name "testworkflow":

      * `$  zowe zos-workflows list active-workflows --wn "testworkflow"`

*  List multiple active workflows on the entire syspex with
names containing"workflow":

      * `$  zowe zos-workflows list active-workflows --wn ".*workflow.*"`

*  List multiple active workflows on system "IBMSYS" with names
beginnig with "testW" that are in status "complete":

      * `$  zowe zos-workflows list active-workflows --wn "test.*" --sys "IBMSYS" --sn "complete"`

### active-workflow-details<a name="zos-workflows-list-active-workflow-details"></a>
Get the details of an active z/OSMF workflow

#### Usage

   zowe zos-workflows list active-workflow-details [options]

#### Options

*   `--workflow-name`  | `--wn` *(string)*

	* List active workflow details by specified workflow name\.

*   `--workflow-key`  | `--wk` *(string)*

	* List active workflow details by specified workflow key\.

*   `--list-steps`  | `--ls` *(boolean)*

	* Optional parameter for listing steps and their properties\.

*   `--steps-summary-only`  | `--sso` *(boolean)*

	* Optional parameter that lists steps summary only\.

*   `--list-variables`  | `--lv` *(boolean)*

	* Optional parameter for listing variables and their properties\.

*   `--skip-workflow-summary`  | `--sws` *(boolean)*

	* Optional parameter that skips the default workflow summary\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  To list the details of an active workflow with key
"7c62c790-0340-86b2-61ce618d8f8c" including its steps and variables:

      * `$  zowe zos-workflows list active-workflow-details --workflow-key "7c62c790-0340-86b2-61ce618d8f8c" --list-steps --list-variables`

*  To list the details of an active workflow with name
"testWorkflow" including its steps and variables:

      * `$  zowe zos-workflows list active-workflow-details --workflow-name "testWorkflow" --list-steps --list-variables`

### definition-file-details<a name="zos-workflows-list-definition-file-details"></a>
Retrieve the contents of a z/OSMF workflow definition from a z/OS system\.

#### Usage

   zowe zos-workflows list definition-file-details <definitionFilePath> [options]

#### Positional Arguments

*   `definitionFilePath`		 *(string)*

	* Specifies the location of the workflow definition file, which is either a UNIX
      path name or a fully qualified z/OS data set name\.

#### Options

*   `--list-steps`  | `--ls` *(boolean)*

	* Optional parameter for listing steps and their properties\.

*   `--list-variables`  | `--lv` *(boolean)*

	* Optional parameter for listing variables and their properties\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  To list the contents of a workflow definition stored in the
UNIX file "/user/dir/workflow.xml" including its steps and variables:

      * `$  zowe zos-workflows list definition-file-details "/user/dir/workflow.xml" --list-steps --list-variables`

*  To list the contents of a workflow definition stored in the
z/OS data set "USER.DATA.SET.XML" including its steps and variables:

      * `$  zowe zos-workflows list definition-file-details --workflow-name "testWorkflow" --list-steps --list-variables`

### archived-workflows<a name="zos-workflows-list-archived-workflows"></a>
List the archived z/OSMF workflows for a system or sysplex\.

#### Usage

   zowe zos-workflows list archived-workflows [options]

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

## archive<a name="zos-workflows-archive"></a>
Archive workflow instance in z/OSMF
### active-workflow<a name="zos-workflows-archive-active-workflow"></a>
Archive an active workflow instance in z/OSMF\.

#### Usage

   zowe zos-workflows archive active-workflow [options]

#### Options

*   `--workflow-name`  | `--wn` *(string)*

	* The name of the workflow to be archived\.

*   `--workflow-key`  | `--wk` *(string)*

	* The workflow key of the workflow to be archived\.

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Response Format Options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response\. Accepts an array of field/property
      names to include in the output response\. You can filter JSON objects properties
      OR table columns/fields\. In addition, you can use this option in conjunction
      with '\-\-response\-format\-type' to reduce the output of a command to a single
      field/property or a list of a single field/property\.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type\. Must be one of the following:

      table: Formats output data as a table\. Use this option when the output data is
      an array of homogeneous JSON objects\. Each property of the object will become a
      column in the table\.

      list: Formats output data as a list of strings\. Can be used on any data type
      (JSON objects/arrays) are stringified and a new line is added after each entry
      in an array\.

      object: Formats output data as a list of prettified objects (or single object)\.
      Can be used in place of "table" to change from tabular output to a list of
      prettified objects\.

      string: Formats output data as a string\. JSON objects/arrays are stringified\.

      Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "\-\-response\-format\-type table" is specified, include the column headers
      in the output\.

#### Examples

*  Archive a workflow with workflow name "testworkflow":

      * `$  zowe zos-workflows archive active-workflow --wn "testworkflow" `

*  Archive multiple workflows with workflow names starting with
"test":

      * `$  zowe zos-workflows archive active-workflow --wn "test.*" `

*  Archive a workflow with workflow key "123-456-abv-xyz":

      * `$  zowe zos-workflows archive active-workflow --wk "123-456-abv-xyz" `

## delete | del<a name="zos-workflows-delete"></a>
Delete an active workflow or an archived workflow from z/OSMF.
### active-workflow<a name="zos-workflows-delete-active-workflow"></a>
Delete an active workflow instance in z/OSMF

#### Usage

   zowe zos-workflows delete active-workflow [options]

#### Options

*   `--workflow-key`  | `--wk` *(string)*

	* Delete active workflow by specified workflow key

*   `--workflow-name`  | `--wn` *(string)*

	* Delete active workflow by specified workflow name

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  To delete a workflow instance in z/OSMF with workflow key
"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0":

      * `$  zowe zos-workflows delete active-workflow --workflow-key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0"`

*  To delete a workflow instance in z/OSMF with workflow name
"testWorkflow":

      * `$  zowe zos-workflows delete active-workflow --workflow-name "testWorkflow"`

*  To delete multiple workflow instances in z/OSMF with names
starting with "test":

      * `$  zowe zos-workflows delete active-workflow --workflow-name "test.*"`

### archived-workflow<a name="zos-workflows-delete-archived-workflow"></a>
Delete an archived workflow from z/OSMF

#### Usage

   zowe zos-workflows delete archived-workflow [options]

#### Options

*   `--workflow-key`  | `--wk` *(string)*

	* Delete an archived workflow by specified workflow key

*   `--workflow-name`  | `--wn` *(string)*

	* Delete an archived workflow by specified workflow name

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  To delete an archived workflow from z/OSMF with workflow key
"d043b5f1-adab-48e7-b7c3-d41cd95fa4b0":

      * `$  zowe zos-workflows delete archived-workflow --workflow-key "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0"`

*  To delete an archived workflow from z/OSMF with workflow
name "testWorkflow":

      * `$  zowe zos-workflows delete archived-workflow --workflow-name "testWorkflow"`

*  To delete multiple archived workflows from z/OSMF with names
beginnig with "test":

      * `$  zowe zos-workflows delete archived-workflow --workflow-name "test.*"`

# zosmf<a name="zosmf"></a>
Retrieve and show the properties of a z/OSMF web server
## check<a name="zosmf-check"></a>
Confirm that z/OSMF is running on a specified system and gather information about the z/OSMF server for diagnostic purposes.
### status<a name="zosmf-check-status"></a>
Confirm that z/OSMF is running on a system specified in your profile and gather
information about the z/OSMF server for diagnostic purposes\. The command
outputs properties of the z/OSMF server such as version, hostname, and installed
plug\-ins\.

#### Usage

   zowe zosmf check status [options]

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Report the status of the z/OSMF server that you specified in
your default z/OSMF profile:

      * `$  zowe zosmf check status`

*  Report the status of the z/OSMF server that you specified in
a supplied z/OSMF profile:

      * `$  zowe zosmf check status --zosmf-profile SomeZosmfProfileName`

*  Report the status of the z/OSMF server that you specified
manually via command line:

      * `$  zowe zosmf check status --host myhost --port 443 --user myuser --password mypass`

## list<a name="zosmf-list"></a>
Obtain a list of systems that are defined to a z/OSMF instance.
### systems<a name="zosmf-list-systems"></a>
Obtain a list of systems that are defined to a z/OSMF instance\.

#### Usage

   zowe zosmf list systems [options]

#### Zosmf Connection Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name\.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port\.

      Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login\.

*   `--password`  | `--pass` | `--pw` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password\.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self\-signed certificates\.

      Default value: true

*   `--base-path`  | `--bp` *(string)*

	* The base path for your API mediation layer instance\. Specify this option to
      prepend the base path to all z/OSMF resources when making REST requests\. Do not
      specify this option if you are not using an API mediation layer\.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution\.

#### Examples

*  Obtain a list of systems defined to a z/OSMF instance with
your default z/OSMF profile:

      * `$  zowe zosmf list systems`

*  Obtain a list of systems defined to a z/OSMF instance for
the specified z/OSMF profile:

      * `$  zowe zosmf list systems --zosmf-profile SomeZosmfProfileName`

*  Obtain a list of the systems defined to a z/OSMF instance
that you specified in the command line:

      * `$  zowe zosmf list systems --host myhost --port 443 --user myuser --password mypass`

