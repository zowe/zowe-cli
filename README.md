# Zowe CLI  <!-- omit in toc -->

[![codecov](https://codecov.io/gh/zowe/zowe-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/zowe/zowe-cli)

Zowe CLI is a command-line interface that lets application developers interact with the mainframe in a familiar format. Zowe CLI helps to increase overall productivity, reduce the learning curve for developing mainframe applications, and exploit the ease-of-use of off-platform tools. Zowe CLI lets application developers use common tools such as Integrated Development Environments (IDEs), shell commands, bash scripts, and build tools for mainframe development. It provides a set of utilities and services for application developers that want to become efficient in supporting and building z/OS applications quickly.

## Contents  <!-- omit in toc -->
 
 - [Documentation](#documentation)
 - [Contribution Guidelines](#contribution-guidelines)
 - [Build Zowe CLI from Source](#build-zowe-cli-from-source)
 - [Install Zowe CLI from Source](#install-zowe-cli-from-source)
 - [Uninstall Zowe CLI](#uninstall-zowe-cli)
 - [Configure Zowe CLI](#configure-zowe-cli)
 - [Run System Tests](#run-system-tests)
 - [FAQs](#frequently-asked-questions)

## Documentation

For more information about how to install, configure, and use Zowe CLI, see [Zowe CLI Documentation](https://zowe.github.io/docs-site/latest/). The documentation also includes examples and tutorials for how to contribute to Zowe CLI and develop CLI plug-ins.

The `docs` directory in this repository contains auto-generated typescript documentation under the `docs/typedoc` directory. To access the typescript documentation locally, navigate to the local `node_modules` directory that contains the installed package and access the `docs` directory after you install the Zowe CLI package.

**Note:** Some links in the auto-generated typescript documentation are not functional at this time.

## Contribution Guidelines 

The following information is critical to working with the code, running/writing/maintaining automated tests, developing consistent syntax in your plug-in, and ensuring that your plug-in integrates with Zowe CLI properly:

| For more information about ... | See: |
| ------------------------------ | ----- |
| General guidelines that apply to contributing to Zowe CLI and Plug-ins | [Contribution Guidelines](./CONTRIBUTING.md) |
| Conventions and best practices for creating packages and plug-ins for Zowe CLI | [Package and Plug-in Guidelines](./docs/PackagesAndPluginGuidelines.md)|
| Guidelines for running tests on Zowe CLI | [Testing Guidelines](./docs/TESTING.md) |
| Guidelines for running tests on the plug-ins that you build| [Plug-in Testing Guidelines](./docs/PluginTESTINGGuidelines.md) |
| Documentation that describes the features of the Imperative CLI Framework | [About Imperative CLI Framework](https://github.com/zowe/imperative/wiki) |
| Naming CLI commands and developing syntax | [Command Format Standards](./docs/CommandFormatStandards.md) |
| Documentation that describes the features of the Imperative CLI Framework | [About Imperative CLI Framework](https://github.com/zowe/imperative/wiki) |
Versioning conventions for Zowe CLI and Plug-ins| [Versioning Guidelines](./docs/MaintainerVersioning.md) |


**Tip:** Visit our [Sample Plug-in repository](https://github.com/zowe/zowe-cli-sample-plugin) for example plug-in code. You can follow developer tutorials [here](https://zowe.github.io/docs-site/latest/extend/extend-cli/cli-devTutorials.html). 

## Build Zowe CLI from Source
The first time that you download Zowe CLI from the GitHub repository, issue the following command to install the required Zowe CLI dependencies and several development tools:

```
npm install --@zowe:registry=https://registry.npmjs.org --no-package-lock --force
```

**Note:** When necessary, you can run the install command again to update dependencies that were changed in package.json.

If you have credentials to connect to gizaartifactory.jfrog.io, you can issue `npm install` without the `--registry` option. 

**Note:** If you see `npm ERR! code E401` during execution of `npm install` you need to issue `npm login` and provide username, password and email address to connect to gizaartifactory.jfrog.io.
  
  <details><summary>Example of E401 message</summary>
  <p>

  ```
    npm install
    npm ERR! code E401
    npm ERR! 404 401 Unauthorized: js-yaml@3.9.0

    npm ERR! A complete log of this run can be found in:
    npm ERR!     xxxx\npm-cache\_logs\2018-09-20T12_53_07_651Z-debug.log

  ```

  </p>
  </details>

To build your code changes, issue the following command:

```
npm run build
```

When you update `package.json` to include new dependencies, or when you pull changes that affect `package.json`, issue the `npm update` command to download the dependencies.

## Install Zowe CLI from Source
From your copy of this repository, after a build, issue the following command to install Zowe CLI from source:

```
npm install -g
```

<b>Notes:</b>

- Depending on how you configured npm on Linux or Mac, you might need to prefix the `npm install -g` command or the `npm uninstall -g` command with `sudo` to let npm have write access to the installation directory.
- On Windows, the `npm install -g` command might fail several times due to an `EPERM` error. This appears to be a bug that npm documented in their GitHub issues. This behaviour does not appear to be specific to installing the Zowe CLI package. Unfortunately, the only solution that we know of is to issue the `npm cache clean` command and the `npm install -g` command repeatedly until it works.

## Uninstall Zowe CLI
From your local copy of this repository, issue the following command to uninstall Zowe CLI:
```
npm uninstall --global @zowe/cli
```

## Configure Zowe CLI

Zowe CLI configuration is made up of different **profiles**. The profiles contain the information that Zowe CLI needs to communicate with the mainframe system. For example, credentials and z/OSMF host name. If you try to use Zowe CLI functionality and you get an error message that Zowe CLI failed to load any profiles, see the `zowe profiles create --help` command for the group of commands that you are trying to use (if any) to initialize your configuration.

The most fundamental Zowe CLI profile is a `zosmf` profile. Issue the following command to understand how to create a `zosmf` profile in Zowe CLI:

```
zowe profiles create zosmf-profile --help
```

After you create your profile, you can confirm that the properties of your profile can connect to and communicate with your mainframe system successfully by issuing the following command:

```
zowe zosmf check status
```

**Tip:** When you confirm that your profile connects to and communicates with your mainframe system successfully, you can issue the same command at any time to verify the availability and status of the z/OSMF subsystem on your mainframe.

## Run System Tests

In addition to Node.js, you must have a means to execute `.sh` (bash) scripts, which are required for running integration tests. On Windows, you can install "Git Bash" (bundled with the standard [Git](https://git-scm.com/downloads) installation - check "Use Git and Unix Tools from Windows Command Prompt" installation option).

After downloading/installing the prerequisites, ensure that you can execute the following commands and receive success responses:
1. `node --version`
2. `npm --version`
3. On Windows: `where sh`

To run Zowe CLI system tests, you need a configured properties file with proper system information present.

A dummy properties file is present in the `__tests__/__resources__/properties folder`, `default_properties.yaml`. Using this file as a template, you should create a `custom_properties.yaml` file within the same directory. Git is configured to ignore all properties files in the properties folder, except for the `default_properties.yaml` file.

**Important!** Do not check in configured properties files because they contain security principles and other critical information.

You can run the system tests by issuing the following command:
```
npm run test:system
```

If the `custom_properties.yaml` file cannot be found or loaded, an error with relevant details is thrown.

## Frequently Asked Questions

- **How can I install Zowe CLI as a root user on Mac/Linux?**

  You can install the CLI as root so that all users can access the CLI without installing it individually on their user account. As the root user on Mac/Linux, issue the following command: 

  ```npm i -g @zowe/cli@latest --ignore-scripts```

  **Warning!** If you use this method, plug-ins that are installed as root can only be accessed as root. Users must install plug-ins on their user account or share all profiles/plugins/settings/logs with root. You also might encounter npm errors if you install as root. We recommend that Linux administrators implement a user/group environment where permissions can be more carefully controlled.
