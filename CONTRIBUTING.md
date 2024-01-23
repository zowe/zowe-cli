# Contribution Guidelines
This document is a living summary of conventions and best practices for development within Zowe CLI or development of Zowe CLI plug-ins.

  - [SIGN ALL OF YOUR GIT COMMITS](#sign-all-of-your-git-commits)
  - [Understanding Packages and Plug-ins](#understanding-packages-and-plug-ins)
  - [Pull Requests](#pull-requests)
  - [Contributing to Core Functionality](#contributing-to-core-functionality)
  - [General Guidelines](#general-guidelines)
  - [Changelog Update Guidelines](#changelog-update-guidelines)
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

## SIGN ALL OF YOUR GIT COMMITS

Whenever you make a commit, it is required to be signed. If you do not, you will have to re-write the git history to get all commits signed before they can be merged, which can be quite a pain.

Use the "-s" or "--signoff" flags to sign a commit.

Example calls:
* `git commit -s -m "Adding a test file to new_branch"`
* `git commit --signoff -m "Adding a test file to new_branch"`

Why? Sign-off is a line at the end of the commit message which certifies who is the author of the commit. Its main purpose is to improve tracking of who did what, especially with patches.

Example commit in git history:

```
Add tests for the payment processor.

Signed-off-by: Humpty Dumpty <humpty.dumpty@example.com>
```

What to do if you forget to sign off on a commit?

To sign old commits: `git rebase --exec 'git commit --amend --no-edit --signoff' -i <commit-hash>`

where commit hash is one before your first commit in history

If you forget to signoff on a commit, you'll likely receive the following message:

"Commit message must be signed off with your user name and email.
To sign off your commit, add the -s flag to the git commit command."

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

## Changelog Update Guidelines

Add an entry to changelog.md for any PR that introduces a feature, enhancement, or fix that affects end users. Changes to certain files, such as the Jenkinsfile, do not require a changelog update. The changelogs are compiled into Zowe Docs [Release Notes](https://docs.zowe.org/stable/getting-started/summaryofchanges.html) periodically.

**Each changelog entry must:**
- Describe the change and how it impacts end users.
- Include a relevant Issue # or Pull Request #.
- Include one of the following prefixes:
  - `BugFix` - If a fix was added
  - `Enhancement` - If a feature or enhancement was introduced
  - For breaking changes (only allowed for PRs merged into the "next" branch):
    - `LTS Breaking` - If behavior has changed since the last LTS release
    - `Next Breaking` - If behavior has changed since an earlier vNext prerelease

The following is an example of the markdown that you should insert into the changelog above the last-released version:

```
## Recent Changes

- BugFix: Describe the bug fix here. [Issue# or PR#](link-to-issue-or-pr)
- Enhancement: Describe the enhancement here. [Issue# or PR#](link-to-issue-or-pr)
```

**Tips:**
- Start the sentence with a verb in past tense. For example "Added...", "Improved...", "Enhanced...".
- Write from a user's perspective. Document why the change matters to the end user (what this feature allows them to do now). For example, "Added the validate-only mode of Zowe. This lets you check whether all the component validation checks of the Zowe installation pass without starting any of the components.".
- Use second person "you" instead of "users".

## Code Guidelines

Indent code with 4 spaces. This is also documented via `.editorconfig`, which can be used to automatically format the code if you use an [EditorConfig](https://editorconfig.org/) extension for your editor of choice.

Lint rules are enforced through our [build process](#build-process-guidelines).

## Programmatic API Guidelines

The following list describes conventions for contributing to Zowe CLI APIs:

- When developing programmatic asynchronous APIs, return promises instead of using call-backs.
- Use ImperativeExpect to perform minimum parameter validation for API methods (e.g. verify parms exist `ImperativeExpect.toBeDefinedAndNonBlank(prefix, "prefix", "prefix is required");)
- Include trace messages.
- Support backward compatibility throughout releases.
- Provide a `Common` version API call that accepts:
  - Connection information, when applicable.
  - Parm objects that can be extended in the future while maintaining forward and backward compatibility.
- Include *convenience methods* that aid in calling `Common` methods, when appropriate.
- Should be categorized in classes that identify theirs actions. For example, `GetJobs.getJobStatus` or `SubmitJobs.submitJcl`.

Programmatic APIs should also adhere to the following standards and conventions:
- [Code Standards](#code-guidelines)
- [General Conventions](#general-guidelines)
- [Source File Naming Standards](#file-naming-guidelines)
- [Testing Guidelines](./docs/TESTING.md)
- [JS Documentation](#js-documentation)

## File Naming Guidelines

The following list describes the conventions for naming the source files:

- Class names should match file names (e.g. `class SubmitJobs` would be found in a file `SubmitJobs.ts`).
- Interface names should match file names and should start with the capital letter `I`, (e.g. `interface ISubmitJobsParms` would be found in `ISubmitJobsParms.ts`).
- Interfaces should be separate files and should be in a `doc` folder (e.g. `../doc/input/ISubmitJobsParms`).

## Command Format Guidelines

For information about naming CLI commands and developing the syntax, see [Command Format Standards](https://github.com/zowe/zowe-cli/blob/master/docs/CommandFormatStandards.md).

## Versioning Guidelines

For information about adhering to our versioning scheme, see [Versioning Guidelines](./docs/MaintainerVersioning.md).

## Testing Guidelines

For information about testing rules and procedures, see [Testing Guidelines](./docs/TESTING.md) and [Plug-in Testing Guidelines](./docs/PluginTESTINGGuidelines.md).

## Profile Guidelines

For information about implementing user profiles, see [Profile Guidelines](./docs/ProfileGuidelines.md).

## Build Process Guidelines

Use build tasks to enforce rules where possible.

## Documentation Guidelines

Open an issue in the [docs-site repository](https://github.com/zowe/docs-site) if you need assistance with the following tasks:

- For **all contributions**, we recommend that you provide the following:

  - Ensure that the TPSRs section of documentation lists any third-party software used in your code. See the [TPSRs for each Zowe release](https://github.com/zowe/docs-site/tree/master/tpsr) on the docs-site repository.

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
  - Common tags to use, `@static`, `@memberof`, `@returns`, `@params`, `@class`, `@exports`, `@interface`, `@types`, `@throws`, `@link`
- CLI auto-generated documentation is created via command definitions
- [tsdoc](https://typedoc.org/) is used to generate html documentation

## More Information
| For more information about ... | See: |
| ------------------------------ | ----- |
| Conventions and best practices for creating packages and plug-ins for Zowe CLI | [Package and Plug-in Guidelines](./docs/PackagesAndPluginGuidelines.md)|
| Guidelines for running tests on Zowe CLI | [Testing Guidelines](./docs/TESTING.md) |
| Guidelines for running tests on the plug-ins that you build| [Plug-in Testing Guidelines](./docs/PluginTESTINGGuidelines.md) |
Versioning conventions for Zowe CLI and Plug-ins| [Versioning Guidelines](./docs/MaintainerVersioning.md) |
| Naming CLI commands and developing syntax | [Command Format Standards](https://github.com/zowe/zowe-cli/blob/master/docs/CommandFormatStandards.md) |
| Documentation that describes the features of the Imperative CLI Framework | [About Imperative CLI Framework](https://github.com/zowe/imperative/wiki) |
