# Using global profile configuration with Zowe CLI <!-- omit in toc -->

**Early access feature:** Global profiles are available in the `@next` version of Zowe CLI. If you already installed the supported version `@zowe-v1-lts`, switch versions to try this feature. The functionality will be included in the next major Zowe release, V2.0.0-LTS.

**Table of Contents:**
- [Feature overview](#feature-overview)
- [Installing @next version](#installing-next-version)
- [Initializing global configuration](#initializing-global-configuration)
- [Editing configuration](#editing-configuration)
- [Managing credential security](#managing-credential-security)
- [Sharing global configuration](#sharing-global-configuration)
- [Overriding global configuration](#overriding-global-configuration)
- [Example configurations](#example-configurations)

## Feature overview

In the V1-LTS version of the CLI, users issue commands from the `zowe profiles` group to create, edit, and manage user profiles. Each profile contains the host, port, username, and password for a specific mainframe service instance. While that approach is effective, users often need to duplicate values across profiles and spend time managing many profiles separately.

The **global profile functionality** simplifies profile management by letting you edit, store, and share mainframe configuration details in one location. You can use a text editor to populate configuration files with connection details for your mainframe services.

### Benefits

Global profile configuration can improve your Zowe CLI experience in the following ways:

- As a CLI user, you can manage your connection details efficiently in one location.
- As a team leader, you can share a configuration file with your team members so that they can easily access mainframe services.
- As a new team member, you can onboard quickly by consuming your team's configuration file.

### Changes to secure credential storage

In this version, Secure Credential Store (SCS) Plug-in is deprecated. The `zowe scs` and `zowe config` command groups are obsolete. The equivalent functionality that encrypts your credentials is now included in the core CLI.

With the new configuration, the CLI prompts you to enter username and password securely by default. Commands in the new `zowe cnfg` command group let you manage security for any option value.

## Installing @next version

To get started, install the Zowe CLI `@next` version from the online registry. You can follow this procedure for a first-time installation, or to update a currently installed version.

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

5. If you previously had an instance of Zowe CLI installed, your old configuration files are no longer used in this version. Delete the following files from your local `.zowe/` directory:
   - `.zowe/settings/imperative.json`
   - `.zowe/profiles`

   **Important!** Prior to deleting the contents of the `/profiles` directory, take note of any mainframe service details that you need (host, port, etc...). You might want to save the entire `/profiles` directory to another location on your computer so that you can reference or restore the profiles later.

6. If you previously had the Secure Credential Store plug-in installed, uninstall it now to avoid unexpected behavior. Issue the following command:

    ```
    zowe plugins uninstall @zowe/secure-credential-store-for-zowe-cli
    ```

You can now configure the CLI and issue commands.
## Initializing global configuration

To begin, define a connection to z/OSMF and initialize your configuration files. We recommend this method for getting started, but you can choose create the configuration files manually if desired.

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

      Alternatively, you can specify `--user` on your initialization command to generate *only* a user config file. Note that your credentials will be stored in plaintext by default when you use this option.

3. Issue a Zowe CLI command to test that you can access z/OSMF. For example, list all data sets under your user ID:

   ```
   zowe zos-files list data-set "MY.DATASET.*"
   ```

   A list of data sets is returned. You successfully configured Zowe CLI to access a z/OSMF instance!

   If the CLI returns an error message, verify that you have access to the target system. Examine your configuration files in a text editor to verify that the information you entered is correct.

**Important!:** After the configuration files are in place (either via the `zowe cnfg init` command or by manually creating the files), the old `zowe profiles` commands will no longer function. Expect to see errors if you attempt to make use of old profiles.

## Editing configuration

After the initial setup, you can define additional mainframe services to your global or user config.

Open the `/.zowe/settings/config.json` file in a text editor or IDE on your computer. The JSON arrays contain your initial z/OSMF connection details. For example:

<!-- Insert an example here of the json for just a simple z/osmf instance, for a visual -->

From here, you can edit the details as needed and save the file. For example, you might change the password field if your mainframe password changed.

To add a new service, for example add a new instance of z/OSMF that runs on a different mainframe LPAR, you can build on the existing array as follows:

<!-- Insert a JSON example here where a second instance of z/OSMF on a different LPAR is added to config -->

You can continue to add more LPARs, and more services within each LPAR. After you make changes, save the file and issue a Zowe CLI command to the service to verify connection.

## Managing configuration efficiently

There are several methods you can employ to more efficiently update and maintain your configuration.

Zowe CLI uses a "command option order of precedence" that lets your service definitions inherit option values. You can use this to your advantage, because it lets you avoid duplicating the same option value in several places.

The CLI checks for option values in the following order. If not found, the next location is checked:
1. Options you define explicitly on the command-line
2. Environment variables
3. Service array definitions
4. Base array definitions
5. If no value is found, the default value for the option is used.

If you have two services that share the same username and password on the mainframe, you can define your username and password just once in the base array and leave those fields blank in each service definition.

In the following example, the username and password fields for ZOSMF1 and ZOSMF2 are empty to allow them to inherit values from the base array:

<!-- Add JSON example here where 2 zosmf services are inheriting user and pass from base array -->

### Tips for using the base array

The base array is a useful tool for sharing option values between services. You might define options to the base array in the following situations:
- You have multiple services that share the same username, password, or other value.
- You want to store a web token to access all services through Zowe API Mediation Layer.
- You want to trust a known self-signed certificate, or your site does not have server certificates configured. You can define `reject-unauthorized` in the base array with a value of  `false` to apply to all services. Understand the security implications of accepting self-signed certificates at your site before you use this method.

<!-- Any tips or examples you can think of that could be helpful here in this "Managing configuration efficiently" section, besides the base array? -->
## Managing credential security

<!-- This section is in progress, just need to turn the notes into better writing. -->

When you first run the `cnfg init --global` command, you get config where your username and password are set to secure.

You can define other fields in the secure array manually as well to secure them. After initializing, the profiles.base.properties.user and profiles.base.properties.password fields are defined to the secure array in global zowe.config.json. Any option that you define to secure array will become secure/prompted for.

The `zowe cnfg secure` command can re-prompt for all secure fields when you want to update them (such as password change)

The command `zowe cnfg set secure --password` prompts you specifically for password only (substitute whatever option name you want instead of password)

 ## Sharing global configuration

<!-- How to push global config to a code repository, and how to consume config as a member of a project.

I don't know much about this. I assume you'd need to post your config file somewhere in github (or even as simple as sending it in an email) and that other person needs to grab it and place it in their .zowe/settings folder. Then issue commands to test. -->

## Overriding global configuration

<!--
You can edit your user config to explicitly do something different from what's defined in global.

You don't really need to use this. But you can use this if you don't plan to share, or want to override things others have shared.

If you don't use it, it's just a copy of your init config file.
-->

## Example configurations

<!--
Shall we provide a handful of examples here of different use cases and the .json for each? The article covered the basics, how much will people be able to extrapolate from there?
-->


<!--
Questions:

- Am I missing something about any of these items? I recall them from conversation but not sure if need to discuss here:
  - IntelliSense to easily fill in fields
  - Comments in the JSON file
  - a VSCode settings GUI
- Any other key concepts missing, nything misleading, anything else?
-->