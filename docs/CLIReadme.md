# Zowe CLI Help


Welcome to Zowe CLI!

Zowe CLI is a command line interface (CLI) that provides a simple and streamlined way to interact with IBM z/OS.

For additional Zowe CLI documentation, visit https://zowe.github.io/docs-site.

For Zowe CLI support, visit https://zowe.org.


### Table of Contents
* [plugins](#module-plugins)
	* [install](#command-install)
	* [list](#command-list)
	* [uninstall](#command-uninstall)
	* [update](#command-update)
	* [validate](#command-validate)
* [profiles](#module-profiles)
	* [create | cre](#module-create)
		* [zosmf-profile](#command-zosmf-profile)
		* [tso-profile](#command-tso-profile)
	* [update | upd](#module-update)
		* [zosmf-profile](#command-zosmf-profile)
		* [tso-profile](#command-tso-profile)
	* [delete | rm](#module-delete)
		* [zosmf-profile](#command-zosmf-profile)
		* [tso-profile](#command-tso-profile)
	* [list | ls](#module-list)
		* [zosmf-profiles](#command-zosmf-profiles)
		* [tso-profiles](#command-tso-profiles)
	* [set-default | set](#module-set-default)
		* [zosmf-profile](#command-zosmf-profile)
		* [tso-profile](#command-tso-profile)
* [provisioning | pv](#module-provisioning)
	* [list | ls](#module-list)
		* [template-info](#command-template-info)
		* [catalog-templates](#command-catalog-templates)
		* [instance-info](#command-instance-info)
		* [instance-variables](#command-instance-variables)
		* [registry-instances](#command-registry-instances)
	* [provision | prov](#module-provision)
		* [template](#command-template)
	* [perform | perf](#module-perform)
		* [action](#command-action)
	* [delete | del](#module-delete)
		* [instance](#command-instance)
* [zos-console | console](#module-zos-console)
	* [collect](#module-collect)
		* [sync-responses](#command-sync-responses)
	* [issue](#module-issue)
		* [command](#command-command)
* [zos-files | files](#module-zos-files)
	* [create | cre](#module-create)
		* [data-set-sequential](#command-data-set-sequential)
		* [data-set-partitioned](#command-data-set-partitioned)
		* [data-set-binary](#command-data-set-binary)
		* [data-set-c](#command-data-set-c)
		* [data-set-classic](#command-data-set-classic)
		* [data-set-vsam](#command-data-set-vsam)
	* [delete | del](#module-delete)
		* [data-set](#command-data-set)
		* [data-set-vsam](#command-data-set-vsam)
	* [invoke | call](#module-invoke)
		* [ams-statements](#command-ams-statements)
		* [ams-file](#command-ams-file)
	* [download | dl](#module-download)
		* [data-set](#command-data-set)
		* [all-members](#command-all-members)
		* [uss-file](#command-uss-file)
	* [list | ls](#module-list)
		* [all-members](#command-all-members)
		* [data-set](#command-data-set)
	* [upload | ul](#module-upload)
		* [file-to-data-set](#command-file-to-data-set)
		* [stdin-to-data-set](#command-stdin-to-data-set)
		* [dir-to-pds](#command-dir-to-pds)
		* [file-to-uss](#command-file-to-uss)
* [zos-jobs | jobs](#module-zos-jobs)
	* [submit | sub](#module-submit)
		* [data-set](#command-data-set)
		* [local-file](#command-local-file)
	* [download | dl](#module-download)
		* [output](#command-output)
	* [view | vw](#module-view)
		* [job-status-by-jobid](#command-job-status-by-jobid)
		* [spool-file-by-id](#command-spool-file-by-id)
	* [list | ls](#module-list)
		* [spool-files-by-jobid](#command-spool-files-by-jobid)
		* [jobs](#command-jobs)
	* [delete | del](#module-delete)
		* [job](#command-job)
* [zos-tso | tso](#module-zos-tso)
	* [send](#module-send)
		* [address-space](#command-address-space)
	* [start | st](#module-start)
		* [address-space](#command-address-space)
	* [ping](#module-ping)
		* [address-space](#command-address-space)
	* [stop | sp](#module-stop)
		* [address-space](#command-address-space)
	* [issue](#module-issue)
		* [command](#command-command)
* [zosmf](#module-zosmf)
	* [check](#module-check)
		* [status](#command-status)


# plugins<a name="module-plugins"></a>
Install and manage plug-ins
## install<a name="command-install"></a>
Install plug-ins to an application.

#### Usage

   zowe plugins install [plugin...] [options]

#### Positional Arguments

*   `plugin...`		 *(string)*

	* A space-separated list of plug-ins to install. A plug-in can be any format that
is accepted by the `npm install` command (local directory, TAR file, git URL,
public package, private package, etc...).

To use a relative local directory, at least one '/' or '\' must exist in the
plug-in path. For example, you have a local plug-in in a folder called
'test-plugin' that you want to install. Specify the relative local directory by
issuing the following command:

zowe plugins install ./test-plugin

If you omit the './', then the install command looks for 'test-plugin' in an npm
registry.

If the plugin argument is omitted, the plugins.json file will determine which
plug-ins are installed. For more information on the plugins.json file, see the
--file option.

#### Options

*   `--file`  *(local file path)*

	* Specifies the location of a plugins.json file that contains the plug-ins you
want to install.

All plug-ins specified in plugins.json will be installed to the base CLI and the
contents will be placed into C:\Users\USER\.zowe\plugins\plugins.json.

If you do not specify a plugins.json file and do not specify a plug-in, the
default plugin.json file (C:\Users\USER\.zowe\plugins\plugins.json) will be
used. This provides a way to install plug-ins that were lost or corrupted after
reinstalling or updating Zowe CLI.

*   `--registry`  *(string)*

	* The npm registry that is used when installing remote packages. When this value
is omitted, the value returned by `npm config get registry` is used.

For more information about npm registries, see:
https://docs.npmjs.com/misc/registry

### Examples

   *-  Install plug-ins saved in
   C:\Users\USER\.zowe\plugins\plugins.json:

* `          $  zowe plugins install `

   *-  Install plug-ins saved in a properly formatted config file:

* `          $  zowe plugins install --file /some/file/path/file_name.json`

   *-  Install a remote plug-in:

* `          $  zowe plugins install my-plugin`

   *-  Install a remote plug-in using semver:

* `          $  zowe plugins install my-plugin@"^1.2.3"`

   *-  Install a remote plug-in from the specified registry:

* `          $  zowe plugins install my-plugin --registry https://registry.npmjs.org/`

   *-  Install a local folder, local TAR file, and a git URL:

* `          $  zowe plugins install ./local-file /root/tar/some-tar.tgz git://github.com/project/repository.git#v1.0.0`

## list<a name="command-list"></a>
List all plug-ins installed.

#### Usage

   zowe plugins list [options]

## uninstall<a name="command-uninstall"></a>
Uninstall plug-ins.

#### Usage

   zowe plugins uninstall [plugin...] [options]

#### Positional Arguments

*   `plugin...`		 *(string)*

	* The name of the plug-in to uninstall.

If the plug-in argument is omitted, no action is taken.

### Examples

   *-  Uninstall a plug-in:

* `          $  zowe plugins uninstall my-plugin`

## update<a name="command-update"></a>
Update plug-ins.

#### Usage

   zowe plugins update [plugin...] [options]

#### Positional Arguments

*   `plugin...`		 *(string)*

	* The name of the plug-in to update.

If the plug-in argument is omitted, no action is taken.

#### Options

*   `--registry`  *(string)*

	* The npm registry that is used when installing remote packages. When this value
is omitted, the value returned by `npm config get registry` is used.

For more information about npm registries, see:
https://docs.npmjs.com/misc/registry

### Examples

   *-  Update a plug-in:

* `          $  zowe plugins update my-plugin`

## validate<a name="command-validate"></a>
Validate a plug-in that has been installed.

#### Usage

   zowe plugins validate [plugin] [options]

#### Positional Arguments

*   `plugin`		 *(string)*

	* The name of the plug-in to validate.
Validation issues identified for this plug-in are displayed.

If the plug-in argument is omitted, all installed plug-ins are validated.

### Examples

   *-  Validate a plug-in named my-plugin:

* `          $  zowe plugins validate my-plugin`

   *-  Validate all installed plug-ins:

* `          $  zowe plugins validate `

# profiles<a name="module-profiles"></a>
Create and manage configuration profiles
## create | cre<a name="module-create"></a>
Create new configuration profiles.
### zosmf-profile<a name="command-zosmf-profile"></a>
z/OSMF Profile

#### Usage

   zowe profiles create zosmf-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new zosmf profile. You can load this profile by using
the name on commands that support the "--zosmf-profile" option.

#### Required Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name.

#### Options

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port.

Default value: 443

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login.

*   `--password`  | `-p` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self-signed certificates.

Default value: true

*   `--overwrite`  | `--ow` *(boolean)*

	* Overwrite the zosmf profile when a profile of the same name exists.

### Examples

   *-  Create a zosmf profile called 'zos123' to connect to z/OSMF
   at host zos123 and port 1443:

* `          $  zowe profiles create zosmf-profile zos123 --host zos123 --port 1443 --user ibmuser --password myp4ss`

   *-  Create a zosmf profile called 'zos124' to connect to z/OSMF
   at the host zos124 (default port - 443) and allow self-signed certificates:

* `          $  zowe profiles create zosmf-profile zos124 --host zos124 --user ibmuser --password myp4ss --reject-unauthorized false`

### tso-profile<a name="command-tso-profile"></a>
z/OS TSO/E User Profile

#### Usage

   zowe profiles create tso-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new tso profile. You can load this profile by using
the name on commands that support the "--tso-profile" option.

#### Required Options

*   `--account`  | `-a` *(string)*

	* Your z/OS TSO/E accounting information.

#### Options

*   `--character-set`  | `--cs` *(string)*

	* Character set for address space to convert messages and responses from UTF-8 to
EBCDIC.

Default value: 697

*   `--code-page`  | `--cp` *(string)*

	* Codepage value for TSO/E address space to convert messages and responses from
UTF-8 to EBCDIC.

Default value: 1047

*   `--columns`  | `--cols` *(number)*

	* The number of columns on a screen.

Default value: 80

*   `--logon-procedure`  | `-l` *(string)*

	* The logon procedure to use when creating TSO procedures on your behalf.

Default value: IZUFPROC

*   `--region-size`  | `--rs` *(number)*

	* Region size for the TSO/E address space.

Default value: 4096

*   `--rows`  *(number)*

	* The number of rows on a screen.

Default value: 24

*   `--overwrite`  | `--ow` *(boolean)*

	* Overwrite the tso profile when a profile of the same name exists.

### Examples

   *-  Create a tso profile called 'myprof' with default settings
   and JES accounting information of 'IZUACCT':

* `          $  zowe profiles create tso-profile myprof -a IZUACCT`

   *-  Create a tso profile called 'largeregion' with a region
   size of 8192, a logon procedure of MYPROC, and JES accounting information of
   '1234':

* `          $  zowe profiles create tso-profile largeregion -a 1234 --rs 8192`

## update | upd<a name="module-update"></a>
Update a  profile.You can update any property present within the profile configuration. The updated profile  will be printed so that you can review the result of the updates.
### zosmf-profile<a name="command-zosmf-profile"></a>
z/OSMF Profile

#### Usage

   zowe profiles update zosmf-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new zosmf profile. You can load this profile by using
the name on commands that support the "--zosmf-profile" option.

#### Options

*   `--host`  | `-H` *(string)*

	* The z/OSMF server host name.

*   `--port`  | `-P` *(number)*

	* The z/OSMF server port.

*   `--user`  | `-u` *(string)*

	* Mainframe (z/OSMF) user name, which can be the same as your TSO login.

*   `--password`  | `-p` *(string)*

	* Mainframe (z/OSMF) password, which can be the same as your TSO password.

*   `--reject-unauthorized`  | `--ru` *(boolean)*

	* Reject self-signed certificates.

### tso-profile<a name="command-tso-profile"></a>
z/OS TSO/E User Profile

#### Usage

   zowe profiles update tso-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the new tso profile. You can load this profile by using
the name on commands that support the "--tso-profile" option.

#### Options

*   `--account`  | `-a` *(string)*

	* Your z/OS TSO/E accounting information.

*   `--character-set`  | `--cs` *(string)*

	* Character set for address space to convert messages and responses from UTF-8 to
EBCDIC.

*   `--code-page`  | `--cp` *(string)*

	* Codepage value for TSO/E address space to convert messages and responses from
UTF-8 to EBCDIC.

*   `--columns`  | `--cols` *(number)*

	* The number of columns on a screen.

*   `--logon-procedure`  | `-l` *(string)*

	* The logon procedure to use when creating TSO procedures on your behalf.

*   `--region-size`  | `--rs` *(number)*

	* Region size for the TSO/E address space.

*   `--rows`  *(number)*

	* The number of rows on a screen.

## delete | rm<a name="module-delete"></a>
Delete existing profiles.
### zosmf-profile<a name="command-zosmf-profile"></a>
Delete a zosmf profile. You must specify a profile name to be deleted. To find a
list of available profiles for deletion, issue the profiles list command. By
default, you will be prompted to confirm the profile removal.

#### Usage

   zowe profiles delete zosmf-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the zosmf profile to be deleted. You can also load this
profile by using the name on commands that support the "--zosmf-profile" option.

#### Options

*   `--force`  *(boolean)*

	* Force deletion of profile, and dependent profiles if specified. No prompt will
be displayed before deletion occurs.

### tso-profile<a name="command-tso-profile"></a>
Delete a tso profile. You must specify a profile name to be deleted. To find a
list of available profiles for deletion, issue the profiles list command. By
default, you will be prompted to confirm the profile removal.

#### Usage

   zowe profiles delete tso-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specifies the name of the tso profile to be deleted. You can also load this
profile by using the name on commands that support the "--tso-profile" option.

#### Options

*   `--force`  *(boolean)*

	* Force deletion of profile, and dependent profiles if specified. No prompt will
be displayed before deletion occurs.

## list | ls<a name="module-list"></a>
List profiles of the type 
### zosmf-profiles<a name="command-zosmf-profiles"></a>
z/OSMF Profile

#### Usage

   zowe profiles list zosmf-profiles [options]

#### Options

*   `--show-contents`  | `--sc` *(boolean)*

	* List zosmf profiles and their contents. All profile details will be printed as
part of command output.

### tso-profiles<a name="command-tso-profiles"></a>
z/OS TSO/E User Profile

#### Usage

   zowe profiles list tso-profiles [options]

#### Options

*   `--show-contents`  | `--sc` *(boolean)*

	* List tso profiles and their contents. All profile details will be printed as
part of command output.

## set-default | set<a name="module-set-default"></a>
Set which profiles are loaded by default.
### zosmf-profile<a name="command-zosmf-profile"></a>
The zosmf set default-profiles command allows you to set the default profiles
for this command group. When a zosmf command is issued and no profile override
options are specified, the default profiles for the command group are
automatically loaded for the command based on the commands profile requirements.

#### Usage

   zowe profiles set-default zosmf-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specify a
profile for default usage within the zosmf group. When you issue commands within
the zosmf group without a profile specified as part of the command, the default
will be loaded instead.

### tso-profile<a name="command-tso-profile"></a>
The tso set default-profiles command allows you to set the default profiles for
this command group. When a tso command is issued and no profile override options
are specified, the default profiles for the command group are automatically
loaded for the command based on the commands profile requirements.

#### Usage

   zowe profiles set-default tso-profile <profileName> [options]

#### Positional Arguments

*   `profileName`		 *(string)*

	* Specify a
profile for default usage within the tso group. When you issue commands within
the tso group without a profile specified as part of the command, the default
will be loaded instead.

# provisioning | pv<a name="module-provisioning"></a>
Perform z/OSMF provisioning tasks on Published Templates in the Service Catalog and Provisioned Instances in the Service Registry.
## list | ls<a name="module-list"></a>
Lists z/OSMF provisioning information such as the provisioned instances from the registry, the provisioned instance details, the available provisioning templates and provisioning template details.
### template-info<a name="command-template-info"></a>
List details about a template published with z/OSMF Cloud Provisioning.

#### Usage

   zowe provisioning list template-info <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* The name of a z/OSMF cloud provisioning template.

#### Options

*   `--all-info`  | `--ai` *(boolean)*

	* Display detailed information about published z/OSMF service catalog template
(summary information is printed by default).

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  List summary information for template "template1":

* `          $  zowe provisioning list template-info template1`

### catalog-templates<a name="command-catalog-templates"></a>
Lists the z/OSMF service catalog published templates.

#### Usage

   zowe provisioning list catalog-templates [options]

#### Options

*   `--all-info`  | `--ai` *(boolean)*

	* Display information about published z/OSMF service catalog templates (summary
information is printed by default).

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  List all published templates in the z/OSMF service catalog
   (with full detail):

* `          $  zowe provisioning list catalog-templates --all-info`

### instance-info<a name="command-instance-info"></a>
List details about an instance provisioned with z/OSMF.

#### Usage

   zowe provisioning list instance-info <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* Provisioned Instance Name

#### Options

*   `--display`  *(string)*

	* Level of information to display for the provisioned instance. Possible values:

summary 	- summary information, no actions or variables
actions 	- (default) summary with actions, no variables
vars 	- summary information with variables, no actions
extended 	- extended information with actions
full 	- all available information


Allowed values: extended, summary, vars, actions, full

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  List summary information with a list of actions for an
   instance with the name "instance1":

* `          $  zowe provisioning list instance-info instance1`

   *-  Show extended general information with actions for a
   provisioned instance with the name "instance1":

* `          $  zowe provisioning list instance-info instance1 --display extended`

### instance-variables<a name="command-instance-variables"></a>
List a set of variables and their values for a given name.

#### Usage

   zowe provisioning list instance-variables <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* Provisioned Instance Name

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

#### response format options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response. Accepts an array of field/property
names to include in the output response. You can filter JSON objects properties
OR table columns/fields. In addition, you can use this option in conjunction
with '--response-format-type' to reduce the output of a command to a single
field/property or a list of a single field/property.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type. Must be one of the following:

table: Formats output data as a table. Use this option when the output data is
an array of homogeneous JSON objects. Each property of the object will become a
column in the table.

list: Formats output data as a list of strings. Can be used on any data type
(JSON objects/arrays) are stringified and a new line is added after each entry
in an array.

object: Formats output data as a list of prettified objects (or single object).
Can be used in place of "table" to change from tabular output to a list of
prettified objects.

string: Formats output data as a string. JSON objects/arrays are stringified.

Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "--response-format-type table" is specified, include the column headers in
the output.

### Examples

   *-  List instance variables of "instance1":

* `          $  zowe provisioning list instance-variables instance1`

### registry-instances<a name="command-registry-instances"></a>
List the provisioned instances from the z/OSMF software registry.

#### Usage

   zowe provisioning list registry-instances [options]

#### Options

*   `--all-info`  | `--ai` *(boolean)*

	* Display all available information about provisioned instances (summary by
default).

*   `--filter-by-type`  | `--fbt` *(string)*

	* Filter the list of provisioned instances by type (e.g. DB2 or CICS).

*   `--filter-by-external-name`  | `--fben` *(string)*

	* Filter the list of provisioned instances by External Name.

*   `--types`  | `-t` *(boolean)*

	* Display a list of all types for provisioned instances (e.g. DB2 or CICS).

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  List all provisioned instances (with full detail):

* `          $  zowe provisioning list registry-instances --all-info`

## provision | prov<a name="module-provision"></a>
Using z/OSMF cloud provisioning services provision available templates.
### template<a name="command-template"></a>
Using z/OSMF cloud provisioning services, provision available templates.
You can view available templates using the zowe provisioning list
catalog-templates command.

#### Usage

   zowe provisioning provision template <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* The name of a z/OSMF cloud provisioning template.

#### Options

*   `--properties`  | `-p` *(string)*

	* A sequence of string enclosed "name=value" pairs of prompt variables.
e.g: "CSQ_MQ_SSID=ZCT1,CSQ_CMD_PFX=!ZCT1".

*   `--properties-file`  | `--pf` *(string)*

	* Path to .yml file containing properties.

*   `--domain-name`  | `--dn` *(string)*

	* Required if the user has consumer authorization to more than one domain with
this template name.

*   `--tenant-name`  | `--tn` *(string)*

	* Required if the user has consumer authorization to more than one tenant in the
same domain that contains this template name.

*   `--user-data-id`  | `--udi` *(string)*

	* ID for the user data specified with user-data. Passed into the software services
registry.

*   `--user-data`  | `--ud` *(string)*

	* User data that is passed into the software services registry. Can be specified
only if user-data-id is provided.

*   `--account-info`  | `--ai` *(string)*

	* Account information to use in the JCL JOB statement. The default is the account
information that is associated with the resource pool for the tenant.

*   `--system-nick-names`  | `--snn` *(string)*

	* Each string is the nickname of the system upon which to provision the software
service defined by the template. The field is required if the resource pool
associated with the tenant used for this operation is not set up to
automatically select a system. Only one nickname is allowed.If the field is
provided it is validated.
e.g: "SYSNAME1,SYSNAME2".

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Provision a published software service template.:

* `          $  zowe provisioning provision template template1`

## perform | perf<a name="module-perform"></a>
Perform actions against instances provisioned with z/OSMF.
### action<a name="command-action"></a>
Perform actions on instances previously provisioned with z/OSMF cloud
provisioning services. To view the list of provisioned instances, use the
"zowe provisioning list registry-instances" command. Once you have
obtained an instance name you can use the "zowe provisioning list
instance-info <name>" command to view the available instance actions.

#### Usage

   zowe provisioning perform action <name> <actionname> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* Provisioned Instance name.

*   `actionname`		 *(string)*

	* The action name. Use the "zowe provisioning list instance-info <name>"
command to view available instance actions.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Perform the "start" action on the provisioned instance
   "instance1":

* `          $  zowe provisioning perform action instance1 start`

## delete | del<a name="module-delete"></a>
Deletes instance previously provisioned with z/OSMF cloud provisioning services.
### instance<a name="command-instance"></a>
Deletes selected deprovisioned instance.

#### Usage

   zowe provisioning delete instance <name> [options]

#### Positional Arguments

*   `name`		 *(string)*

	* Deprovisioned Instance name.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Delete deprovisioned instance "instance1":

* `          $  zowe provisioning delete instance instance1`

# zos-console | console<a name="module-zos-console"></a>
Interact with z/OSMF console services. Issue z/OS console commands and collect responses. z/OS console services establishes extended MCS (EMCS) consoles on behalf of the user, which are used to issue the commands and collect responses.

Important! Before you use commands in the zos-console command group, ensure that you understand the implications of issuing z/OS console commands in your environment.
## collect<a name="module-collect"></a>
z/OSMF console services provides a command response key upon successful issue of a console command. You can use this key to collect additional console message responses.
### sync-responses<a name="command-sync-responses"></a>
The z/OSMF console REST APIs return a "solicited response key" after
successfully issuing a synchronous console command that produces solicited
responses. You can use the "solicited response key"on the "sync-responses"
command to collect any additional outstanding solicited responses from the
console the command was issued.

In general, when issuing a z/OS console command, z/OS applications route
responses to the originating console. The command response messages are referred
to as "solicited command responses" (i.e. direct responses to the command
issued). When issuing a z/OS console command using Zowe CLI, collection of all
solicited command responses is attempted by default. However, there is no z/OS
mechanism that indicates the total number of response messages that may be
produced from a given command. Therefore, the Zowe CLI console APIs return a
"solicited response key" that can be used to "follow-up" and collect any
additional solicited command responses.

#### Usage

   zowe zos-console collect sync-responses <responsekey> [options]

#### Positional Arguments

*   `responsekey`		 *(string)*

	* The "solicited response key" provided in response to a previously issued console
command. Used by the z/OSMF console API to collect any additional outstanding
solicited responses from a previously issued console command. Must match regular
expression: `^[a-zA-Z0-9]+$`

#### Options

*   `--console-name`  | `--cn` | `-c` *(string)*

	* The name of the z/OS extended MCS console to direct the command. You must have
the required authority to access the console specified. You may also specify an
arbitrary name, if your installation allows dynamic creation of consoles with
arbitrary names.

Allowed values: ^[a-zA-Z0-9]+$

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Collect any outstanding additional solicited response
   messages:

* `          $  zowe zos-console collect sync-responses C4866969`

## issue<a name="module-issue"></a>
Issue z/OS console commands and optionally collect responses.
### command<a name="command-command"></a>
Issue a z/OS console command and print command responses (known as "solicited
command responses").

In general, when issuing a z/OS console command, z/OS applications route
responses to the originating console. The command response messages are referred
to as "solicited command responses" (i.e. direct responses to the command
issued). When issuing a z/OS console command using Zowe CLI, collection of all
solicited command responses is attempted by default. However, there is no z/OS
mechanism that indicates the total number of response messages that may be
produced from a given command. Therefore, the Zowe CLI console APIs return a
"solicited response key" that can be used to "follow-up" and collect any
additional solicited command responses.

Zowe CLI will issue "follow-up" API requests by default to collect any
additional outstanding solicited command responses until a request returns no
additional responses. At that time, Zowe CLI will attempt a final collection
attempt. If no messages are present, the command is complete. If additional
messages are present, the process is repeated. However, this does not guarantee
that all messages produced in direct response (i.e. solicited) have been
collected. The z/OS application may produce additional messages in direct
response to your command at some point in the future. You can manually collect
additional responses using the "command response key" OR specify additional
processing options to, for example, delay collection attempts by a specified
interval.

#### Usage

   zowe zos-console issue command <commandtext> [options]

#### Positional Arguments

*   `commandtext`		 *(string)*

	* The z/OS console command to issue

#### Options

*   `--console-name`  | `--cn` | `-c` *(string)*

	* The name of the z/OS extended MCS console to direct the command. You must have
the required authority to access the console specified. You may also specify an
arbitrary name, if your installation allows dynamic creation of consoles with
arbitrary names.

Allowed values: ^[a-zA-Z0-9]+$

*   `--include-details`  | `--id` | `-i` *(boolean)*

	* Include additional details at the end of the Zowe CLI command response, such as
the "command response key" and the z/OSMF command response URL.

*   `--key-only`  | `--ko` | `-k` *(boolean)*

	* Displays only the "command response key" returned from the z/OSMF console API.
You can collect additional messages using the command key with 'zowe zos-console
collect sync-responses <key>'. Note that when using this option, you will not be
presented with the "first set" of command response messages (if present in the
API response). However, you can view them by using the --response-format-json
option.

*   `--return-first`  | `--rf` | `-r` *(boolean)*

	* Indicates that Zowe CLI should return immediately with the response message set
returned in the first z/OSMF API request (even if no responses are present).
Using this option may result in partial or no response, but quicker Zowe CLI
command response time. The z/OSMF console API has an implicit wait when
collecting the first set of console command responses, i.e you will normally
receive at least one set of response messages.

*   `--solicited-keyword`  | `--sk` | `-s` *(string)*

	* For solicited responses (direct command responses) the response is considered
complete if the keyword specified is present. If the keyword is detected, the
command will immediately return, meaning the full command response may not be
provided. The key only applies to the first request issued, follow up requests
do not support searching for the keyword.

*   `--sysplex-system`  | `--ss` | `--sys` *(string)*

	* Specifies the z/OS system (LPAR) in the current SYSPLEX (where your target
z/OSMF resides) to route the z/OS console command.

*   `--wait-to-collect`  | `--wtc` | `-w` *(number)*

	* Indicates that Zowe CLI wait at least the specified number of seconds before
attempting to collect additional solicited response messages. If additional
messages are collected on "follow-up" requests, the timer is reset until an
attempt is made that results in no additional response messages.

*   `--follow-up-attempts`  | `--fua` | `-a` *(number)*

	* Number of request attempts if no response returned

Default value: 1

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Issue a z/OS console command to display the IPL information
   for the system:

* `          $  zowe zos-console issue command "D IPLINFO"`

   *-  Issue a z/OS console command to display the local and
   coordinated universal time and date:

* `          $  zowe zos-console issue command "D T"`

# zos-files | files<a name="module-zos-files"></a>
Manage z/OS data sets, create data sets, and more
## create | cre<a name="module-create"></a>
Create data sets
### data-set-sequential<a name="command-data-set-sequential"></a>
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

	* The logical record length. Analogous to the length of a line (for example, 80)

Default value: 80

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

Default value: 1

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK - where n is the number of
cylinders or tracks). Sets the primary allocation (the secondary allocation
becomes ~10% of the primary).

Default value: 1CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed. A VOLSER
is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Create an empty physical sequential data set with default
   parameters:

* `          $  zowe zos-files create data-set-sequential NEW.PS.DATASET`

### data-set-partitioned<a name="command-data-set-partitioned"></a>
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

	* The data set type

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

	* The logical record length. Analogous to the length of a line (for example, 80)

Default value: 80

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

Default value: 1

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK - where n is the number of
cylinders or tracks). Sets the primary allocation (the secondary allocation
becomes ~10% of the primary).

Default value: 1CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed. A VOLSER
is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Create an empty PDS with default parameters:

* `          $  zowe zos-files create data-set-partitioned NEW.PDS.DATASET`

### data-set-binary<a name="command-data-set-binary"></a>
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

	* The logical record length. Analogous to the length of a line (for example, 80)

Default value: 27998

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

Default value: 10

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK - where n is the number of
cylinders or tracks). Sets the primary allocation (the secondary allocation
becomes ~10% of the primary).

Default value: 10CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed. A VOLSER
is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Create an empty binary partitioned data set (PDS) with
   default parameters:

* `          $  zowe zos-files create data-set-binary NEW.BINARY.DATASET`

### data-set-c<a name="command-data-set-c"></a>
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

	* The logical record length. Analogous to the length of a line (for example, 80)

Default value: 260

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

Default value: 1

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK - where n is the number of
cylinders or tracks). Sets the primary allocation (the secondary allocation
becomes ~10% of the primary).

Default value: 1CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed. A VOLSER
is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Create an empty C code PDS with default parameters:

* `          $  zowe zos-files create data-set-c NEW.CCODE.DATASET`

### data-set-classic<a name="command-data-set-classic"></a>
Create classic data sets (JCL, HLASM, CBL, etc...)

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

	* The logical record length. Analogous to the length of a line (for example, 80)

Default value: 80

*   `--secondary-space`  | `--ss` *(number)*

	* The secondary space allocation (for example, 1)

Default value: 1

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The size of the data set (specified as nCYL or nTRK - where n is the number of
cylinders or tracks). Sets the primary allocation (the secondary allocation
becomes ~10% of the primary).

Default value: 1CYL

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) on which you want the data set to be placed. A VOLSER
is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Create an empty z/OS 'classic' PDS with default parameters:

* `          $  zowe zos-files create data-set-classic NEW.CLASSIC.DATASET`

### data-set-vsam<a name="command-data-set-vsam"></a>
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

	* The data set organization.

Default value: INDEXED
Allowed values: INDEXED, IXD, LINEAR, LIN, NONINDEXED, NIXD, NUMBERED, NUMD, ZFS

*   `--management-class`  | `--mc` *(string)*

	* The SMS management class to use for the allocation

*   `--retain-for`  | `--rf` *(number)*

	* The number of days that the VSAM cluster will be retained on the system. You can
delete the cluster at any time when neither retain-for nor retain-to is
specified.

*   `--retain-to`  | `--rt` *(string)*

	* The earliest date that a command without the PURGE parameter can delete an
entry. Specify the expiration date in the form yyyyddd, where yyyy is a
four-digit year (maximum value: 2155) and ddd is the three-digit day of the year
from 001 through 365 (for non-leap years) or 366 (for leap years). You can
delete the cluster at any time when neither retain-for nor retain-to is used.
You cannot specify both the 'retain-to' and 'retain-for' options.

*   `--secondary-space`  | `--ss` *(number)*

	* The number of items for the secondary space allocation (for example, 840). The
type of item allocated is the same as the type used for the '--size' option. If
you do not specify a secondary allocation, a value of ~10% of the primary
allocation is used.

*   `--show-attributes`  | `--pa` *(boolean)*

	* Show the full allocation attributes

*   `--size`  | `--sz` *(string)*

	* The primary size to allocate for the VSAM cluster. Specify size as the number of
items to allocate (nItems). You specify the type of item by keyword.

Default value: 840KB

*   `--storage-class`  | `--sc` *(string)*

	* The SMS storage class to use for the allocation

*   `--volumes`  | `-v` *(string)*

	* The storage volumes on which to allocate a VSAM cluster. Specify a single volume
by its volume serial (VOLSER). To specify more than one volume, enclose the
option in double-quotes and separate each VOLSER with a space. You must specify
the volumes option when your cluster is not SMS-managed.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Create a VSAM data set named "SOME.DATA.SET.NAME" using
   default values of INDEXED, 840 KB primary storage and 84 KB secondary storage:

* `          $  zowe zos-files create data-set-vsam SOME.DATA.SET.NAME`

   *-  Create a 5 MB LINEAR VSAM data set named
   "SOME.DATA.SET.NAME" with 1 MB of secondary space. Show the properties of the
   data set when it is created:

* `          $  zowe zos-files create data-set-vsam SOME.DATA.SET.NAME --data-set-organization LINEAR --size 5MB --secondary-space 1MB --show-attributes`

   *-  Create a VSAM data set named "SOME.DATA.SET.NAME", which is
   retained for 100 days:

* `          $  zowe zos-files create data-set-vsam SOME.DATA.SET.NAME --retain-for 100 `

## delete | del<a name="module-delete"></a>
Delete a data set
### data-set<a name="command-data-set"></a>
Delete a data set permanently

#### Usage

   zowe zos-files delete data-set <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set that you want to delete

#### Required Options

*   `--for-sure`  | `-f` *(boolean)*

	* Specify this option to confirm that you want to delete the data set permanently.

#### Options

*   `--volume`  | `--vol` *(string)*

	* The volume serial (VOLSER) where the data set resides. The option is required
only when the data set is not catalogued on the system.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Delete the data set named 'ibmuser.cntl':

* `          $  zowe zos-files delete data-set "ibmuser.cntl" -f`

### data-set-vsam<a name="command-data-set-vsam"></a>
Delete a VSAM cluster permanently

#### Usage

   zowe zos-files delete data-set-vsam <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the VSAM cluster that you want to delete

#### Options

*   `--erase`  | `-e` *(boolean)*

	* Specify this option to overwrite the data component for the cluster with binary
zeros. This option is ignored if the NOERASE attribute was specified when the
cluster was defined or altered.

*   `--purge`  | `-p` *(boolean)*

	* Specify this option to delete the VSAM cluster regardless of its retention
period or date.

#### Required Options

*   `--for-sure`  | `-f` *(boolean)*

	* Specify this option to confirm that you want to delete the VSAM cluster
permanently.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Delete the VSAM data set named 'ibmuser.cntl.vsam':

* `          $  zowe zos-files delete data-set-vsam "ibmuser.cntl.vsam" -f`

   *-  Delete all expired VSAM data sets that match
   'ibmuser.AAA.**.FFF':

* `          $  zowe zos-files delete data-set-vsam "ibmuser.AAA.**.FFF" -f`

   *-  Delete a non-expired VSAM data set named
   'ibmuser.cntl.vsam':

* `          $  zowe zos-files delete data-set-vsam "ibmuser.cntl.vsam" -f --purge`

   *-  Delete an expired VSAM data set named 'ibmuser.cntl.vsam'
   by overwriting the components with zeros:

* `          $  zowe zos-files delete data-set-vsam "ibmuser.cntl.vsam" -f --erase`

## invoke | call<a name="module-invoke"></a>
Invoke z/OS utilities such as Access Method Services (AMS)
### ams-statements<a name="command-ams-statements"></a>
Submit control statements for execution by Access Method Services (IDCAMS). You
can use IDCAMS to create VSAM data sets (CSI, ZFS, etc...), delete data sets,
and more. You must format the control statements exactly as the IDCAMS utility
expects. For more information about control statements, see the IBM publication
'z/OS DFSMS Access Method Services Commands'.

#### Usage

   zowe zos-files invoke ams-statements <controlStatements> [options]

#### Positional Arguments

*   `controlStatements`		 *(string)*

	* The IDCAMS control statement that you want to submit. Zowe CLI attempts to split
the inline control statement at 255 characters.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Defines a cluster named 'DUMMY.VSAM.CLUSTER':

* `          $  zowe zos-files invoke ams-statements "DEFINE CLUSTER ( NAME (DUMMY.VSAM.CLUSTER) CYL(1 1))"`

   *-  Deletes a cluster named 'DUMMY.VSAM.CLUSTER':

* `          $  zowe zos-files invoke ams-statements "DELETE DUMMY.VSAM.CLUSTER CLUSTER"`

### ams-file<a name="command-ams-file"></a>
Submit control statements for execution by Access Method Services (IDCAMS). You
can use IDCAMS to create VSAM data sets (CSI, ZFS, etc...), delete data sets,
and more. You must format the control statements exactly as the IDCAMS utility
expects. For more information about control statements, see the IBM publication
'z/OS DFSMS Access Method Services Commands'.

#### Usage

   zowe zos-files invoke ams-file <controlStatementsFile> [options]

#### Positional Arguments

*   `controlStatementsFile`		 *(string)*

	* The path to a file that contains IDCAMS control statements. Ensure that your
file does not contain statements that are longer than 255 characters (maximum
allowed length).

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Reads the specified file and submits the controls
   statements:

* `          $  zowe zos-files invoke ams-file "./path/to/file/MyControlStatements.idcams"`

## download | dl<a name="module-download"></a>
Download content from z/OS data sets and USS files to your PC
### data-set<a name="command-data-set"></a>
Download content from a z/OS data set to a local file

#### Usage

   zowe zos-files download data-set <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set that you want to download

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Download the file content in binary mode, which means that no data conversion is
performed. The data transfer process returns each line as-is, without
translation. No delimiters are added between records.

*   `--extension`  | `-e` *(string)*

	* Save the local files with a specified file extension. For example, .txt.

*   `--file`  | `-f` *(string)*

	* The path to the local file where you want to download the content. When you omit
the option, the command generates a file name automatically for you.

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides. You can use this option
at any time. However, the VOLSER is required only when the data set is not
cataloged on the system. A VOLSER is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Download the data set "ibmuser.loadlib(main)" in binary
   mode to the local file "main.obj":

* `          $  zowe zos-files download data-set "ibmuser.loadlib(main)" -b -f main.obj`

### all-members<a name="command-all-members"></a>
Download all members from a partitioned data set to a local folder

#### Usage

   zowe zos-files download all-members <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set from which you want to download members

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Download the file content in binary mode, which means that no data conversion is
performed. The data transfer process returns each line as-is, without
translation. No delimiters are added between records.

*   `--directory`  | `-d` *(string)*

	* The directory to where you want to save the members. The command creates the
directory for you when it does not already exist. By default, the command
creates a folder structure based on the data set qualifiers. For example, the
data set ibmuser.new.cntl's members are downloaded to ibmuser/new/cntl).

*   `--extension`  | `-e` *(string)*

	* Save the local files with a specified file extension. For example, .txt.

*   `--max-concurrent-requests`  | `--mcr` *(number)*

	* Specifies the maximum number of concurrent z/OSMF REST API requests to download
members. Increasing the value results in faster downloads. However, increasing
the value increases resource consumption on z/OS and can be prone to errors
caused by making too many concurrent requests. If the download process
encounters an error, the following message displays:
The maximum number of TSO address spaces were created. When you specify 0, Zowe
CLI attempts to download all members at once without a maximum number of
concurrent requests.

Default value: 1

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides. You can use this option
at any time. However, the VOLSER is required only when the data set is not
cataloged on the system. A VOLSER is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Download the members of the data set "ibmuser.loadlib" in
   binary mode to the directory "loadlib/":

* `          $  zowe zos-files download all-members "ibmuser.loadlib" -b -d loadlib`

   *-  Download the members of the data set "ibmuser.cntl" in text
   mode to the directory "jcl/":

* `          $  zowe zos-files download all-members "ibmuser.cntl" -d jcl`

### uss-file<a name="command-uss-file"></a>
Download content from a USS file to a local file on your PC

#### Usage

   zowe zos-files download uss-file <ussFileName> [options]

#### Positional Arguments

*   `ussFileName`		 *(string)*

	* The name of the USS file you want to download

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Download the file content in binary mode, which means that no data conversion is
performed. The data transfer process returns each line as-is, without
translation. No delimiters are added between records.

*   `--file`  | `-f` *(string)*

	* The path to the local file where you want to download the content. When you omit
the option, the command generates a file name automatically for you.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Download the file "/a/ibmuser/my_text.txt" to
   ./my_text.txt:

* `          $  zowe zos-files download uss-file "/a/ibmuser/my_text.txt" -f ./my_text.txt`

   *-  Download the file "/a/ibmuser/MyJava.class" to
   "java/MyJava.class" in binary mode:

* `          $  zowe zos-files download uss-file "/a/ibmuser/MyJava.class" -b -f "java/MyJava.class"`

## list | ls<a name="module-list"></a>
List data sets and data set members. Optionally, you can list their details and attributes.
### all-members<a name="command-all-members"></a>
List all members of a partitioned data set. To view additional information about
each member, use the --attributes option under the Options section of this help
text.

#### Usage

   zowe zos-files list all-members <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set for which you want to list the members

#### Options

*   `--attributes`  | `-a` *(boolean)*

	* Display more information about each member. Data sets with an undefined record
format display information related to executable modules. Variable and fixed
block data sets display information about when the members were created and
modified.

*   `--max-length`  | `--max` *(number)*

	* The option --max-length specifies the maximum number of items to return. Skip
this parameter to return all items. If you specify an incorrect value, the
parameter returns up to 1000 items.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Show members of the data set "ibmuser.asm":

* `          $  zowe zos-files list all-members "ibmuser.asm"`

   *-  Show attributes of members of the data set "ibmuser.cntl":

* `          $  zowe zos-files list all-members "ibmuser.cntl" -a`

   *-  Show the first 5 members of the data set "ibmuser.cntl":

* `          $  zowe zos-files list all-members "ibmuser.cntl" --max 5`

### data-set<a name="command-data-set"></a>
List data sets that match a pattern in the data set name

#### Usage

   zowe zos-files list data-set <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name or pattern of the data set that you want to list

#### Options

*   `--attributes`  | `-a` *(boolean)*

	* Display more information about each member. Data sets with an undefined record
format display information related to executable modules. Variable and fixed
block data sets display information about when the members were created and
modified.

*   `--max-length`  | `--max` *(number)*

	* The option --max-length specifies the maximum number of items to return. Skip
this parameter to return all items. If you specify an incorrect value, the
parameter returns up to 1000 items.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Show the data set "ibmuser.asm":

* `          $  zowe zos-files list data-set "ibmuser.asm"`

   *-  Show attributes of the data set "ibmuser.cntl":

* `          $  zowe zos-files list data-set "ibmuser.cntl" -a`

   *-  Show all data sets of the user "ibmuser":

* `          $  zowe zos-files list data-set "ibmuser.*"`

   *-  Show attributes of all data sets of the user "ibmuser":

* `          $  zowe zos-files list data-set "ibmuser.*" -a`

   *-  Show the first 5 data sets of the user "ibmuser":

* `          $  zowe zos-files list data-set "ibmuser.cntl" --max 5`

## upload | ul<a name="module-upload"></a>
Upload the contents of a file to z/OS data sets
### file-to-data-set<a name="command-file-to-data-set"></a>
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

	* Data content in binary mode, which means that no data conversion is performed.
The data transfer process returns each record as-is, without translation. No
delimiters are added between records.

*   `--migrated-recall`  | `--mr` *(string)*

	* The method by which migrated data set is handled. By default, a migrated data
set is recalled synchronously. You can specify the following values: wait,
nowait, error

Default value: nowait

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides. You can use this option
at any time. However, the VOLSER is required only when the data set is not
cataloged on the system. A VOLSER is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Upload file contents to a sequential data set named
   "ibmuser.ps":

* `          $  zowe zos-files upload file-to-data-set "file.txt" "ibmuser.ps"`

   *-  Upload file contents to a PDS member named
   "ibmuser.pds(mem)":

* `          $  zowe zos-files upload file-to-data-set "file.txt" "ibmuser.pds(mem)"`

   *-  Upload file contents to a migrated data set and wait for it
   to be recalled:

* `          $  zowe zos-files upload file-to-data-set "file.txt" "ibmuser.ps" --mr wait`

### stdin-to-data-set<a name="command-stdin-to-data-set"></a>
Upload the content of a stdin to a z/OS data set

#### Usage

   zowe zos-files upload stdin-to-data-set <dataSetName> [options]

#### Positional Arguments

*   `dataSetName`		 *(string)*

	* The name of the data set to which you want to upload data

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Data content in binary mode, which means that no data conversion is performed.
The data transfer process returns each record as-is, without translation. No
delimiters are added between records.

*   `--migrated-recall`  | `--mr` *(string)*

	* The method by which migrated data set is handled. By default, a migrated data
set is recalled synchronously. You can specify the following values: wait,
nowait, error

Default value: nowait

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides. You can use this option
at any time. However, the VOLSER is required only when the data set is not
cataloged on the system. A VOLSER is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Stream content from stdin to a sequential data set named
   "ibmuser.ps" from a Windows console:

* `          $  zowe zos-files upload stdin-to-data-set "ibmuser.ps" < echo "hello world"`

   *-  Stream content from stdin to a partition data set member
   named "ibmuser.pds(mem)" from a Windows console:

* `          $  zowe zos-files upload stdin-to-data-set "ibmuser.pds(mem)" < echo "hello world"`

   *-  Stream content from stdin to a migrated data set and wait
   for it to be recalled from a Windows console:

* `          $  zowe zos-files upload stdin-to-data-set "ibmuser.ps" --mr wait < echo "hello world"`

### dir-to-pds<a name="command-dir-to-pds"></a>
Upload files from a directory to a partioned data set (PDS)

#### Usage

   zowe zos-files upload dir-to-pds <inputdir> <dataSetName> [options]

#### Positional Arguments

*   `inputdir`		 *(string)*

	* The path for a local directory that you want to upload to a PDS

*   `dataSetName`		 *(string)*

	* The name of the partitioned data set to which you want to upload the files

#### Options

*   `--binary`  | `-b` *(boolean)*

	* Data content in binary mode, which means that no data conversion is performed.
The data transfer process returns each record as-is, without translation. No
delimiters are added between records.

*   `--migrated-recall`  | `--mr` *(string)*

	* The method by which migrated data set is handled. By default, a migrated data
set is recalled synchronously. You can specify the following values: wait,
nowait, error

Default value: nowait

*   `--volume-serial`  | `--vs` *(string)*

	* The volume serial (VOLSER) where the data set resides. You can use this option
at any time. However, the VOLSER is required only when the data set is not
cataloged on the system. A VOLSER is analogous to a drive name on a PC.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Upload a directory named "src" to a PDS named
   "ibmuser.src":

* `          $  zowe zos-files upload dir-to-pds "src" "ibmuser.src"`

   *-  Upload a directory named "src" to a migrated PDS named
   "ibmuser.src" and wait for it to be recalled:

* `          $  zowe zos-files upload dir-to-pds "src" "ibmuser.src" --mr wait`

### file-to-uss<a name="command-file-to-uss"></a>
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

	* Data content in binary mode, which means that no data conversion is performed.
The data transfer process returns each record as-is, without translation. No
delimiters are added between records.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Upload to the USS file "/a/ibmuser/my_text.txt" from the
   file "file.txt":

* `          $  zowe zos-files upload file-to-uss "file.txt" "/a/ibmuser/my_text.txt"`

# zos-jobs | jobs<a name="module-zos-jobs"></a>
Manage z/OS jobs.
## submit | sub<a name="module-submit"></a>
Submit jobs (JCL) contained in data sets.
### data-set<a name="command-data-set"></a>
Submit a job (JCL) contained in a data set. The data set may be of type physical
sequential or a PDS member. The command does not pre-validate the data set name.
The command presents errors verbatim from the z/OSMF Jobs REST endpoints. For
more information about z/OSMF Jobs API errors, see the z/OSMF Jobs API REST
documentation.

#### Usage

   zowe zos-jobs submit data-set <dataset> [options]

#### Positional Arguments

*   `dataset`		 *(string)*

	* The z/OS data set containing the JCL to submit. You can specify a physical
sequential data set (for example, "DATA.SET") or a partitioned data set
qualified by a member (for example, "DATA.SET(MEMBER)").

#### Options

*   `--volume`  | `--vol` *(string)*

	* The volume serial (VOLSER) where the data set resides. The option is required
only when the data set is not catalogued on the system.

*   `--view-all-spool-content`  | `--vasc` *(boolean)*

	* Print all spool output. If you use this option you will wait the job to
complete.

*   `--directory`  | `-d` *(string)*

	* The local directory you would like to download the output of the job. Creates a
subdirectory using the jobID as the name and files are titled based on DD names.
If you use this option you will wait the job to complete.

*   `--extension`  | `-e` *(string)*

	* A file extension to save the job output with. Default is '.txt'.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

#### response format options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response. Accepts an array of field/property
names to include in the output response. You can filter JSON objects properties
OR table columns/fields. In addition, you can use this option in conjunction
with '--response-format-type' to reduce the output of a command to a single
field/property or a list of a single field/property.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type. Must be one of the following:

table: Formats output data as a table. Use this option when the output data is
an array of homogeneous JSON objects. Each property of the object will become a
column in the table.

list: Formats output data as a list of strings. Can be used on any data type
(JSON objects/arrays) are stringified and a new line is added after each entry
in an array.

object: Formats output data as a list of prettified objects (or single object).
Can be used in place of "table" to change from tabular output to a list of
prettified objects.

string: Formats output data as a string. JSON objects/arrays are stringified.

Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "--response-format-type table" is specified, include the column headers in
the output.

### Examples

   *-  Submit the JCL in the data set "ibmuser.cntl(deploy)":

* `          $  zowe zos-jobs submit data-set "ibmuser.cntl(deploy)"`

   *-  Submit the JCL in the data set "ibmuser.cntl(deploy)", wait
   for the job to complete and print all output from the job:

* `          $  zowe zos-jobs submit data-set "ibmuser.cntl(deploy)" --vasc`

### local-file<a name="command-local-file"></a>
Submit a job (JCL) contained in a local file. The command presents errors
verbatim from the z/OSMF Jobs REST endpoints. For more information about z/OSMF
Jobs API errors, see the z/OSMF Jobs API REST documentation.

#### Usage

   zowe zos-jobs submit local-file <localFile> [options]

#### Positional Arguments

*   `localFile`		 *(string)*

	* The local file containing the JCL to submit.

#### Options

*   `--view-all-spool-content`  | `--vasc` *(boolean)*

	* View all spool content for specified job ID

*   `--directory`  | `-d` *(string)*

	* The local directory you would like to download the output for the job to.
Creates a subdirectory using the jobID as the name and files are titled based on
DD names.

*   `--extension`  | `-e` *(string)*

	* A file extension to save the job output with

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

#### response format options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response. Accepts an array of field/property
names to include in the output response. You can filter JSON objects properties
OR table columns/fields. In addition, you can use this option in conjunction
with '--response-format-type' to reduce the output of a command to a single
field/property or a list of a single field/property.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type. Must be one of the following:

table: Formats output data as a table. Use this option when the output data is
an array of homogeneous JSON objects. Each property of the object will become a
column in the table.

list: Formats output data as a list of strings. Can be used on any data type
(JSON objects/arrays) are stringified and a new line is added after each entry
in an array.

object: Formats output data as a list of prettified objects (or single object).
Can be used in place of "table" to change from tabular output to a list of
prettified objects.

string: Formats output data as a string. JSON objects/arrays are stringified.

Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "--response-format-type table" is specified, include the column headers in
the output.

### Examples

   *-  Submit the JCL in the file "iefbr14.txt":

* `          $  zowe zos-jobs submit local-file "iefbr14.txt"`

## download | dl<a name="module-download"></a>
Download the output of a job as separate files.
### output<a name="command-output"></a>
Download all job output to a local directory. Each spool DD will be downloaded
to its own file in the directory.

#### Usage

   zowe zos-jobs download output <jobid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The z/OS JOBID of the job containing the spool files you want to view. No
pre-validation of the JOBID is performed.

#### Options

*   `--directory`  | `-d` | `--dir` *(string)*

	* The local directory you would like to download the output for the job to.

*   `--extension`  | `-e` *(string)*

	* A file extension to save the job output with. Defaults to '.txt'.

*   `--omit-jobid-directory`  | `--ojd` *(boolean)*

	* If specified, job output will be saved directly to the specified directory
rather than creating a subdirectory named after the ID of the job.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Download all the output of the job with job ID JOB00234 to
   an automatically generated directory.:

* `          $  zowe zos-jobs download output JOB00234`

## view | vw<a name="module-view"></a>
View details of z/OS jobs on spool/JES queues.
### job-status-by-jobid<a name="command-job-status-by-jobid"></a>
View status details of a single z/OS job on spool/JES queues. The command does
not prevalidate the JOBID. The command presents errors verbatim from the z/OSMF
Jobs REST endpoints (expect for "no jobs found").

#### Usage

   zowe zos-jobs view job-status-by-jobid <jobid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The z/OS JOBID of the job you want to view. No prevalidation of the JOBID is
performed.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

#### response format options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response. Accepts an array of field/property
names to include in the output response. You can filter JSON objects properties
OR table columns/fields. In addition, you can use this option in conjunction
with '--response-format-type' to reduce the output of a command to a single
field/property or a list of a single field/property.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type. Must be one of the following:

table: Formats output data as a table. Use this option when the output data is
an array of homogeneous JSON objects. Each property of the object will become a
column in the table.

list: Formats output data as a list of strings. Can be used on any data type
(JSON objects/arrays) are stringified and a new line is added after each entry
in an array.

object: Formats output data as a list of prettified objects (or single object).
Can be used in place of "table" to change from tabular output to a list of
prettified objects.

string: Formats output data as a string. JSON objects/arrays are stringified.

Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "--response-format-type table" is specified, include the column headers in
the output.

### Examples

   *-  View status and other details of the job with the job ID
   JOB00123:

* `          $  zowe zos-jobs view job-status-by-jobid j123`

   *-  Print only the status (for example, "OUTPUT" or "ACTIVE")
   of the job with the job ID JOB00123:

* `          $  zowe zos-jobs view job-status-by-jobid j123 --rff status --rft string`

### spool-file-by-id<a name="command-spool-file-by-id"></a>
View the contents of a spool file from a z/OS job on spool/JES queues. The
command does not pre-validate the JOBID or spool ID. The command presents errors
verbatim from the z/OSMF Jobs REST endpoints.

#### Usage

   zowe zos-jobs view spool-file-by-id <jobid> <spoolfileid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The z/OS JOBID of the job containing the spool file you want to view. No
pre-validation of the JOBID is performed.

*   `spoolfileid`		 *(number)*

	* The spool file ID number for the spool file to view. Use the "zowe zos-jobs list
spool-files-by-jobid" command to obtain spool ID numbers.No pre-validation of
the ID is performed.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  View the spool file with ID 4 for the job with job ID
   JOB00123:

* `          $  zowe zos-jobs view spool-file-by-id JOB00123 4`

## list | ls<a name="module-list"></a>
List z/OS jobs and list the spool files (DDs) for a z/OS job on the JES/spool queues.
### spool-files-by-jobid<a name="command-spool-files-by-jobid"></a>
Given a z/OS job JOBID, list the spool files (DDs) for a z/OS job on the
JES/spool queues. The command does not pre-validate the JOBID. The command
presents errors verbatim from the z/OSMF Jobs REST endpoints.

#### Usage

   zowe zos-jobs list spool-files-by-jobid <jobid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The z/OS JOBID of the job with the spool files you want to list. No
pre-validation of the JOBID is performed.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

#### response format options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response. Accepts an array of field/property
names to include in the output response. You can filter JSON objects properties
OR table columns/fields. In addition, you can use this option in conjunction
with '--response-format-type' to reduce the output of a command to a single
field/property or a list of a single field/property.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type. Must be one of the following:

table: Formats output data as a table. Use this option when the output data is
an array of homogeneous JSON objects. Each property of the object will become a
column in the table.

list: Formats output data as a list of strings. Can be used on any data type
(JSON objects/arrays) are stringified and a new line is added after each entry
in an array.

object: Formats output data as a list of prettified objects (or single object).
Can be used in place of "table" to change from tabular output to a list of
prettified objects.

string: Formats output data as a string. JSON objects/arrays are stringified.

Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "--response-format-type table" is specified, include the column headers in
the output.

### Examples

   *-  List the spool files of the job with JOBID JOB00123:

* `          $  zowe zos-jobs list spool-files-by-jobid job00123`

### jobs<a name="command-jobs"></a>
List jobs on JES spool/queues. By default, the command lists jobs owned (owner)
by the user specified in your z/OSMF profile. The default for prefix is "&ast;".
The command does not prevalidate your user ID. The command surfaces errors
verbatim from the z/OSMF Jobs REST endpoints.

#### Usage

   zowe zos-jobs list jobs [options]

#### Options

*   `--owner`  | `-o` *(string)*

	* Specify the owner of the jobs you want to list. The owner is the individual/user
who submitted the job OR the user ID assigned to the job. The command does not
prevalidate the owner. You can specify a wildcard according to the z/OSMF Jobs
REST endpoint documentation, which is usually in the form "USER&ast;".

*   `--prefix`  | `-p` *(string)*

	* Specify the job name prefix of the jobs you want to list. The command does not
prevalidate the owner. You can specify a wildcard according to the z/OSMF Jobs
REST endpoint documentation, which is usually in the form "JOB&ast;".

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

#### response format options

*   `--response-format-filter`  | `--rff` *(array)*

	* Filter (include) fields in the response. Accepts an array of field/property
names to include in the output response. You can filter JSON objects properties
OR table columns/fields. In addition, you can use this option in conjunction
with '--response-format-type' to reduce the output of a command to a single
field/property or a list of a single field/property.

*   `--response-format-type`  | `--rft` *(string)*

	* The command response output format type. Must be one of the following:

table: Formats output data as a table. Use this option when the output data is
an array of homogeneous JSON objects. Each property of the object will become a
column in the table.

list: Formats output data as a list of strings. Can be used on any data type
(JSON objects/arrays) are stringified and a new line is added after each entry
in an array.

object: Formats output data as a list of prettified objects (or single object).
Can be used in place of "table" to change from tabular output to a list of
prettified objects.

string: Formats output data as a string. JSON objects/arrays are stringified.

Allowed values: table, list, object, string

*   `--response-format-header`  | `--rfh` *(boolean)*

	* If "--response-format-type table" is specified, include the column headers in
the output.

### Examples

   *-  List all jobs with default settings. The command returns
   jobs owned by your user ID with any job name:

* `          $  zowe zos-jobs list jobs `

   *-  List all jobs owned by user IDs starting with 'ibmu' and
   job names starting with 'myjo':

* `          $  zowe zos-jobs list jobs -o "ibmu*" -p "myjo*"`

   *-  List all jobs with default owner and prefix settings,
   displaying only the job ID of each job:

* `          $  zowe zos-jobs list jobs --rff jobid --rft table`

## delete | del<a name="module-delete"></a>
Delete a single job by job ID in OUTPUT status. This cancels the job if it is running and purges its output from the system
### job<a name="command-job"></a>
Delete a single job by job ID

#### Usage

   zowe zos-jobs delete job <jobid> [options]

#### Positional Arguments

*   `jobid`		 *(string)*

	* The job ID (e.g. JOB00123) of the job. Job ID is a unique identifier for z/OS
batch jobs -- no two jobs on one system can have the same ID. Note: z/OS allows
you to abbreviate the job ID if desired. You can use, for example "J123".

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Delete job with job ID JOB03456.:

* `          $  zowe zos-jobs delete job JOB03456`

# zos-tso | tso<a name="module-zos-tso"></a>
Issue TSO commands and interact with TSO address spaces
## send<a name="module-send"></a>
Send data to TSO and collect responses until the prompt is reached
### address-space<a name="command-address-space"></a>
Send data to the TSO address space, from which you previously started and
received a token (a.k.a 'servlet-key').

#### Usage

   zowe zos-tso send address-space <servletKey> [options]

#### Positional Arguments

*   `servletKey`		 *(string)*

	* The servlet key from a previously started TSO address space.

#### Required Options

*   `--data`  *(string)*

	* The data to which we want to send to the TSO address space represented by the
servlet key.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  "Send the TIME TSO command to the TSO address space
   identified by IBMUSER-329-aafkaaoc":

* `          $  zowe zos-tso send address-space IBMUSER-329-aafkaaoc --data "TIME"`

## start | st<a name="module-start"></a>
Start TSO/E address space
### address-space<a name="command-address-space"></a>
Start a TSO address space, from which you will receive a token (a.k.a
'servelet-key') for further address space interaction (e.g. termination).

#### Usage

   zowe zos-tso start address-space [options]

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

*   `--tso-profile`  | `--tso-p` *(string)*

	* The name of a (tso) profile to load for this command execution.

### Examples

   *-  Start TSO/E address space:

* `          $  zowe zos-tso start address-space `

   *-  Start TSO/E address space, and receive response in JSON
   format:

* `          $  zowe zos-tso start address-space --rfj`

## ping<a name="module-ping"></a>
Ping a TSO address space, from which you previously started and received a token (a.k.a 'servelet-key').
### address-space<a name="command-address-space"></a>
Ping a TSO address space, from which you previously started and received a token
(a.k.a 'servlet-key').

#### Usage

   zowe zos-tso ping address-space <servletKey> [options]

#### Positional Arguments

*   `servletKey`		 *(string)*

	* The servlet key from a previously started TSO address space.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

*   `--tso-profile`  | `--tso-p` *(string)*

	* The name of a (tso) profile to load for this command execution.

### Examples

   *-  Ping the TSO address space identified by
   IBMUSER-329-aafkaaoc:

* `          $  zowe zos-tso ping address-space IBMUSER-329-aafkaaoc`

## stop | sp<a name="module-stop"></a>
Stop TSO/E address space
### address-space<a name="command-address-space"></a>
Stop a TSO address space, from which you previously started and received a token
(a.k.a 'servlet-key').

#### Usage

   zowe zos-tso stop address-space <servletkey> [options]

#### Positional Arguments

*   `servletkey`		 *(string)*

	* The servlet key from a previously started TSO address space.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Stop the TSO address space identified by
   IBMUSER-329-aafkaaoc:

* `          $  zowe zos-tso stop address-space IBMUSER-329-aafkaaoc`

## issue<a name="module-issue"></a>
Issue TSO commands
### command<a name="command-command"></a>
Creates a TSO address space, issues a TSO command through the newly created
address space, waits for the READY prompt to print the response, and terminates
the TSO address space. All response data are returned to the user up to (but not
including) the TSO 'READY' prompt.

#### Usage

   zowe zos-tso issue command <commandText> [options]

#### Positional Arguments

*   `commandText`		 *(string)*

	* The TSO command to issue.

#### Options

*   `--suppress-startup-messages`  | `--ssm` *(boolean)*

	* Suppress console messages from start of address space.

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

*   `--tso-profile`  | `--tso-p` *(string)*

	* The name of a (tso) profile to load for this command execution.

### Examples

   *-  Issue the TSO command "status" to display information about
   jobs for your user ID.:

* `          $  zowe zos-tso issue command "status"`

# zosmf<a name="module-zosmf"></a>
Retrieve and show the properties of a z/OSMF web server
## check<a name="module-check"></a>
Confirm that z/OSMF is running on a specified system and gather information about the z/OSMF server for diagnostic purposes.
### status<a name="command-status"></a>
Confirm that z/OSMF is running on a system specified in your profile and gather
information about the z/OSMF server for diagnostic purposes. The command outputs
properties of the z/OSMF server such as version, hostname, and installed
plug-ins.

#### Usage

   zowe zosmf check status [options]

#### Profile Options

*   `--zosmf-profile`  | `--zosmf-p` *(string)*

	* The name of a (zosmf) profile to load for this command execution.

### Examples

   *-  Report the status of the z/OSMF server that you specified
   in your default z/OSMF profile:

* `          $  zowe zosmf check status `

   *-  Report the status of the z/OSMF server that you specified
   in a supplied z/OSMF profile:

* `          $  zowe zosmf check status --zosmf-profile SomeZosmfProfileName`

