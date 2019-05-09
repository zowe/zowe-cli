# Contribution Guidelines
This document is a living summary of conventions and best practices for development within Zowe CLI or development of Zowe CLI plug-ins. 

For "must-have" criteria specific to the Zowe Conformance Program, see [CLI Conformance](/docs/cli-conformance.md)]. 

  - [Understanding Packages and Plug-ins](#understanding-packages-and-plug-ins)
  - [Pull Requests](#pull-requests)
  - [Contributing to Core Functionality](#contributing-to-core-functionality)
  - [General Guidelines](#general-guidelines)
  - [Code Guidelines](#code-guidelines)
  - [Programmatic API Guidelines](#programmatic-api-guidelines)
  - [File Naming Guidelines](#file-naming-guidelines)
  - [Command Format Guidelines](#command-format-guidelines)
  - [Versioning Guidelines](#versioning-guidelines)
  - [Testing Guidelines](#testing-guidelines)
  - [Profile Guidelines](#profile-guidelines)
  - [Build Process Guidelines](#build-process-guidelines)
  - [Documentation Guidelines](#documentation-guidelines)
  - [More Information](#more-information)

## Understanding Packages and Plug-ins

**Packages** are individual folders under the `packages` root folder that represent self-contained sets of functionality. For example, `zosjobs` and `zosfiles`. The structure allows packages to be easily pulled out into a separate project if needed, or turned into separately installable `npm` packages.

**Plug-ins** are separately maintained "extensions" to the Zowe CLI.

For more information and guidelines for setting up your project, see [Packages and Plugin Guidelines](./docs/PackagesAndPluginGuidelines.md).

## Contributing to Core Functionality

Determine if the infrastructure enhancement applies to Zowe CLI or Imperative CLI Framework, or if it is best suited as a plug-in to the core.

Zowe CLI is built on [Imperative CLI Framework](https://github.com/zowe/imperative/wiki). Most Zowe CLI core functionality is contained within the framework. Work in, or submit issues to, the Imperative CLI Framework repository when you want to enhance the following core functionalities:  

  - REST client
  - Logging
  - Profiles
  - Command definitions and processing
  - Secure credentials
  - Plug-in management

## Pull Requests

Consider the following when you interact with pull requests:

- Pull request reviewers should be assigned to a same-team member.
- Pull requests should remain open for at least 24 hours, or until close of business next business day (accounting for weekends and holidays).
- Anyone can comment on a pull request to request delay on merging or to get questions answered.

## General Guidelines

The following list describes general conventions for contributing to Zowe CLI:

- Communicate frequently (before pull request) with cross-team member representatives (in informal & small meetings) for new design features.
- Require/import dependencies at the top of a file to identify load failures/missing files as soon as possible.
- Before implementing new functionality, evaluate if existing packages already achieve intended functionality.
- Zowe CLI and plug-ins should be `scoped` under `@zowe`.
- Throw ImperativeError (or perhaps a wrapping of these) instead of throwing Error objects for automatic logging and node-report captures.
- Provide adequate logging to diagnose problems that happen at external customer sites.
- External messages should be defined externally, for localization.
- Avoid using/referencing to `zowe` or `Zowe CLI` within help, source file names, and errors - this name is subject to change. For example use `cli` instead.
- Keep "packages" small and independent without cross dependencies (e.g. `zosjobs` logically should not depend on `zosfiles` package)
  - When a package is dependent on another package, import the through the dependent package's interface (`index.ts`) 
  e.g. `packages/zosjobs/src/GetJobs.ts` will import the `rest` package via:
    ```typescript
       import { ZosmfRestClient } from "../../../rest";
    ```
      NOT via:
    ```typescript
    import { ZosmfRestClient } from   "../../../rest/src/ZosmfRestClient";
     ```
- Make classes small, logical pieces (e.g. instead of 1 `Jobs` class to hold all Job's APIs, we have `GetJobs`, `SubmitJobs`, `DeleteJobs`, etc...)
- Within a package's `src` folder we:
  - Create an `api` folder that will export for programmatic use by other Node apps and by [commands](/docs/CommandFormatStandards.md).
  - Create a `cli` folder that will contain command definitions

## Code Guidelines

Indent code with 4 spaces. This is also documented via `.editorconfig`, which can be used to automatically format the code if you use an [EditorConfig](http://editorconfig.org/) extension for your editor of choice.

Lint rules are enforced through our [build process](#build-process-guidelines).

## Programmatic API Guidelines

The following list describes conventions for contributing to Zowe CLI APIs:

- When developing programmatic asynchronous APIs, return promises instead of using call-backs.
- Use ImperativeExpect to perform minimum parameter validation for API methods (e.g. verify parms exist `ImperativeExpect.toBeDefinedAndNonBlank(prefix, "prefix", "prefix is required");)

## File Naming Guidelines

The following list describes the conventions for naming the source files:

- Class names should match file names (e.g. `class SubmitJobs` would be found in a file `SubmitJobs.ts`). 
- Interface names should match file names and should start with the capital letter `I`, (e.g. `interface ISubmitJobsParms` would be found in `ISubmitJobsParms.ts`).
- Interfaces should be separate files and should be in a `doc` folder (e.g. `../doc/input/ISubmitJobsParms`).

## Command Format Guidelines

For information about naming CLI commands and developing the syntax, see [Command Format Standards](https://github.com/zowe/zowe-cli/blob/conformance/docs/CommandFormatStandards.md).

## Versioning Guidelines 

For information about adhering to our versioning scheme, see [Versioning Guidelines](./docs/MaintainerVersioning.md).

## Testing Guidelines

For information about testing rules and procedures, see [Testing Guidelines](./docs/TESTING.md) and [Plug-in Testing Guidelines](./docs/PluginTESTINGGuidelines.md).

## Profile Guidelines

For information about implementing user profiles, see [Profile Guidelines](./docs/ProfileGuidelines.md).

## Build Process Guidelines

We use [gulp](https://gulpjs.com/) for build tasks, to invoke the linter, generate documentation, and check for circular dependencies 

Use build tasks to enforce rules where possible.

## Documentation Guidelines

Open an issue in the [docs-site repository](https://github.com/zowe/docs-site) if you need assistance with the following tasks:

- For **all contributions**, we recommend that you provide the following:

  - Ensure that the [TPSRs section of documentation](https://zowe.github.io/docs-site/latest/appendix/tpsr.html) lists any third-party software used in your code.   

   - A Release Notes entry in Zowe Docs site to announce your change to end users. 

- When contributing **a plug-in**, we recommend that you provide the following:

  - End-user documentation on the Zowe Doc Site so that users can learn about your plug-in. Use existing plug-in topics as a model.
  
  - A readme.md file within the plug-in repository that contains information for developers (overview, how to build from source, and how to run tests, at minimum). For example, see [the CICS plug-in readme](https://github.com/zowe/zowe-cli-cics-plugin#zowe-cli-plug-in-for-ibm-cics).
  
  - a CONTRIBUTING.md file within the plug-in repository that lists specific considerations for contributing code to your plug-in (if any), and also links to the core CLI contribution guidelines. For an example, see [the CICS plug-in contribution guidelines](https://github.com/zowe/zowe-cli-cics-plugin/blob/master/CONTRIBUTING.md).

- When contributing **code/functionality to the core CLI**, we recommend that you provide the following:
  
  - Documentation for how to use your feature, command, etc... Open an issue in [docs-site repository](https://github.com/zowe/docs-site) if you need assistance.

In addition to external documentation, please thoroughly comment your code for future developers who want to understand, use, and enhance your plug-in/feature.

 ### JS Documentation

- Use jsdoc annotations - [document this](https://marketplace.visualstudio.com/items?itemName=joelday.docthis) makes extensive use of jsdoc tags.
  - Common tags to use, `@static`, `@memberOf`, `@returns`, `@params`, `@class`, `@exports`, `@interface`, `@types`, `@throws`, `@link`
- CLI auto-generated documentation is created via command definitions
- [tsdoc](http://typedoc.org/) is used to generate html documentation

## More Information
| For more information about ... | See: |
| ------------------------------ | ----- |
| General guidelines that apply to contributing to Zowe CLI and Plug-ins | [Contributor Guidelines](./CONTRIBUTING.md) |
| Conventions and best practices for creating packages and plug-ins for Zowe CLI | [Package and Plug-in Guidelines](./docs/PackagesAndPluginGuidelines.md)|
| Guidelines for running tests on Zowe CLI | [Testing Guidelines](./docs/TESTING.md) |
| Guidelines for running tests on the plug-ins that you build| [Plug-in Testing Guidelines](./docs/PluginTESTINGGuidelines.md) |
| Documentation that describes the features of the Imperative CLI Framework | [About Imperative CLI Framework](https://github.com/zowe/imperative/wiki) |
Versioning conventions for Zowe CLI and Plug-ins| [Versioning Guidelines](./docs/MaintainerVersioning.md) |
