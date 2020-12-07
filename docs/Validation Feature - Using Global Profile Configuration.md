# Using global profile configuration with Zowe CLI <!-- omit in toc -->

**Validation feature:** Global profiles are available in the `@next` version of Zowe CLI. If you already installed the supported version `@zowe-v1-lts`, you must switch versions to try this feature. The functionality will be included in the next major Zowe release, V2.0.0-LTS.

**Table of Contents:**
- [Overview and benefits](#overview-and-feature-benefits)
- [Installing @next version](#installing-next-version)
- [Creating the initial configuration files](#creating-the-initial-configuration-files)
- [Converting existing user profiles](#converting-existing-user-profiles)
- [Managing credential security](#managing-credential-security)
- [Editing configuration](#editing-configuration)
- [Efficiency tips for configuration](#efficiency-tips-for-configuration)
- [Sharing global configuration](#sharing-global-configuration)
- [Example use cases](#example-use-cases)

## Overview and feature benefits

In the LTS version of the CLI, users issue commands from the `zowe profiles` group to create, edit, and manage user profiles. Each profile contains the host, port, username, and password for a specific mainframe service instance. While this approach is effective, users often need to duplicate values across profiles and spend time managing many profiles separately.

The **global profile functionality** simplifies profile management by letting you edit and store mainframe configuration details for all services in one location. You can use a text editor to populate a configuration file with connection details for all of your services.

**Note:** The `profiles` command group is backwards compatible with this version. You can continue to using commands as an alternate method to define your services.

### Benefits

Using global profile configuration can improve your Zowe CLI experience in the following ways:

- As a CLI user, managing your connection details is more convenient when all services are defined in one place.
- As a team leader, you can share a configuration file with your team so that they can easily access mainframe services.
- As a new team member, you can onboard quickly by consuming your team's configuration file.

## Installing @next version

Install the `@next` version of Zowe CLI from the npm registry.

**Follow these steps:**

1. To install Zowe CLI, issue the following command:

   ```
   npm install -g @zowe/cli@next
   ```

2. To install the plug-ins, issue the following command:

    ```
    zowe plugins install @zowe/cics@next @zowe/zos-ftp-for-zowe-cli@next @zowe/ims@next @zowe/mq@next @zowe/db2@next
    ```

   The CLI and plug-ins are installed!

## Updating from @zowe-v1-lts

If you already have @zowe-v1-lts installed, or update to the `@next` version of Zowe CLI from the npm registry.

**Follow these steps:**

1. To update Zowe CLI to `@next`, issue the following command:

   ```
   npm install -g @zowe/cli@next
   ```

2. To update the plug-ins, issue the following command:

```
zowe plugins install @zowe/cics@next @zowe/zos-ftp-for-zowe-cli@next @zowe/ims@next @zowe/mq@next @zowe/db2@next
```

### Changes to secure credential storage

In this version, Secure Credential Store Plug-in is deprecated. The equivalent functionality that encrypts your credentials is now included in the core CLI.

You will be prompted to enter username and password securely by default, and later you can use commands in the `zowe cnfg` command group to manage security for any option value.

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