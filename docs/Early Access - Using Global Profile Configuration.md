# Using global profile configuration with Zowe CLI <!-- omit in toc -->

**Early access feature:** Global profiles are available in the `@next` version of Zowe CLI. If you already installed the supported version `@zowe-v1-lts`, switch versions to try this feature. The functionality will be included in the next major Zowe release, V2.0.0-LTS.

**Table of Contents:**
- [Feature overview](#feature-overview)
- [Installing @next version](#installing-next-version)
- [Initializing global configuration](#initializing-global-configuration)
- [Editing and overriding configuration](#editing-and-overriding-configuration)
- [Efficiency tips for configuration](#efficiency-tips-for-configuration)
- [Sharing global configuration](#sharing-global-configuration)
- [Managing credential security](#managing-credential-security)
- [Example configurations](#example-configurations)

## Feature overview

In the V1-LTS version of the CLI, users issue commands from the `zowe profiles` group to create, edit, and manage user profiles. Each profile contains the host, port, username, and password for a specific mainframe service instance. While that approach is effective, users often need to duplicate values across profiles and spend time managing many profiles separately.

The **global profile functionality** simplifies profile management by letting you edit, store, and share mainframe configuration details in one location. You can use a text editor to populate configuration files with connection details for your mainframe services services.

### Benefits

Global profile configuration can improve your Zowe CLI experience in the following ways:

- As a CLI user, you can manage your connection details efficiently in one location.
- As a team leader, you can share a configuration file with your team members so that they can easily access mainframe services.
- As a new team member, you can onboard quickly by consuming your team's configuration file.

### Changes to secure credential storage

In this version, Secure Credential Store (SCS) Plug-in is deprecated. The `zowe scs` and `zowe config` command groups are obsolete. The equivalent functionality that encrypts your credentials is now included in the core CLI.

With the new configuration, you are prompted to enter username and password securely by default. Commands in the new `zowe cnfg` command group let you manage security for any option value.

## Installing @next version

To get started, install the Zowe CLI `@next` version from the online registry. You can follow this procedure to update your currently installed version, or to perform a first-time installation.

**Follow these steps:**

1. Meet the [software requirements for Zowe CLI](https://docs.zowe.org/stable/user-guide/systemrequirements.html#zowe-cli-requirements).

2. To install or update the core CLI, open a command-line window and issue the following command:

   ```
   npm install -g @zowe/cli@next
   ```

3. Meet the [software requirements for each plug-in](https://docs.zowe.org/stable/user-guide/cli-swreqplugins.html#software-requirements-for-zowe-cli-plug-ins).

4. To install or update the Zowe CLI plug-ins, issue the following command:

    ```
    zowe plugins install @zowe/cics@next @zowe/zos-ftp-for-zowe-cli@next @zowe/ims@next @zowe/mq@next @zowe/db2@next
    ```

   The `@next` version of Zowe CLI and plug-ins are installed!

5. If you previously had an instance of Zowe CLI installed, your old configuration files are no longer used in this version. Delete the following files:
   - `.zowe/settings/imperative.json`
   - `.zowe/profiles`

   **Important!** Prior to deleting the contents of the `/profiles` directory, take note of any mainframe service details that you need (host, port, etc...). You might want to save the entire `/profiles` directory to another location on your computer so that you can reference or restore the profiles later.

6. If you previously had the Secure Credential Store plug-in installed, uninstall it now to avoid unexpected behavior. Issue the following command:

    ```
    zowe plugins uninstall @zowe/secure-credential-store-for-zowe-cli
    ```

You can now configure the CLI and issue commands.
## Initializing global configuration

Get started by defining a connection to z/OSMF and initializing your configuration files.

**Follow these steps:**

1. Issue the following command:

   ```
   zowe cnfg init --global
   ```

   The CLI provides a series of prompts.

2. Respond to the prompts to enter a service name, username, and password for a mainframe service such as z/OSMF. The `--global` option ensures that your credentials are stored securely on your computer by default.

   After you respond to the prompts, the following two files are added to your local `.zowe/settings` directory:

   - `config.json` - A *global* configuration file. This is the primary location where your MF service connection details such as host, port, etc... are defined. We recommend that you begin by working with this file.

   - `config.user.json` - A *user-specific* configuration file. When you initialize configuration with the `--global` option, this file is created as an exact copy of your `config.json`. Values that you change in this file override the values that defined in `config.json`.

      Alternatively, you can specify `--user` on your initialization command to generate *only* a user config file. Note that your credentials will be stored in plaintext when you use this option.

3. Issue a Zowe CLI command to test that you can access z/OSMF. For example, list all data sets under your user ID:

   ```
   zowe zos-files list data-set "MY.DATASET.*"
   ```

   A list of data sets is returned. You successfully configured Zowe CLI to access a z/OSMF instance!

   If the CLI returns an error message, verify that you have access to the target system. Examine your configuration files in a text editor to verify that the information you entered is correct.

**Note:** The `profiles` command group is still functional in this version, but user profiles *are not* converted to the global config schema automatically. For the most consistent experience, we recommend that you use the new global configuration only.

## Editing configuration

<!--Now you can start doing more advanced things with the config, adding multiple LPARS with multiple services on an LPAR, using the Secure Array, etc...  -->

<!-- Basic editing flow - edit file, issue a command to test, edit file again, etc... -->

<!-- Remember, anything in user config will override global config -->
### Defining a mainframe service

<!-- example of a config that targets zosmf. -->

### Using the secure array

<!-- After initializing, the profiles.base.properties.user and profiles.base.properties.password fields are defined to the secure array in global zowe.config.json.

Zowe cnfg secure command can re-prompt for all secure fields when you want to update them (such as password change)

zowe cnfg set secure --password would prompt you specifically for password only.
 -->
### Using the base array

<!-- describe using this for values that apply to ANY profile. Such as --reject-unauthorized, web token, etc... . Confirm that there is such thing as a base array first, might be confusing this. -->

### Efficiency tips for configuration

<!-- in general, what do you mean by efficiency? Basically not having to enter and maintain values in a bunch of different places -->


<!-- Order of precedence lets you avoid duplicating some values due to inheritance -->

<!--What else? -->
## Sharing global configuration

<!-- How to push global config to a code repository, and how to consume config in a project -->

## Overriding global configuration

<!-- How to set certain values for yourself in your config file, after you've begun to consume global config. -->

## Managing credential security

<!--
when you init --global, you get config where your username and password are set to secure.

Users can define other fields in the secure array manually as well to secure them.

Zowe cnfg secure command can re-prompt for all secure fields.

zowe cnfg set secure --password would prompt you specifically for password

 -->

## Example configurations

<!-- Shall we provide a handful of examples here of different use cases and the .json for each? -->




<!-- Brandon's questions for the team:

- Am I missing something about any of these items? I recall them from conversation but not sure if need to discuss here:
  - IntelliSense to easily fill in fields
  - Comments in the JSON file
  - a VSCode settings GUI

- Any other key concepts missing? Something you want to see here?
- Anything misleading in the writing thus far?
- Switching from LTS and back. Can I simplify that procedure in any way without losing important details?
- Similarly, having the two methods (global profiles vs user profiles) seems confusing since they aren't compatible with eachother. Why not just say "this is the way now, your old profiles go away"
- Anything else?

-->