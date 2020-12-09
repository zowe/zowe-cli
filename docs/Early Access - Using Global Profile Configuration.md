# Using global profile configuration with Zowe CLI <!-- omit in toc -->

**Early access feature:** Global profiles are available in the `@next` version of Zowe CLI. If you already installed the supported version `@zowe-v1-lts`, switch versions to try this feature. The functionality will be included in the next major Zowe release, V2.0.0-LTS.

**Table of Contents:**
- [Feature overview and benefits](#feature-overview-and-benefits)
- [Installing @next version](#installing-next-version)
- [Initializing your global configuration](#initializing-your-global-configuration)
- [Editing configuration](#editing-your-configuration)
- [Efficiency tips for configuration](#efficiency-tips-for-configuration)
- [Sharing global configuration](#sharing-global-configuration)
- [Managing credential security](#managing-credential-security)
- [Example use cases](#example-use-cases)

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

   - `config.json` - A *global* configuration file. This is the primary location where your MF service connection details such as host, port, etc... are defined.

   - `config.user.json` - An optional, *user-specific* configuration file that can override global configuration. When you initialize configuration with the `--global` option, this file is simply an exact copy of your `config.json` file. Any values that you change here will override the value that is defined in `config.json`.

<!-- TODO - **Note:**
The `profiles` command group is still functional in this version, but the information in your user profiles is not automatically available converted in your global config schema. Similarly, if you define a service to global configuration, a profile will not be created -->

## Editing and overriding configuration

<!-- After you have your files all set up, it's time to POPULATE. Get in there and start adding stuff into the .zowe/config.json and get it how you like it. Then you're ready to test. Try commands and such. Works? good. Doesn't work? Go back and check your work in the json file dude. -->

**Note:**  option to initialize your configuration files. We recommend that you use `--global`, because it securely stores your mainframe credentials by default.

<!-- How to edit your config files as an individual. Which of the 2 files to edit and for what reasons. -->

## Efficiency tips for configuration

<!-- One could build a global config that works, but is less efficient (you'll have values to change in multiple places). Provide tips on how to set this up efficiently. i.e a global username for all services, --reject-unauthorized, apiml token in base -->

## Sharing global configuration

<!-- How to push global config to a code repository, and how to consume one -->
## Managing credential security

<!--
After initializing, the profiles.base.properties.user and profiles.base.properties.password fields are defined to the secure array in global zowe.config.json.

Users can define other fields there manually as well to secure them!.

Zowe cnfg secure command can re-prompt for all secure fields.

zowe cnfg set secure --password would prompt you specifically for password

 -->

## Example configurations

<!-- Shall we provide examples here of different use cases and the .json for each? -->




<!-- Brandon's questions for the team:

- Am I missing something about any of these items? I recall them from conversation but not sure if need to discuss here:
  - IntelliSense to easily fill in fields
  - Comments in the JSON file
  - a VSCode settings GUI

- Any other key concepts missing? Something you want to see here?
- Anything misleading in the writing?
- Switching from LTS and back seems like a pain for the user. Can I simplify that procedure in any way without losing important details?
- Anything else?

-->