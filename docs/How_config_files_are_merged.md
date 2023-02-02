# How Zowe CLI team configuration files are merged together

Zowe CLI commands require connection properties and application-specific properties to perform desired operations against various mainframe services. Zowe CLI team configuration profiles are a means to store such properties on disk so that a user does not have to specify every required property on every zowe command. This document describes the behavior of merging configuration profiles when using Zowe CLI team configuration files.

**Table of Contents:**

- [How Zowe CLI team configuration files are merged together](#how-zowe-cli-team-configuration-files-are-merged-together)
  - [General rules for merging profiles from team configuration files](#general-rules-for-merging-profiles-from-team-configuration-files)
    - [**Configuration merging example**](#configuration-merging-example)
  - [Best Practices](#best-practices)
    - [**Advantages of only using a global configuration**](#advantages-of-only-using-a-global-configuration)
    - [**Advantages of only using a project configuration**](#advantages-of-only-using-a-project-configuration)
    - [**Considerations when using both global and project configurations**](#considerations-when-using-both-global-and-project-configurations)
  - [Behavior of configuration files in specific scenarios](#behavior-of-configuration-files-in-specific-scenarios)
    - [**Using a global team config and a global user config**](#using-a-global-team-config-and-a-global-user-config)
    - [**Using a project-level team config and a project-level user config**](#using-a-project-level-team-config-and-a-project-level-user-config)
    - [**Using a global team config and a project-level team config**](#using-a-global-team-config-and-a-project-level-team-config)
    - [**Using a global team config and a project-level user config**](#using-a-global-team-config-and-a-project-level-user-config)
    - [**Using a global user config and a project-level team config**](#using-a-global-user-config-and-a-project-level-team-config)
    - [**Using a global user config and a project-level user config**](#using-a-global-user-config-and-a-project-level-user-config)
    - [**Using all 4 config files at the same time**](#using-all-4-config-files-at-the-same-time)

## General rules for merging profiles from team configuration files

Global configuration files reside in the ZOWE_CLI_HOME directory (which is YourUserHomeDirectory/.zowe by default). Project configuration files are placed in a directory of your choice. Such a project config file is only applied when you run a CLI command in that project directory or one of its subdirectories.

When a team configuration and a user configuration are placed at the same level (both files are in the ZOWE_CLI_HOME directory or both are in the same project directory), the merging of profile properties are done property-by-property. A profile property value in the user config will override a value in the team config file. If a profile property value exists in one config file but not the other, then that value will be also included in the merged set of properties used by a CLI command.

When configuration files (either team or user) exist at both the global level and in a project directory, a profile from a project config completely replaces a profile of the same name from the global config. All profiles that exist in one config file but **NOT** in the other config file are included in the resulting configuration that is used by a CLI command.

Potentially, four configuration files can be in use at once:

- A global team configuration file
- A global user configuration file
- A project directory team configuration file
- A project directory user configuration file

Any combination from one to all four of these configuration files can be used together. When any file is not present, the same rules for merging files in the same directory versus merging a global configuration into a project configuration still apply. When configuration files are merged, none of the configuration files themselves are changed. A logical merged result is simply used by the desired Zowe CLI command.


### **Configuration merging example**

For an example of how profiles are merged, assume that profiles named A, B, C, D, E, and F exist within your configuration files as shown below.

| Profiles in Global Team Config <br/> $ZOWE_CLI_HOME/zowe.config.json |  Profiles in Global User Config <br/> $ZOWE_CLI_HOME/zowe.config.user.json |
| :---------------------- | :----------------------- |
| A - global team         | A - global user          |
| B - global team         | C - global user          |
|                         | D - global user          |


| Profiles in Project Team Config </br> Some/project/dir/zowe.config.json |  Profiles in Project User Config </br> Some/project/dir/zowe.config.user.json |
| :----------------------  | :------------------------ |
| A - project team         | A - project user          |
| C - project team         | C - project user          |
| E - project team         | F - project user          |

The following table shows the order in which the four configuration files will be merged and describes how the profile properties of these configuration files will be merged together to form the configuration used by Zowe CLI commands. Any combination of the four configuration files may exist. This example assumes that all four configuration files exist.


| Merge Step |  Merge Policy | Merge Result |
| :--------- | :------------ |:------------ |
| Global team config is merged with global user config | - When an identically named property exists within an identically named profile in both the global team config and the global user config, the property value from the global user config will be used in the resulting profile. <br/> - When an identically named profile exists in both the global team config and the global user config, but a property of that profile only exists in one of the two configurations, that property will also be included in the resulting profile. <br/> - If a profile exists in only one of these two config files, that profile will be included, in its entirety, in the resulting  configuration | A - Global user config profile properties override properties with the same name from global team profile <br/> B - global team profile is kept in its entirety <br/> C - global user profile is kept in its entirety <br/> D - global user profile is kept in its entirety |
| Results of previous merge is merged with project team config | - When an identically named profile exists in both the results of the previous merge and in the project team config file, that profile will be completely replaced by the profile from the project team config. <br/> - If a profile only exists in the results of the previous merge or in the project team config file, but not both, that profile will also be included, in its entirety, in the resulting configuration | A - project team profile completely replaces A from the previous merge <br/> B - global team config is kept in its entirety <br/> C - project team profile completely replaces C from the previous merge  <br/> D - global user profile is kept in its entirety <br/> E - project team profile is kept in its entirety |
| Results of previous merge is merged with user team config | - When an identically named property exists within an identically named profile in both the results of the previous merge and the project user config, the property value from the project user config will be included in the resulting profile. <br/> - When an identically named profile exists in both the result of the previous merge and the project user config, but a property of that profile only exists in one of the two configurations, that property will also be included in the resulting profile. <br/> - If a profile exists in the results of the previous merge or in the project user config file, but not both, that profile will be included, in its entirety, in the resulting configuration |  A - project user profile properties override properties with the same name from the previous merge <br/> B - global team config is kept in its entirety <br/> C - project user profile properties override properties with the same name from the previous merge  <br/> D - global user profile is kept in its entirety <br/> E - project team profile is kept in its entirety <br/> F - project user profile is kept in its entirety |


## Best Practices

If you choose to use only global configuration files or project-level configuration files it will be easier to remember and find the set of profile properties that will be used by CLI commands. Combining both a global and project configuration works in a consistent fashion, but you must remember that your current directory dictates when one or both configurations apply, and you must remember the different rules that are used when merging between global and project configurations.

### **Advantages of only using a global configuration**

You might choose to use a global configuration file if you typically use the same set of hosts and services for all of your mainframe activities. You will only maintain one Zowe CLI configuration that will be used for CLI commands regardless of the directory in which you are located when you run a zowe command. You can edit your global configuration file in a text editor to make quick temporary changes. For example, you might briefly change the port number of a service to try out a test instance of a given service. Similarly, you could quickly change the default profile for a given profile type with a quick change in your text editor. By doing that, you could perform the same operation against different mainframe hosts with the exact same zowe command, rather than having to specify a different profile name option on each command.

The config file's ability to understand comments (// or /* */) can make such quick edits even easier. You can comment-out several alternatives and then just uncomment the one you want to use, rather than having to remember the correct value and retyping that alternative.

Since a global configuration exists under your HOME directory, it belongs to you personally. Thus, you may not have a great need for a user configuration file in this scenario - all of the values in a global configuration already belong to you. If you want to periodically share your configuration with colleagues, you could choose to place your standard configuration in a normal team configuration file (zowe.config.json) and place your specialty alternatives in your user configuration (zowe.config.user.json). If you receive an ad-hoc request from a colleague for your configuration, you could just send your zowe.config.json file to that person. Thus, you could avoid scrubbing your configuration file before sending it to someone else.

### **Advantages of only using a project configuration**

A project configuration is simply a team configuration file that resides in an arbitrary directory of your choice. Typically, that directory would contain application source code files for one of your projects. That is why we refer to it as a project configuration.

Typically, your application source files are maintained in some source control tool. A zowe configuration file located in that same directory could also be placed into source control. If so, each member of your team who retrieves the application source, will also automatically retrieve the Zowe configuration file from source control. In this scheme every member of your team can easily share the same configuration when working on that particular application project.

If you work on multiple projects, by simply changing your directory into the desired project directory, your Zowe CLI configuration will automatically change to the configuration that is appropriate for that project.

If you have old V1 profiles defined, and only create team configuration files in a project directory, you can quickly switch back and forth between your V1 configuration and your V2 configuration by simply entering and leaving the project directory. Zowe CLI V2 will recognize and use V1 profiles when it cannot find any V2 team configuration file. When you leave the project directory, no V2 config will be detected and Zowe CLI will use the V1 profiles. This approach can be helpful when you are first experimenting with V2 but need to quickly switch back to existing V1 profiles to get some immediate work done. You should only use such a technique during your transition to V2 configuration, since we plan to remove support for V1 profiles in Zowe V3.

Whether you share a global Zowe configuration with teammates in an ad-hoc fashion, or share a project Zowe configuration with teammates through a source control tool; others on your team can easily share the same working Zowe configuration. That is why we generically refer to our Zowe CLI V2 configuration as a `team configuration`.

It is when you are using a Zowe CLI configuration in a project directory that you are most likely to use a user configuration. A user configuration has the same structure as a team configuration (although you typically would only specify a small subset of properties that are specific to your needs.) For example, perhaps you need to debug a special test instance of some service, while the rest of your team might need to use a production instance of that same service. You could place the port number of your special test instance into your user config file. Everyone shares all of the other properties from the project team configuration, but only your user config file will override the port number to point to your test instance. With such a scheme, every user could connect to their own test instance of a service, by each user specifying a unique port number in their own user config file.

While you commit your project team configuration file into your source control tool, you **NEVER** commit your user config file into source control. This is what enables the team to share most properties, but still have a few personal overrides when needed. Many source control tools can exclude specified files from ever being committed to your project. For example, if you use Git source control, you can add the zowe.config.user.json file to your `.gitignore` file.

### **Considerations when using both global and project configurations**

As displayed in the diagram earlier in this document, you can potentially have four Zowe config files in effect at one time (global-team, global-user, project-team, and project-user). Each config file can override some or all properties of other config files. You can encounter unexpected results if you forget which config files you have deployed in which locations.

If you are working in a project directory, you will have a configuration composed of up to all four configuration files. If you change up one directory out of your project directory, your configuration will only be composed of your global configuration files. You may start to communicate to different hosts, on different ports, using different credentials. If you then change into another project directory, all of those things could change again. You must be aware of this dynamic to properly understand what is happening.

If you become confused by connection problems in a such a multiple configuration environment, a few Zowe commands can help identify from where your current property values are obtained.

Placing the `--show-inputs-only` option on a command will display the final merged property values that will be used by the Zowe command to which you add the  `--show-inputs-only` option. You will **NOT** actually run the command. The output can help you identify if the command will not work because you are using an unintended configuration property.

```
zowe zos-files list data-set "SYS1.PARMLIB*" --show-inputs-only
commandValues:
  host:                YourHostname.YourCompany.com
  port:                1234
  user:                YourUserName
  password:            YourPassword
  reject-unauthorized: false
  protocol:            https
  show-inputs-only:    true
profileVersion:   v2
optionalProfiles:
  - zosmf
  - base
locations:
  - T:\proj_config\zowe.config.user.json
  - T:\proj_config\zowe.config.json
  - C:\Users\YourUserName\.zowe\zowe.config.user.json
  - C:\Users\YourUserName\.zowe\zowe.config.json
```

The following command will list the set of configuration files that are in effect for the directory in which you run this command. After running the command, you see how many (and which) files you must inspect to find a property value that you might be inadvertently using.

```
zowe config list --locations --root
T:\proj_config\zowe.config.user.json
T:\proj_config\zowe.config.json
C:\Users\YourUserName\.zowe\zowe.config.user.json
C:\Users\YourUserName\.zowe\zowe.config.json
```

The following command shows every value obtained from every configuration file. With this command you do **NOT** see the resulting values after the configurations are merged. Instead, you see each value from each configuration file. While it requires a detailed inspection of the output, you can find an incorrect property value and know from which configuration file that value came.
```
zowe config list --locations
T:\proj_config\zowe.config.user.json:
  $schema:   ./zowe.schema.json
  profiles:
    YourZosmfProfileName:
      type:       zosmf
      properties:
        host: YourHostname.YourCompany.com
        port: 1234
        user: YourUserName

    ... Many more properties are displayed ...

```
<br/>

## Behavior of configuration files in specific scenarios

Upcoming sections describe the detailed behavior that occurs under specific deployments of configuration files. Before describing each scenario, we identify some general considerations.

The behavior for merging configuration files is the same in Zowe Explorer as with Zowe CLI. However, the following behavior of Zowe Explorer can mislead you into believing that Zowe Explorer merges configuration files differently than the CLI, but the merging behavior is the same in both products.

- A Zowe Explorer behavior that may appear to be a difference in merging, is actually a difference in how Zowe Explorer sets the protocol. If you set the zosmf protocol to "https" in one config file, but override the protocol with "http" in an overriding config file, the CLI will report a `socket hang up` error when the service only accepts https connections. However, Zowe Explorer will successfully perform the operation. This gives the appearance that Zowe Explorer does not override the protocol in the configuration. However, we believe that the configuration merging is fine. We believe that Zowe Explorer hard-codes the use of the "https" protocol, rather than accept the value from the profile configuration.

- When a user name or password is not specified in the configuration, Zowe Explorer will prompt for the user name or password. If the configuration does not specify a default base profile, Zowe Explorer will display the errors below. The CLI runs successfully in such a configuration. To avoid the following errors in Zowe Explorer, the default "base" profile name must have a value. When `autoStore` is false, Zowe Explorer does not even try to save the values for which it prompted, so the base profile itself does not have to exist.
The status of this behavior can be viewed in the GitHub issue [Errors occur with no default base profile #2107](https://github.com/zowe/vscode-extension-for-zowe/issues/2107)

  ```
  Error encountered in checkCurrentProfile.optionalProfiles! TypeError: Cannot read properties of undefined (reading 'name')

  Error running command zowe.ds.pattern: Cannot read properties of undefined (reading 'status'). This is likely caused by the extension that contributes zowe.ds.pattern.
  ```


Another behavior described in the scenarios below is the location where properties are automatically stored. Here are a few configuration set-up choices used to identify the automatic storage behavior of the CLI and Zowe Explorer.

- When connection properties are not supplied, both the CLI and ZE prompt the user for any missing connection properties. When the `autoStore` property is true, both apps automatically store those property values into a zowe configuration file. We identify into which config file the properties are stored.

- In our prompt-related tests used to gather the data for this document, we pre-configured a plain-text password, and placed no user in the configuration. We also set the `autoStore` property to true. Thus, CLI and ZE will prompt for the user property and automatically store the user value into a config file.

- In the prompt-related tests, we only use secure connection properties because no ZE unsecure properties can be used in a test to confirm where prompted values are stored. This is because ZE requires host to exist in a config file, and port and protocol have default values, so a user is not prompted for those properties.

<br/>

### <u>**Using a global team config and a global user config**</u>

| Config Files in use |        |
| :------------------ | :----- |
| Global Team Config  | Yes    |
| Global User Config  | Yes    |
| Project Team Config | -      |
| Project User Config | -      |

This scenario can be created with the following CLI commands.

    zowe config init --global-config
    zowe config init --global-config --user-config

This creates a set of set of empty profiles and empty secure arrays in the user config. In this configuration, the empty properties objects and empty secure arrays in the zosmf and base profiles in the user config are ignored. You do not have to update the user config file for the team config file to successfully run zowe commands.

<br/>

**Merge behavior**
> After you place property values into the same profile in both the global team config and global user config, the user config overrides property values from the team config. This is done on a property-by-property basis. In other words, the user config profile does **NOT** override the **ENTIRE** profile from the team config.

<br/>

**Storage of a secure connection property for which user is prompted**
1. Profile is only in the global team config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the global team config.
   - **CLI**: An existing plain-text password *REMAINS* in plain text in the profile in the global team config.
   - **ZE** : An existing plain-text password is *REMOVED* from the profile in the global team config and
     <br/>
     the password is *ADDED* to the secure array in the profile in the global team config.

<br/>

2. Profile is only in the global user config
   - Same as 1st item, but changes are made to the global user config.

<br/>

3. Profile is in both global team config and global user config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the global user config.
   - When the plain-text password already exists in the profile in the global user config
     - **CLI**: The existing plain-text password in the profile in the global user config *REMAINS* in plain text.
     - **ZE** : The existing plain-text password is *REMOVED* from the profile in the global user config and
       <br/>
       the password is *ADDED* to the secure array in the profile in the global user config.
   - When the plain-text password already exists in *ONLY* the profile in the global team config
     - The existing plain-text password in the profile in the global team config *REMAINS* in plain text.
     - **ZE** : The password is also added to the secure array in the profile in the global user config.

<br/>

### <u>**Using a project-level team config and a project-level user config**</u>

| Config Files in use |        |
| :------------------ | :----- |
| Global Team Config  | -      |
| Global User Config  | -      |
| Project Team Config | Yes    |
| Project User Config | Yes    |

This scenario can be created with the following CLI commands.

    zowe config init
    zowe config init --user-config

This creates a set of set of empty profiles and empty secure arrays in the user config. In this configuration, the empty properties objects and empty secure arrays in the zosmf and base profiles in the user config are ignored. You do not have to update the user config file for the team config file to successfully run zowe commands.

<br/>

**Merge behavior**

All merge behavior in this scenario is the same as when both a team config and user config exist at the global level.

> After you place property values into the same profile in both the project team config and project user config, the user config overrides property values from the team config. This is done on a property-by-property basis. In other words, the user config profile does **NOT** override the **ENTIRE** profile from the team config.

<br/>

**Storage of a secure connection property for which user is prompted**

All storage behaviors in this scenario are the same as when both a team config and user config exist at the global level.

1. Profile is only in the project team config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the project team config.
   - **CLI**: An existing plain-text password *REMAINS* in plain text in the profile in the project team config.
   - **ZE** : An existing plain-text password is *REMOVED* from the profile in the project team config and
     <br/>
     the password is *ADDED* to the secure array in the profile in the project team config.

<br/>

2. Profile is only in the project user config
   - Same as 1st item, but changes are made to the project user config.

<br/>

3. Profile is in both project team config and project user config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the project user config.
   - When the plain-text password already exists in the profile in the project user config
     - **CLI**: An existing plain-text password in the profile in the project user config *REMAINS* in plain text.
     - **ZE** : An existing plain-text password is *REMOVED* from the profile in the project user config and
       <br/>
       the password is *ADDED* to the secure array in the profile in the project user config.
   - When the plain-text password already exists in *ONLY* the profile in the project team config
     - The existing plain-text password in the profile in the project team config *REMAINS* in plain text.
     - **ZE** : The password is also added to the secure array in the profile in the project user config.

<br/>

### <u>**Using a global team config and a project-level team config**</u>

| Config Files in use |        |
| :------------------ | :----- |
| Global Team Config  | Yes    |
| Global User Config  | -      |
| Project Team Config | Yes    |
| Project User Config | -      |

This scenario can be created with the following CLI commands.

    zowe config init --global-config
    zowe config init

<br/>

**Merge behavior**
> After you place property values into profiles in both the global team config and project team config, overrides are done on a per-profile basis (not a per property basis). The profiles in the project team config will completely replace profiles of the same name from the global team config. A profile that exists in one config file but **NOT** in the other config file is recognized and used successfully.

<br/>

**Storage of a secure connection property for which user is prompted**
1. Profile is only in the global team config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the global team config.
   - **CLI**: An existing plain-text password *REMAINS* in plain text in the profile in the global team config.
   - **ZE** : An existing plain-text password is *REMOVED* from the profile in the global team config and
     <br/>
     the password is *ADDED* to the secure array in the profile in the global team config.

<br/>

2. Profile is only in the project team config
   - Same as 1st item, but changes are made to the project team config.

<br/>

3. Profile is in both global team config and project team config
   - Same as 1st item, but changes are made to the project team config.

<br/>

### <u>**Using a global team config and a project-level user config**</u>

| Config Files in use |        |
| :------------------ | :----- |
| Global Team Config  | Yes    |
| Global User Config  | -      |
| Project Team Config | -      |
| Project User Config | Yes    |

This scenario can be created with the following CLI commands.

    zowe config init --global-config
    zowe config init --user-config

In this merge, overrides are done on a per-profile basis (not a per-property basis).
This merging behavior is the same as when team config files exist at both the global and project level. However, due to the creation of empty profiles in a user config, the observed behavior looks different.

The `zowe config init --user-config` command creates a set of empty profiles in the user config. The empty profiles in the user config will completely replace profiles of the same name from a global config. For example, if you want to override the zosmf port, you must create a zosmf profile in the project user config, **AND** delete the empty base config in the project user config so that it does not override the global base profile (which contains host and rejectUnauthorized) with an empty base profile.

<br/>

**Merge behavior**
> After you place property values into profiles in both the global team config and project user config, overrides are done on a per-profile basis. The profiles in the project user config will completely replace profiles of the same name from the global team config. A profile that exists in one config file but **NOT** in the other config file is recognized and used successfully.
<br/><br/>
Once values are placed in both config files, the merging behavior is the same as when team config files exist at both the global and project level.

<br/>

**Storage of a secure connection property for which user is prompted**
1. Profile is only in the global team config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the global team config.
   - **CLI**: An existing plain-text password *REMAINS* in plain text in the profile in the global team config.
   - **ZE** : An existing plain-text password is *REMOVED* from the profile in the global team config and
     <br/>
     the password is *ADDED* to the secure array in the profile in the global team config.

<br/>

2. Profile is only in the project user config
   - Same as 1st item, but changes are made to the project user config.

<br/>

3. Profile is in both global team config and project user config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the project user config.
   - When the plain-text password already exists in the profile in the project user config
     - **CLI**: The existing plain-text password in the profile in the project user config *REMAINS* in plain text.
     - **ZE** : The existing plain-text password is *REMOVED* from the profile in the project user config and
       <br/>
       the password is *ADDED* to the secure array in the profile in the project user config.
   - When the plain-text password already exists in *ONLY* the profile in the global team config
     - You are also prompted for the password.
     - The password is added to the secure array in the profile in the project user config.
     - The existing plain-text password in the profile in the global team config *REMAINS* in plain text.

<br/>

### <u>**Using a global user config and a project-level team config**</u>

| Config Files in use |        |
| :------------------ | :----- |
| Global Team Config  | -      |
| Global User Config  | Yes    |
| Project Team Config | Yes    |
| Project User Config | -      |

This scenario can be created with the following CLI commands.

    zowe config init
    zowe config init --user-config --global-config

In this scenario, your global user config contains profiles with **NO** properties. The profiles in the project-level team config contain values for which you were prompted during the `zowe config init` command. The project team config profiles completely replace profiles of the same name from the global user config. As a result, the behavior will be as if you did not even have a global user config file.

<br/>

**Merge behavior**
> After you place property values into profiles in both the global user config and project team config, overrides are done on a per-profile basis. The profiles in the project team config will completely replace profiles of the same name from the global user config. A profile that exists in one config file but **NOT** in the other config file is recognized and used successfully.
<br/><br/>
> Once values are placed in both config files, the merging behavior is the same as when team config files exist at both the global and project level.

<br/>

**Storage of a secure connection property for which user is prompted**

1. Profile is only in the global user config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the global user config.
   - **CLI**: An existing plain-text password *REMAINS* in plain text in the profile in the global user config.
   - **ZE** : An existing plain-text password is *REMOVED* from the profile in the global user config and
     <br/>
     the password is *ADDED* to the secure array in the profile in the global user config.

<br/>

2. Profile is only in the project team config
   - Same as 1st item, but changes are made to the project team config.

<br/>

3. Profile is in both global user config and project team config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the project team config.
   - When the plain-text password already exists in the profile in the project team config
     - **CLI**: The existing plain-text password in the profile in the project team config *REMAINS* in plain text.
     - **ZE** : The existing plain-text password is *REMOVED* from the profile in the project team config and
       <br/>
       the password is *ADDED* to the secure array in the profile in the project team config.
   - When the plain-text password already exists in *ONLY* the profile in the global user config
     - You are also prompted for the password.
     - The password is added to the secure array in the profile in the project team config.
     - The existing plain-text password in the profile in the global user config *REMAINS* in plain text.


<br/>

### <u>**Using a global user config and a project-level user config**</u>

| Config Files in use |        |
| :------------------ | :----- |
| Global Team Config  | -      |
| Global User Config  | Yes    |
| Project Team Config | -      |
| Project User Config | Yes    |

This scenario can be created with the following CLI commands.

    zowe config init --user-config --global-config
    zowe config init --user-config

The commands above create a set of empty profiles in both user config file. As a result, a user will be prompted for every required connection property that does not have a default value.

<br/>

**Merge behavior**
> Once profile property values are added, overrides are done on a per-profile basis (not a per property basis). The profiles in the project user config will completely replace profiles of the same name from the global user config. A profile that exists in one config file but **NOT** in the other config file is recognized and used successfully.
<br/><br/>
> Once values are placed in both config files, the merging behavior is the same as when team config files exist at both the global and project level.

<br/>

**Storage of a secure connection property for which user is prompted**

1. Profile is only in the global user config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the global user config.
   - **CLI**: An existing plain-text password *REMAINS* in plain text in the profile in the global user config.
   - **ZE** : An existing plain-text password is *REMOVED* from the profile in the global user config and
     <br/>
     the password is *ADDED* to the secure array in the profile in the global user config.

<br/>

2. Profile is only in the project user config
   - Same as 1st item, but changes are made to the project user config.

<br/>

3. Profile is in both global user config and project user config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the project user config.
   - When the plain-text password already exists in the profile in the project user config
     - **CLI**: The existing plain-text password in the profile in the project user config *REMAINS* in plain text.
     - **ZE** : The existing plain-text password is *REMOVED* from the profile in the project user config and
       <br/>
       the password is *ADDED* to the secure array in the profile in the project user config.
   - When the plain-text password already exists in *ONLY* the profile in the global user config
     - The password is added to the secure array in the profile in the project user config.
     - The existing plain-text password in the profile in the global user config *REMAINS* in plain text.

<br/>

### <u>**Using all 4 config files at the same time**</u>

| Config Files in use |        |
| :------------------ | :----- |
| Global Team Config  | Yes    |
| Global User Config  | Yes    |
| Project Team Config | Yes    |
| Project User Config | Yes    |

This scenario can be created with the following CLI commands.

    zowe config init --global-config
    zowe config init --global-config --user-config
    zowe config init
    zowe config init --user-config

In each phase of merging, you apply previously identified merging behavior to each phase, as it occurs.

<br/>

**Merge behavior**
> 1. The global user config overrides the global team config on a per-property basis.
> 2. The project team config overrides the results of step 1 on a per-profile basis.
> 3. The project user config overrides the results of step 2 on a per-property  basis..

<br/>

**Storage of a secure connection property for which user is prompted**

1. Profile is only in the global team config
   - You are prompted for user.
   - The user is added to the secure array in the profile in the global team config.
   - **CLI**: An existing plain-text password *REMAINS* in plain text in the profile in the global team config.
   - **ZE** : An existing plain-text password is *REMOVED* from the profile in the global team config and
     <br/>
     the password is *ADDED* to the secure array in the profile in the global team config.

<br/>

2. Profile is only in the global user config
   - Same as 1st item, but changes are made to the global user config.

<br/>

3. Profile is only in the project team config
   - Same as 1st item, but changes are made to the project team config.

<br/>

4. Profile is only in the project user config
   - Same as 1st item, but changes are made to the project user config.

<br/>

5. Profile is in all 4 configuration files
   - You are prompted for user.
   - The user is added to the secure array in the profile in the project user config.
   - When the plain-text password already exists in the profile in all 4 config files
     - **CLI**: The existing plain-text passwords *REMAIN* in plain text in all 4 config files.
     - **ZE** : The existing plain-text passwords *REMAIN* in plain text in 3 config files.
       <br/>
       The existing plain-text password is *REMOVED* from the profile in the project user config and
       <br/>
       the password is *ADDED* to the secure array in the profile in the project user config.
   - When the plain-text password already exists in *ONLY* the profile in the global team config
     - You are also prompted for password.
     - The password is added to the secure array in the profile in the project user config.
     - The existing plain-text password in the profile in the global team config *REMAINS* in plain text.
   - When the plain-text password already exists in *ONLY* the profile in the global user config
     - You are also prompted for password.
     - The password is added to the secure array in the profile in the project user config.
     - The existing plain-text password in the profile in the global user config *REMAINS* in plain text.
   - When the plain-text password already exists in *ONLY* the profile in the project team config
     - The password is added to the secure array in the profile in the project user config.
     - The existing plain-text password in the profile in the project team config *REMAINS* in plain text.
   - When the plain-text password already exists in *ONLY* the profile in the project user config
     - **CLI**: The existing plain-text password *REMAINS* in plain text in the project user config.
     - **ZE** : The existing plain-text password is *REMOVED* from the profile in the project user config and
       <br/>
       the password is *ADDED* to the secure array in the profile in the project user config.
