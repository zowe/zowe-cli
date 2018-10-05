# Contribution Guidelines
This document is intended to be a living summary of conventions and best practices for development within Zowe CLI or development of Zowe CLI plug-ins. 

## Contents
- [Contribution Guidelines](#contribution-guidelines)
  - [Contents](#contents)
  - [More Resources](#more-resources)
  - [Project Layout](#project-layout)
  - [Packages](#packages)
  - [Plug-ins](#plug-ins)
  - [Code Standards](#code-standards)
  - [Pull Requests](#pull-requests)
  - [Contributing to Zowe CLI Core Functionality](#contributing-to-zowe-cli-core-functionality)
  - [General Conventions](#general-conventions)
  - [Programmatic APIs](#programmatic-apis)
    - [Source File Naming Standards](#source-file-naming-standards)
    - [Testing Guidelines](#testing-guidelines)
    - [Profile Guidelines](#profile-guidelines)
    - [JS Documentation](#js-documentation)
  - [Zowe CLI Conventions](#zowe-cli-conventions)
  - [Build Process](#build-process)

## More Resources
| For more information about ... | See: |
| ------------------------------ | ----- |
| General guidelines that apply to contributing to Zowe CLI and Plug-ins | [Contributor Guidelines](./CONTRIBUTING.md) |
| Conventions and best practices for creating packages and plug-ins for Zowe CLI | [Package and Plug-in Guidelines](./docs/PackagesAndPluginGuidelines.md)|
| Guidelines for running tests on Zowe CLI | [Testing Guidelines](./docs/TESTING.md) |
| Guidelines for running tests on the plug-ins that you build| [Plug-in Testing Guidelines](./docs/PluginTESTINGGuidelines.md) |
| Documentation that describes the features of the Imperative CLI Framework | [About Imperative CLI Framework](https://github.com/zowe/imperative/wiki) |
Versioning conventions for Zowe CLI and Plug-ins| [Versioning Guidelines](./docs/MaintainerVersioning.md) |

## Project Layout
The project root contains the following items:
- A `packages` folder (built in contributions to Zowe CLI)
- A `__tests__` folder for system and integration tests.
- `package.json` (normal for npm modules), but also contains the reference to the imperative configuration module (which defines the CLI)
- A `README.md` for getting started

## Packages
Packages are individual folders under the `packages` root folder that represent self-contained sets of functionality. For example `zosjobs` and `zosfiles`. The structure allows packages to be easily pulled out into a separate project if needed, or turned into separately installable `npm` packages.

For more information, see [Packages and Plugin Guidelines](./docs/PackagesAndPluginGuidelines.md).

## Plug-ins
Plug-ins are separately maintained "extensions" to the Zowe CLI. 

For more information, see [Packages and Plugin Guidelines](./docs/PackagesAndPluginGuidelines.md).

## Code Standards
Lint rules are enforced through our [build process](#build-process).   

Code is indented using 4 spaces. This is also documented via .editorconfig which can be used to automatically format the code if you use an [EditorConfig](http://editorconfig.org/) extension for your editor of choice.


## Pull Requests
- Pull request reviewers should be assigned to a same-team member
- Pull requests should remain open for 24 hours or until close of business next business day (accounting for weekends and holidays)
- Anyone can comment on a pull request to request delay on merging or to get questions answered
- Pull request reviewer should close pull request after 24 hours or by close of business next business day (accounting for weekends and holidays) if no requested changes or requests for delays are indicated

## Contributing to Zowe CLI Core Functionality
The following list summarizes conventions and best practices for contributing core functionality to Zowe CLI. For example, general infrastructure such as utilities, command processing and definition enhancements. 

- Determine if the infrastructure enhancement applies to Zowe CLI or Imperative CLI Framework. 
- Zowe CLI is built on [Imperative CLI Framework](https://github.com/zowe/imperative/wiki). Most Zowe CLI core functionality is contained within the framework. Therefore, send us your recommendations on the Imperative CLI Framework repo when you want to enhance the following core functionalities:  

  - REST client
  - Logging
  - Profiles
  - Command definitions and processing
  - Secure credentials
  - Plug-in management

## General Conventions
The following list describes general conventions for contributing to Zowe CLI:
- Communicate frequently (before pull request) with cross-team member representatives (in informal & small meetings) for new design features.

  Communicate changes back to respective teams.
- Require / import dependencies at the top of a file (for the purpose of identifying load failures / missing files as soon as possible).
- Before implementing new functionality, evaluate packages that may already achieve intended functionality.
- Zowe CLI and its plug-ins should be `scoped` under `@brightside`.
- Throw ImperativeError (or perhaps a wrapping of these) instead of throwing Error objects for automatic logging and node-report captures.
- Provide adequate logging to diagnose problems that happen at external customer sites.
- External messages should be defined externally, for localization.
- Avoid using / referencing to `zowe` or `Zowe CLI` within help, source file names, and errors - this name is subject to change, for example use `core` instead.

## Programmatic APIs
The following list describes conventions for contributing to Zowe CLI APIs:
- When developing programmatic asynchronous APIs, return promises instead of using call-backs
- Use ImperativeExpect to perform minimum parameter validation for API methods (e.g. verify parms exist `ImperativeExpect.toBeDefinedAndNonBlank(prefix, "prefix", "prefix is required");)

### Source File Naming Standards
The following list describes the conventions for naming the source files:

- Class names should match file names (e.g. `class SubmitJobs` would be found in a file `SubmitJobs.ts`)
- Interface names should match file names and should start with the capital letter `I`, (e.g. `interface ISubmitJobsParms` would be found in `ISubmitJobsParms.ts`)
- Interfaces should be separate files and should be in a `doc` folder (e.g. `../doc/input/ISubmitJobsParms`)

### Testing Guidelines

For information about testing rules and procedures, see [Testing Guidelines](./docs/TESTING.md).

### Profile Guidelines

For information setting up and configuring profiles, see [Profile Guidelines](./docs/ProfileGuidelines.md).

### JS Documentation
- Use jsdoc annotations - [document this](https://marketplace.visualstudio.com/items?itemName=joelday.docthis) makes extensive use of jsdoc tags
  - Common tags to use, `@static`, `@memberOf`, `@returns`, `@params`, `@class`, `@exports`, `@interface`, `@types`, `@throws`, `@link`
- CLI auto generated documentation is created via command definitions
- [tsdoc](http://typedoc.org/) is used to generate html documentation

## Zowe CLI Conventions

- Keep "packages" small and independent without cross dependencies (e.g. `zosjobs` logically should not depend on `zosfiles` package)
  - When a package is dependent on another package, import the through the dependent package's interface (`index.ts`) 
  e.g. `packages/zosjobs/src/GetJobs.ts` may will import the `rest` package via via
  ```typescript
  import { ZosmfRestClient } from "../../../rest";
  ```
  NOT via:
  ```typescript
  import { ZosmfRestClient } from "../../../rest/src/ZosmfRestClient";
  ```
- Make classes small, logical pieces (e.g. instead of 1 `Jobs` class to hold all Job's APIs, we have `GetJobs`, `SubmitJobs`, `DeleteJobs`, etc...)
- Within a package's `src` folder we:
  - Create an `api` folder that will export for programmatic use by other Node apps and by [commands](/docs/CommandFormatStandards.md).
  - Create a `cli` folder that will contain command definitions

## Build Process
**TODO:** Do we need this section here? We have some of this covered in the README I think?

We use [gulp](https://gulpjs.com/) for build tasks, and to invoke the linter, generate documentation, and check for circular dependencies 

- Use build tasks to enforce rules where possible (because it's easy to ignore this document)
