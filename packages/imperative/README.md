# Imperative CLI Framework

[![codecov](https://codecov.io/gh/zowe/imperative/branch/master/graph/badge.svg)](https://codecov.io/gh/zowe/imperative)

Imperative CLI Framework is a command processing system that lets you quickly build customized command-line interfaces. Focus on adding functionality for your users rather than creating CLI infrastructure. We provide you with all the tools to get started building your own CLI plug-ins.

## Software Requirements

- [**Install Node.js package manager**](https://nodejs.org/en/download/package-manager) on your computer. Node.js® is a JavaScript runtime environment on which we architected Imperative CLI Framework.

- To build this project from source, you must have Python 2.7 and a C++ Compiler installed (both are required by a dependency named `node-gyp`). To obtain the required software, follow the [instructions in the node-gyp readme](https://github.com/nodejs/node-gyp#installation) specific to your OS. 

- You must have a means to execute ".sh" (bash) scripts to run integration tests. On Windows, you can install "Git Bash", which is bundled with the standard [Git](https://git-scm.com/downloads) installation - (choose the "Use Git and Unix Tools from Windows Command Prompt" installation option). When you run the integration tests on Windows, you must have Administrative authority to enable the integration tests to create symbolic links.

**Note:** Broadcom Inc. does not maintain the prerequisite software that Imperative CLI Framework requires. You are responsible for updating Node.js and other prerequisites on your computer. We recommend that you update Node.js regularly to the latest Long Term Support (LTS) version.

## Install Imperative as a Dependency

Issue the following commands to install Imperative CLI Framework as a dependency. Note that the registry URL differs between versions of Imperative CLI Framework.

- **Install `@latest` version:**

    Be aware that if you update via `@latest`, you accept breaking changes into your project.

    ``` bash
    npm install --@zowe:registry=https://registry.npmjs.org --no-package-lock --force
    npm install --save @zowe/imperative
    ```

- **Install `@lts-incremental` version:**

    ``` bash
    npm install --@zowe:registry=https://registry.npmjs.org --no-package-lock --force
    npm install --save @zowe/imperative@lts-incremental
    ```


### Build and Install Imperative CLI Framework from Source
To build and install the Imperative CLI Framework, follow these steps:

1. Install node-gyp. node-gyp is a tool that you use to build Node.js native addons. For more information, see the node-gyp installation instructions at https://github.com/nodejs/node-gyp.
**Note:** You can skip to the next step if you installed node-gyp previously.
1. Clone the `zowe/imperative` project to your PC.
2. From the command line, issue `cd [relative path]/imperative`
3. Issue `npm install`
4. Issue `npm run build`
5. Issue `npm run test`

To build the entire project (including test stand-alone CLIs):
`npm run build`

To build only imperative source:
`gulp build`

### Run Tests
Command | Description
--- | ---
`npm run test` | Run all tests (unit & integration)
`npm test:integration` | Run integration tests
`npm test:unit` | Run unit tests

**Note:** To run the integration tests via gulp, install all dependencies for test CLIs, build all test CLIs, & install all sample CLIs globally using the following sequence:
1. `gulp build:install-all-cli-dependencies`
2. `gulp build:all-clis`
3. `gulp test:installSampleClis`

 **Note:** For more information about the tasks (details and descriptions), issue the following gulp command:
 `gulp --tasks`

### Sample Applications

We provide a sample plug-in that you can use to get started developing your own plug-ins. See the [Zowe CLI Sample Plug-in](https://github.com/zowe/zowe-cli-sample-plugin).

## Documentation
We provide documentation that describes how to define commands, work with user profiles, and more! For more information, see the [Imperative CLI Framework wiki](https://github.com/zowe/imperative/wiki).

## Contribute
For information about how you can contribute code to Imperative CLI Framework, see [CONTRIBUTING](CONTRIBUTING.md)

## Versioning
Imperative CLI Framework uses Semantic Versioning (SemVer) for versioning. For more information, see the [Semantic Versioning](https://semver.org/) website.

## Licencing Imperative CLI Framework
For Imperative CLI Framework licensing rules, requirements, and guidelines, see [LICENSE](LICENSE).
