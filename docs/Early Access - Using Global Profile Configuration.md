# Using global profile configuration with Zowe CLI <!-- omit in toc -->

**Early access:** Global profiles are available in the `@next` version of Zowe CLI. If you already installed the supported version `@zowe-v1-lts`, you must switch versions to try this feature. The functionality will be included in the next major Zowe release, V2.0.0-LTS.

**Table of Contents:**
- [Feature overview and benefits](#feature-overview-and-benefits)
- [Changes to secure credential storage](#changes-to-secure-credential-storage)
- [Compatible with previous profile functionality](#compatible-with-previous-profile-functionality)
- [Installing @next version](#installing-next-version)
- [Creating the initial configuration files](#creating-the-initial-configuration-files)
- [Converting existing user profiles](#converting-existing-user-profiles)
- [Managing credential security](#managing-credential-security)
- [Editing configuration](#editing-configuration)
- [Efficiency tips for configuration](#efficiency-tips-for-configuration)
- [Sharing global configuration](#sharing-global-configuration)
- [Example use cases](#example-use-cases)

## Feature overview and benefits

In the V1-LTS version of the CLI, users issue commands from the `zowe profiles` group to create, edit, and manage user profiles. Each profile contains the host, port, username, and password for a specific mainframe service instance. While this approach is effective, users often need to duplicate values across profiles and spend time managing many profiles separately.

The **global profile functionality** simplifies profile management by letting you edit, store, and share mainframe configuration details in one location. You can use a text editor to populate configuration files with connection details for your services.

### Benefits

Global profile configuration can improve your Zowe CLI experience in the following ways:

- As a CLI user, managing your connection details is more convenient when all services are defined in one place.
- As a team leader, you can share a configuration file with your team so that they can easily access mainframe services.
- As a new team member, you can onboard quickly by consuming your team's configuration file.
## Changes to secure credential storage

In this version, Secure Credential Store (SCS) Plug-in is deprecated. The equivalent functionality that encrypts your credentials is now included in the core CLI.

In the new configuration, you are prompted to enter username and password securely by default. You can use commands in the `zowe cnfg` command group to manage security for any particular option value.

## Compatible with previous profile functionality

<!-- TODO - We recommend that you become familiar with the new config and stick with it (don't mix and match with user profiles). They don't work nicely between eachother.
The `profiles` command group is still functional in this version, but the information in your user profiles is not automatically available converted in your global config schema. Similarly, if you define a service to global configuration, a profile will not be created -->

## Installing @next version

Install the Zowe CLI `@next` version from the online registry.

**Note:** You can use this procedure to update your currently installed CLI, or to perform a first-time installation.

**Follow these steps:**

1. Ensure that you meet the [software requirements](https://docs.zowe.org/stable/user-guide/systemrequirements.html#zowe-cli-requirements) for Zowe CLI.

2. Issue the following command to install or update the core CLI:

   ```
   npm install -g @zowe/cli@next
   ```

3. Ensure that you meet the [software requirements for each plug-in](https://docs.zowe.org/stable/user-guide/cli-swreqplugins.html#software-requirements-for-zowe-cli-plug-ins).

4. To install or update the Zowe CLI plug-ins, issue the following command:

    ```
    zowe plugins install @zowe/cics@next @zowe/zos-ftp-for-zowe-cli@next @zowe/ims@next @zowe/mq@next @zowe/db2@next
    ```

   The `@next` version of Zowe CLI and plug-ins are installed.

<!-- TODO
5. (Optional) If you had a previous version of the CLI installed prior to installing @next, you can safely remove some unused files there are several unused files in your local `.zowe` directory that you can safely remove.  Clean up unused files `.zowe/settings/imperative.json`  -->

## Creating the initial configuration files

<!-- TODO
How to do your zowe cnfg init

2 config files are produced. What are the 2 config files for - global vs user.

Where are the files located on your PC? .zowe/config/
-->

## Converting existing user profiles

<!-- What if you already had user profiles that you want to convert? Does the config init command handle this for you? Can't recall, ask team. I think it does, but it might duplicate values during the conversion and you'll have optional cleanup to do. -->

## Managing credential security

<!--
After initializing, the user and pass fields are defined to the secure array in global zowe.config.json. Users can define other fields there as well to secure them!.

Zowe cnfg secure command can re-prompt for all secure fields.

zowe cnfg set secure --password would prompt you specifically for password

 -->

## Editing configuration

<!-- How to edit your config files as an individual. Which of the 2 files to edit and for what reasons. -->

## Efficiency tips for configuration

<!-- One could build a global config that works, but is less efficient (you'll have values to change in multiple places). Provide tips on how to set this up efficiently. i.e a global username for all services, --reject-unauthorized, apiml token in base -->

## Sharing global configuration

<!-- How to push global config to a code repository, and how to consume one -->

## Example use cases

<!-- Shall we provide examples here of different use cases and the .json for each? At the least we should give one for z/osmf -->




<!-- Brandon - Other questions for the team:

- Am I missing something about any of these items? I recall them from conversation but not sure if need to discuss here:
  - VSCode snippet templates
  - IntelliSense to easily fill in fields
  - Comments in the JSON file
  - a VSCode settings GUI

- Any other key concepts missing? Something you want to see here?
- Anything misleading in the writing?
- Switching from LTS and back seems like a pain for the user. Can I simplify that procedure in any way without losing important details?
- Same goes for the whole document - is there anything you feel that is too wordy, info is repeated unnecessarily, or should otherwise be removed/reduced?

-->