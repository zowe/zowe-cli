# Imperative CLI Framework

[![codecov](https://codecov.io/gh/zowe/imperative/branch/master/graph/badge.svg)](https://codecov.io/gh/zowe/imperative)
[![OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/projects/2245/badge)](https://bestpractices.coreinfrastructure.org/projects/2245)

Imperative CLI Framework is a command processing system that lets you quickly build customized command-line interfaces. Focus on adding functionality for your users rather than creating CLI infrastructure. We provide you with all the tools to get started building your own CLI plug-ins.

## Software Requirements

- [**Install Node.js package manager**](https://nodejs.org/en/download/package-manager) on your computer. Node.js® is a JavaScript runtime environment on which we architected Imperative CLI Framework.

- You must have a means to execute ".sh" (bash) scripts to run integration tests. On Windows, you can install "Git Bash", which is bundled with the standard [Git](https://git-scm.com/downloads) installation - (choose the "Use Git and Unix Tools from Windows Command Prompt" installation option). When you run the integration tests on Windows, you must have Administrative authority to enable the integration tests to create symbolic links.

**Note:** Broadcom Inc. does not maintain the prerequisite software that Imperative CLI Framework requires. You are responsible for updating Node.js and other prerequisites on your computer. We recommend that you update Node.js regularly to the latest Long Term Support (LTS) version.

## Install Imperative as a Dependency

Issue the following commands to install Imperative CLI Framework as a dependency.

- **Install `@latest` version:**

    Be aware that if you update via `@latest`, you accept breaking changes into your project.

    ``` bash
    npm install @zowe/imperative
    ```

- **Install `@zowe-v2-lts` version:**

    This is a Long Term Support release that is guaranteed to have no breaking changes.

    ``` bash
    npm install @zowe/imperative@zowe-v2-lts
    ```

**Note:** If you want to install the bleeding edge version of Imperative, you can append `--@zowe:registry=https://zowe.jfrog.io/zowe/api/npm/npm-release/` to the install command to get it from a staging registry. It is not recommended to use this registry for production dependencies.

### Build and Install Imperative CLI Framework from Source
To build and install the Imperative CLI Framework, follow these steps:

1. Clone the `zowe/imperative` project to your PC.
2. From the command line, issue `cd [relative path]/imperative`
3. Issue `npm install`
4. Issue `npm run build`
5. Issue `npm run test`

To build the entire project (including test stand-alone CLIs):
`npm run build`

To build only imperative source:
`npm run build:packages`

### Run Tests
Command | Description
--- | ---
`npm run test` | Run all automated tests (unit & integration)
`npm test:unit` | Run unit tests
`npm test:integration` | Run integration tests
`npm test:system` | Run system tests (requires IPv6 connection)

**Note:** To build and install the test CLIs used by the integration tests:
1. `node scripts/sampleCliTool.js build`
2. `node scripts/sampleCliTool.js install`

### Sample Applications

We provide a sample plug-in that you can use to get started developing your own plug-ins. See the [Zowe CLI Sample Plug-in](https://github.com/zowe/zowe-cli-sample-plugin).

## Documentation
We provide documentation that describes how to define commands, work with user profiles, and more! For more information, see the [Imperative CLI Framework wiki](https://github.com/zowe/imperative/wiki).

## Contribute
For information about how you can contribute code to Imperative CLI Framework, see [CONTRIBUTING](CONTRIBUTING.md).

## Submit an Issue
To report a bug or request an enhancement, please [submit an issue](https://github.com/zowe/imperative/issues/new/choose).

## Versioning
Imperative CLI Framework uses Semantic Versioning (SemVer) for versioning. For more information, see the [Semantic Versioning](https://semver.org/) website.

## Licensing Imperative CLI Framework
For Imperative CLI Framework licensing rules, requirements, and guidelines, see [LICENSE](LICENSE).
