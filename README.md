# Zowe CLI  <!-- omit in toc -->

[![codecov](https://codecov.io/gh/zowe/zowe-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/zowe/zowe-cli)
[![OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/projects/7204/badge)](https://bestpractices.coreinfrastructure.org/projects/7204)

Zowe CLI is a command-line interface that lets you interact with the mainframe in a familiar format. Zowe CLI helps to increase overall productivity, reduce the learning curve for developing mainframe applications, and exploit the ease-of-use of off-platform tools. Zowe CLI lets you use common tools such as Integrated Development Environments (IDEs), shell commands, bash scripts, and build tools for mainframe development. Through its ecosystem of plug-ins, you can automate actions on systems such as IBM Db2, IBM CICS, and more. It provides a set of utilities and services that help developers, DevOps engineers, and more become efficient in supporting and building z/OS applications quickly.

This repository also contains the Zowe Node Client SDK. The SDK lets you leverage the underlying APIs to build applications that interface with the mainframe.

<br/>

## Content  <!-- omit in toc -->

 - [Documentation](#documentation)
 - [Contribution guidelines](#contribution-guidelines)
 - [Building Zowe CLI from source](#building-zowe-cli-from-source)
 - [Installing Zowe CLI from source](#installing-zowe-cli-from-source)
 - [Uninstalling Zowe CLI](#uninstalling-zowe-cli)
 - [Configuring Zowe CLI](#configuring-zowe-cli)
 - [Zowe Node Client SDK](#zowe-node-client-sdk)
 - [Running system tests](#running-system-tests)
 - [FAQs](#frequently-asked-questions)
 - [Project structure and governance](#project-structure-and-governance)

<br/>

## Documentation

For information about how to install, configure, and use Zowe CLI, see [Zowe CLI Quick Start](https://docs.zowe.org/stable/getting-started/cli-getting-started/) documentation. For more detailed instructions, see [Zowe CLI](https://docs.zowe.org/stable/user-guide/cli-using-usingcli/) documentation, which also includes examples and tutorials for how to contribute to Zowe CLI and develop CLI plug-ins.

Engineering design documentation is contained in the `docs` directory in this repository. To view the Web Help for all Zowe CLI commands and contributed plug-ins, see the [Zowe CLI Web Help](https://docs.zowe.org/stable/web_help/index.html). To view all locally accessible commands, run `zowe --help-web`. For more use cases and tutorials visit [Medium.com/zowe](https://medium.com/zowe).

<br/>

## Contribution guidelines

The following information is critical to working with the code, running/writing/maintaining automated tests, developing consistent syntax in your plug-in, and ensuring that your plug-in integrates with Zowe CLI properly:

| For more information about | Go to |
| ------------------------------ | ----- |
| General guidelines that apply to contributing to Zowe CLI and Plug-ins | [Contribution guidelines](./CONTRIBUTING.md) |
| Conventions and best practices for creating packages and plug-ins for Zowe CLI | [Package and plug-in guidelines](./docs/PackagesAndPluginGuidelines.md)|
Guidelines for contributing to Zowe SDKs| [SDK guidelines](./docs/SDKGuidelines.md) |
| Guidelines for running tests on Zowe CLI | [Testing guidelines](./docs/TESTING.md) |
| Guidelines for running tests on the plug-ins that you build| [Plug-in testing guidelines](./docs/PluginTESTINGGuidelines.md) |
| Documentation that describes the features of the Imperative CLI Framework | [About Imperative CLI Framework](https://github.com/zowe/imperative/wiki) |
| Naming CLI commands and developing syntax | [Command format standards](./docs/CommandFormatStandards.md) |
Versioning conventions for Zowe CLI and Plug-ins| [Versioning guidelines](./docs/MaintainerVersioning.md) |
| Miscellaneous tips for development | [Development tips](./docs/DevelopmentTips.md)

**Tip:** Visit our [Sample plug-in repository](https://github.com/zowe/zowe-cli-sample-plugin) for example plug-in code. Follow the [developer tutorials](https://docs.zowe.org/stable/extend/extend-cli/cli-devTutorials.html) for more tips.

<br/>

## Building Zowe CLI from source

Zowe CLI requires the NPM version bundled with the active LTS versions of NodeJS and Cargo version 1.72.0 (or newer) to build from source.

Check your NPM version with `npm --version` and if it's older than 8.x, update with `npm install -g npm`.

Check your Cargo version with `cargo --version`. Cargo can be installed using [rustup](https://rustup.rs/). To update Cargo, run the `rustup update` command.

For developers using Linux, the following packages are required to build Zowe CLI from source:

- Debian/Ubuntu: 
  - `sudo apt install build-essential libsecret-1-dev`
- Red Hat-based:
  - `sudo dnf group install "Development Tools"`
  - `sudo dnf install libsecret-devel`
- Arch Linux: 
  - `sudo pacman -S base-devel libsecret`

The first time that you download Zowe CLI from the GitHub repository, issue the following command to install the required Zowe CLI dependencies and several development tools:

```
npm install
```

To build your code changes, issue the following command:

```
npm run build
```

When you update `package.json` to include new dependencies, or when you pull changes that affect `package.json`, issue the following command to download the dependencies:

```
npm update
```

**Tip:** When necessary, run the install command again to update dependencies changed in `package.json`.

<br/>

## Installing Zowe CLI from source

From your copy of this repository, after a build, navigate to the `packages/cli` directory, then install Zowe CLI from source:

```
npm install -g
```

**Notes:**

- Depending on how you configured npm on Linux or Mac, you might need to prefix the `npm install -g` command or the `npm uninstall -g` command with `sudo` to let npm have write access to the installation directory.
- On Windows, the `npm install -g` command might fail several times due to an `EPERM` error. This appears to be a bug that npm documented in their GitHub issues. This behaviour does not appear to be specific to installing the Zowe CLI package. Unfortunately, the only solution that we know of is to issue the `npm cache clean` command and the `npm install -g` command repeatedly until it works.

<br/>

## Uninstalling Zowe CLI

From your local copy of this repository, to uninstall Zowe CLI:

```
npm uninstall --global @zowe/cli
```

<br/>

## Configuring Zowe CLI

Zowe CLI team configuration is made up of different **profiles**. Each profile contains the information that Zowe CLI needs to communicate with the mainframe system, such as credentials and host name.

The most fundamental Zowe CLI profile is a `zosmf` profile, and it is included when Zowe CLI initializes your team configuration. However, you must still add your specific connection information to complete the `zosmf` profile. To do so, update your `~/.zowe/zowe.config.json` configuration file with a text editor or an IDE (such as Visual Studio Code) on your computer.

After you create and/or finalize your profile, confirm that the properties of your profile can connect to and communicate with your mainframe system successfully:

```
zowe zosmf check status
```

For detailed information about creating profiles, or integrating with Zowe API ML, see the documentation in the [Using Zowe CLI](https://docs.zowe.org/stable/user-guide/cli-using-usingcli/) section of Zowe Docs.

**Tip:** When you confirm that your profile connects to and communicates with your mainframe system successfully, issue the same command at any time to verify the availability and status of the z/OSMF subsystem on your mainframe.

<br/>

## Troubleshooting Zowe CLI

If you try to use Zowe CLI functionality and you get an error message that Zowe CLI failed to load any profiles, try issuing the following commands:

- `zowe config report-env` to generate a report on the status of the key areas in your working environment. Address any problems indicated in the report.
- `zowe config edit` to open your `~/.zowe/zowe.config.json` configuration file in your system's default text editor. Fix any properties with incorrect values.
- `zowe config secure` to have Zowe CLI prompt for your secure configuration properties in case your secure values are incorrect in your configuration.

**Note:** For these commands, use the `--global-config` option to update your global configuration or `--user-config` for your user configuration.

## Zowe Node Client SDK

The Zowe Node Client SDK consists of APIs that enable you to build client applications that interface with the mainframe. Use the APIs to build your own client applications or automation scripts, independent of Zowe CLI.

For information about downloading and getting started with the SDK, see the [Zowe Docs](https://docs.zowe.org/stable/user-guide/sdks-using). To view the Zowe Node.js SDK doc, see [Using Zowe SDKs](https://docs.zowe.org/stable/typedoc/index.html).

Alternatively, import Zowe CLI into your project to call the Node APIs. However, importing all of Zowe CLI increases the size of your project. For example, use the following statement to import packages from Zowe CLI:

  ```
  import { <interfaceName> } from @zowe/cli
  ```

  `<interfaceName>`

  - Name of an interface that you populate (i.e. `IIssueParms`), or a function that submits requests (i.e `IssueCommand`)

<br/>

### Example API usage

For example usage syntax, see the README for each API package in this repository:

- [Provisioning](https://github.com/zowe/zowe-cli/tree/master/packages/provisioning): Provision middleware and resources such as IBM CICS, IBM Db2, IBM MQ, and more.
- [z/OS Console](https://github.com/zowe/zowe-cli/tree/master/packages/zosconsole): Perform z/OS console operations.
- [z/OS Data Sets](https://github.com/zowe/zowe-cli/tree/master/packages/zosfiles): Work with data sets on z/OS.
- [z/OS Jobs](https://github.com/zowe/zowe-cli/tree/master/packages/zosjobs): Work with batch jobs on z/OS.
- [z/OS Logs](https://github.com/zowe/zowe-cli/tree/master/packages/zoslogs): Interact with logs on z/OS.
- [z/OS TSO](https://github.com/zowe/zowe-cli/tree/master/packages/zostso): Interact with TSO/E adress spaces on z/OS.
- [z/OS USS](https://github.com/zowe/zowe-cli/tree/master/packages/zosuss): Work with UNIX system services (USS) files on z/OS.
- [z/OS Workflows](https://github.com/zowe/zowe-cli/tree/master/packages/workflows): Create and manage z/OSMF workflows on z/OS.
- [z/OSMF](https://github.com/zowe/zowe-cli/tree/master/packages/zosmf): Return data about z/OSMF, such as connection status or a list of available systems.

<br/>

## Running system tests

In addition to Node.js, you must have a means to execute `.sh` (bash) scripts, which are required for running integration tests.

On Windows, install "Git Bash", which is bundled with the standard [Git](https://git-scm.com/downloads) installation. Select the installation option **Use Git and Unix Tools from Windows Command Prompt**.

After downloading/installing the prerequisites, ensure that you can execute the following commands and receive success responses:

```
1. `node --version`
2. `npm --version`
3. On Windows: `where sh`
```

To run Zowe CLI system tests, you need a configured properties file populated with proper system information.

A dummy properties file is available in the `default_properties.yaml` file in the `__tests__/__resources__/properties` folder. Using this file as a template, you should create a `custom_properties.yaml` file within the same directory. Git is configured to ignore all properties files in the properties folder, except for the `default_properties.yaml` file. If the `custom_properties.yaml` file cannot be found or loaded, an error with relevant details displays when attempting to run tests.

Run the system tests:

```
npm run test:system
```

<br/>

**IMPORTANT!** Do not commit configured properties files to this repository because they contain security principles and other critical information.

<br/>

## Frequently asked questions

### How can I install Zowe CLI as a root user on Mac/Linux?

  - Install the CLI as root so that all users can access the CLI without installing it individually on their user account. As the root user on Mac/Linux, issue the following command:

    ```
    npm i -g @zowe/cli@latest --ignore-scripts
    ```

    **WARNING!** If you use this method, plug-ins that are installed as root can only be accessed as root. Users must install plug-ins on their user account or share all profiles/plugins/settings/logs with root. You also might encounter npm errors if you install as root. We recommend that Linux administrators implement a user/group environment where permissions can be more carefully controlled.

### What is the difference between Zowe V2 and V3?

  - V2 introduces **team profiles** and **deprecates the Secure Credential Store** (SCS) plug-in used in Zowe V1.

    - Connection details can be managed efficiently within one file, promoting a global configuration that can be shared across teams and mainframe services. For more information on how to use profiles, see [Team configurations](https://docs.zowe.org/stable/user-guide/cli-using-using-team-profiles/) in Zowe Docs.
    
    - Secure credential encryption is included in the core CLI.

  - V3 includes the preceding features. Additionally, deprecates support for Zowe V1 profiles.

    - To upgrade from an older Zowe release, see [Migrating from Zowe Vx to Zowe V3](https://docs.zowe.org/stable/whats-new/zowe-v3-migratio3).

<br/>

Don't see what you're looking for? Browse questions from the community or ask your own in the [Q&A section](https://github.com/zowe/zowe-cli/discussions/categories/q-a) of our repo.

## Project structure and governance

Zowe CLI is a component of the Zowe Open Mainframe Project, part of the Linux Foundation.

To learn more about how Zowe is structured and governed, see the [Technical Steering Committee Structure and Governance documentation](https://github.com/zowe/community/blob/master/Technical-Steering-Committee/tsc-governance.md).
