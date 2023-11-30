# **Zowe CLI**  <!-- omit in toc -->
[![codecov](https://codecov.io/gh/zowe/zowe-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/zowe/zowe-cli)
[![OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/projects/7204/badge)](https://bestpractices.coreinfrastructure.org/projects/7204)

Zowe CLI is a command-line interface that lets you interact with the mainframe in a familiar format. Zowe CLI helps to increase overall productivity, reduce the learning curve for developing mainframe applications, and exploit the ease-of-use of off-platform tools. Zowe CLI lets you use common tools such as Integrated Development Environments (IDEs), shell commands, bash scripts, and build tools for mainframe development. Through its ecosystem of plug-ins, you can automate actions on systems such as IBM Db2, IBM CICS, and more. It provides a set of utilities and services that help developers, DevOps engineers, and more become efficient in supporting and building z/OS applications quickly.

This repository also contains the Zowe Node Client SDK. The SDK lets you leverage the underlying APIs to build applications that interface with the mainframe.

<br/>

## **Contents**  <!-- omit in toc -->
 - [Documentation](#documentation)
 - [Contribution Guidelines](#contribution-guidelines)
 - [Building Zowe CLI From Source](#building-zowe-cli-from-source)
 - [Installing Zowe CLI From Source](#installing-zowe-cli-from-source)
 - [Uninstalling Zowe CLI](#uninstalling-zowe-cli)
 - [Configuring Zowe CLI](#configuring-zowe-cli)
 - [Zowe Node Client SDK](#zowe-node-client-sdk)
 - [Running System Tests](#running-system-tests)
 - [FAQs](#frequently-asked-questions)
 - [Project Structure and Governance](#project-structure-and-governance)

<br/>

## **Documentation**
For information about how to install, configure, and use Zowe CLI, see [Zowe CLI Quick Start Documentation](https://docs.zowe.org/stable/getting-started/cli-getting-started/). For more detailed instructions, see [Zowe CLI Documentation](https://docs.zowe.org/stable/user-guide/cli-using-usingcli/), which also includes examples and tutorials for how to contribute to Zowe CLI and develop CLI plug-ins.

Engineering design documentation is contained in the 'docs' directory in this repository. To view the Web Help for all Zowe CLI commands and contributed plug-ins, see the [Zowe CLI Web Help](https://docs.zowe.org/stable/web_help/index.html). To view all locally accessible commands, run `zowe --help-web`. For more use cases and tutorials visit [Medium.com/zowe](https://medium.com/zowe).

<br/>

## **Contribution Guidelines**
The following information is critical to working with the code, running/writing/maintaining automated tests, developing consistent syntax in your plug-in, and ensuring that your plug-in integrates with Zowe CLI properly:

| For more information about ... | See: |
| ------------------------------ | ----- |
| General guidelines that apply to contributing to Zowe CLI and Plug-ins | [Contribution Guidelines](./CONTRIBUTING.md) |
| Conventions and best practices for creating packages and plug-ins for Zowe CLI | [Package and Plug-in Guidelines](./docs/PackagesAndPluginGuidelines.md)|
Guidelines for contributing to Zowe SDKs| [SDK Guidelines](./docs/SDKGuidelines.md) |
| Guidelines for running tests on Zowe CLI | [Testing Guidelines](./docs/TESTING.md) |
| Guidelines for running tests on the plug-ins that you build| [Plug-in Testing Guidelines](./docs/PluginTESTINGGuidelines.md) |
| Documentation that describes the features of the Imperative CLI Framework | [About Imperative CLI Framework](https://github.com/zowe/imperative/wiki) |
| Naming CLI commands and developing syntax | [Command Format Standards](./docs/CommandFormatStandards.md) |
Versioning conventions for Zowe CLI and Plug-ins| [Versioning Guidelines](./docs/MaintainerVersioning.md) |
| Miscellaneous tips for development | [Development Tips](./docs/DevelopmentTips.md)

**Tip:** 
- Visit our [Sample Plug-in repository](https://github.com/zowe/zowe-cli-sample-plugin) for example plug-in code. You can follow developer tutorials [here](https://docs.zowe.org/stable/extend/extend-cli/cli-devTutorials.html).

<br/>

## **Building Zowe CLI From Source**
Zowe CLI requires NPM version 8 and Cargo version 1.72.0 (or newer) to build from source. Before proceeding, check your NPM version with `npm --version` and if it's older than 8.x, update with `npm install -g npm`. To check your version of Cargo, run `cargo --version`. Cargo can be installed using rustup: [https://rustup.rs/](https://rustup.rs/). To update Cargo, run the `rustup update` command.

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

**Tip:** 
- When necessary, you can run the install command again to update dependencies changed in `package.json`.

<br/>

## **Installing Zowe CLI From Source**
From your copy of this repository, after a build, navigate to the `packages/cli` directory, then issue the following command to install Zowe CLI from source:

```
npm install -g
```

**Notes:** 
- Depending on how you configured npm on Linux or Mac, you might need to prefix the `npm install -g` command or the `npm uninstall -g` command with `sudo` to let npm have write access to the installation directory.
- On Windows, the `npm install -g` command might fail several times due to an `EPERM` error. This appears to be a bug that npm documented in their GitHub issues. This behaviour does not appear to be specific to installing the Zowe CLI package. Unfortunately, the only solution that we know of is to issue the `npm cache clean` command and the `npm install -g` command repeatedly until it works.

<br/>

## **Uninstalling Zowe CLI**
From your local copy of this repository, issue the following command to uninstall Zowe CLI:

```
npm uninstall --global @zowe/cli
```

<br/>

## **Configuring Zowe CLI**

Zowe CLI configuration is made up of different **profiles**. The profiles contain the information that Zowe CLI needs to communicate with the mainframe system. For example, credentials and z/OSMF host name. If you try to use Zowe CLI functionality and you get an error message that Zowe CLI failed to load any profiles, see the `zowe profiles create --help` command for the group of commands that you are trying to use (if any) to initialize your configuration.

The most fundamental Zowe CLI profile is a `zosmf` profile. Issue the following command to understand how to create a `zosmf` profile in Zowe CLI:

```
zowe profiles create zosmf-profile --help
```

After you create your profile, you can confirm that the properties of your profile can connect to and communicate with your mainframe system successfully by issuing the following command:

```
zowe zosmf check status
```

For detailed information about creating service profiles, creating base profiles, or integrating with Zowe API ML, see [Using Zowe CLI](https://docs.zowe.org/stable/user-guide/cli-using-usingcli/).

**Tip:** 
- When you confirm that your profile connects to and communicates with your mainframe system successfully, you can issue the same command at any time to verify the availability and status of the z/OSMF subsystem on your mainframe.

<br/>

## **Zowe Node Client SDK**

The Zowe Node Client SDK consists of APIs that enable you to build client applications that interface with the mainframe. Use the APIs to build your own client applications or automation scripts, independent of Zowe CLI.

For information about downloading and getting started with the SDK, see the [Zowe Docs](https://docs.zowe.org/stable/user-guide/sdks-using). To view the Zowe Node.js SDK doc, see [Zowe SDK Docs](https://docs.zowe.org/stable/typedoc/index.html).

**Tip:** 
- Alternatively, you can import Zowe CLI into your project to call the Node APIs. However, importing all of Zowe CLI will increase the size of your project. For example, use the following statement to import packages from Zowe CLI:

  ```
  import { <interfaceName> } from @zowe/cli
  ```
    Where `<interfaceName>` is the name of an interface that you populate (i.e. `IIssueParms`) or a function that submits requests (i.e `IssueCommand`).


<br/>

### Example API Usage

For example usage syntax, see the readme for each API package in this repository:

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

## **Running System Tests**

In addition to Node.js, you must have a means to execute `.sh` (bash) scripts, which are required for running integration tests. On Windows, you can install "Git Bash" (bundled with the standard [Git](https://git-scm.com/downloads) installation - check "Use Git and Unix Tools from Windows Command Prompt" installation option).

After downloading/installing the prerequisites, ensure that you can execute the following commands and receive success responses:

```
1. `node --version`
2. `npm --version`
3. On Windows: `where sh`
```

To run Zowe CLI system tests, you need a configured properties file with proper system information present.

A dummy properties file is present in the `__tests__/__resources__/properties folder`, `default_properties.yaml`. Using this file as a template, you should create a `custom_properties.yaml` file within the same directory. Git is configured to ignore all properties files in the properties folder, except for the `default_properties.yaml` file. If the `custom_properties.yaml` file cannot be found or loaded, an error with relevant details will be thrown when attempting to run tests.

You can then run the system tests by issuing the following command:

```
npm run test:system
```

<br/>

**IMPORTANT!** Do not commit configured properties files because they contain security principles and other critical information.

<br/>

## **Frequently Asked Questions**

**How can I install Zowe CLI as a root user on Mac/Linux?**

  - You can install the CLI as root so that all users can access the CLI without installing it individually on their user account. As the root user on Mac/Linux, issue the following command:

    ```
    npm i -g @zowe/cli@latest --ignore-scripts
    ```
    **WARNING!** If you use this method, plug-ins that are installed as root can only be accessed as root. Users must install plug-ins on their user account or share all profiles/plugins/settings/logs with root. You also might encounter npm errors if you install as root. We recommend that Linux administrators implement a user/group environment where permissions can be more carefully controlled.

**What is the difference between V1 and V2?**

  - V2 uses **team profiles** and **deprecates the Secure Credential Store** (SCS) plug-in.

    Connection details can be managed efficiently within one file, promoting a global configuration that can be shared across teams and mainframe services. For more information on how to use profiles, visit [Zowe Docs](https://docs.zowe.org/stable/user-guide/cli-using-using-team-profiles/).
    
    Secure credential encryption is included in the core CLI.

<br/>

Don't see what you're looking for? Browse questions from the community or ask your own in the [Q&A section](https://github.com/zowe/zowe-cli/discussions/categories/q-a) of our repo.

## **Project Structure and Governance**

Zowe CLI is a component of the Zowe Open Mainframe Project, part of the Linux Foundation.

To learn more about how Zowe is structured and governed, see the [Technical Steering Committee Structure and Governance documentation](https://github.com/zowe/community/blob/master/Technical-Steering-Committee/tsc-governance.md).
