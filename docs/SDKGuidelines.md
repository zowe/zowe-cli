# SDK Guidelines

This document details contributor guidelines for Zowe SDK development.

## Table of Contents
* [Determining Separate Packages](#determining-separate-packages)
    * [Zowe CLI](#zowe-cli)
    * [Zowe CLI Plugins](#zowe-cli-plugins)
* [Package Versioning](#package-versioning)
* [Build Automation](#build-automation)
    * [For each package](#for-each-package)
    * [At top level](#at-top-level)
* [Managing Interdependencies](#managing-interdependencies)

## Determining Separate Packages

There are 3 types of packages:
* CLI - Package that provides a standalone CLI or CLI plugin. Examples:
    * `@zowe/cli` - Core Zowe CLI
    * `@zowe/cics-for-zowe-cli` - CICS CLI plugin
* SDK - Package that provides programmatic APIs which can be used to build client applications (e.g., the CLI package) or scripts that interact with z/OS. Examples:
    * `@zowe/zos-files-for-zowe-sdk` - z/OSMF files APIs
    * `@zowe/zos-jobs-for-zowe-sdk` - z/OSMF jobs APIs
    * `@zowe/cics-for-zowe-sdk` - CICS CMCI APIs
* Utility - Package that provides utility functions which are shared by multiple SDK packages. Examples:
    * `@zowe/core-for-zowe-sdk` - REST client, auth handler, and utility function provider for z/OSMF APIs

### Zowe CLI

The Zowe CLI monorepo contains:
* One CLI package:
    * `@zowe/cli`
* Many SDK packages (one for each command group):
    * `@zowe/zos-console-for-zowe-sdk`
    * `@zowe/zos-files-for-zowe-sdk`
    * `@zowe/zos-jobs-for-zowe-sdk`
    * `@zowe/zosmf-for-zowe-sdk`
    * `@zowe/zos-tso-for-zowe-sdk`
    * `@zowe/zos-uss-for-zowe-sdk`
    * `@zowe/provisioning-for-zowe-sdk`
    * `@zowe/zos-workflows-for-zowe-sdk`
* A utility package (for utility functions shared by the SDK packages above):
    * `@zowe/core-for-zowe-sdk`

### Zowe CLI Plugins

A CLI plugin monorepo should contain only two packages:
* One CLI package (e.g., `@zowe/cics-for-zowe-cli`)
* One SDK package (e.g., `@zowe/cics-for-zowe-sdk`)

## Package Versioning

The following guidelines apply to versioning of SDKs for Zowe CLI and Zowe CLI plugins:
* Fixed versioning scheme is used, meaning that every package published out of the repo should have the same version number.
* When an action to publish all packages is run, packages are skipped if they are binary identical to their last release, and their version numbers do not change. When these packages change in the future, their versions will leap forward to catch up.

The Zowe CLI monorepo uses a fixed rather than independent versioning scheme. We believe it is easier to keep track of version numbers when every package published out of the repo has the same version.

The version number of package X may lag behind package Y, if package X is slower to receive updates. The following timeline shows an example of how this may happen:
* Package X and Package Y are initially released at v1.0
* Package Y receives a patch update to v1.0.1
    * This does not necessitate that Package X’s version changes. Changes in version number for a package should reflect actual changes to code.
* Package X receives a minor update to v1.1.0
    * Again, this does not necessitate that Package Y’s version changes. Its version will remain at v1.0.1.
* Package X and Package Y both receive patch updates and are bumped to v1.1.1

## Build Automation

### For each package

The following NPM scripts should be defined in "package.json" for each SDK package in the monorepo:
* Build
    * Compile TypeScript and perform any other build tasks
    * Example script: `tsc`
* Clean
    * Remove all build output
    * Example script: `rimraf lib`
* Lint
    * Run TSLint or ESLint on the package’s source code
    * Example script: `eslint . --ext .ts`
* Test
    * Run all applicable tests for the package (unit, integration, system)
    * Example script: `jest --coverage`
* Watch
    * Compile TypeScript incrementally (watch for file changes)
    * Example script: `tsc -w`

### At top level

The following guidelines apply to the top-level "package.json" file:
* All the NPM scripts listed above should be defined, using [`lerna run`](https://github.com/lerna/lerna/tree/master/commands/run#lernarun) to run the NPM scripts across all packages (e.g., `lerna run build`, `lerna run --parallel watch`).
* The following line should be included to prevent the top-level package from being accidentally published:
    ```json
    "private": true,
    ```

## Managing Interdependencies

The following guidelines apply to development of Zowe CLI and Zowe CLI plugins:
* Do not use relative imports to require a file from another package in the same monorepo. Each package must be independent. Relative imports within the same package are allowed.
* Include full package names when importing from other packages, even if they are sourced in the same monorepo. Use [`lerna bootstrap`](https://github.com/lerna/lerna/tree/master/commands/bootstrap#lernabootstrap) to symlink together all packages that are dependencies of each other.
* When importing from modules in another package, always import from the top level (e.g., `"@zowe/zos-files-for-zowe-sdk"`). In any package you are creating, ensure that objects which should be publicly accessible to import from your package are exported so they’re accessible at the top level.
* When importing from other modules in the same package, make the imports as specific as possible (e.g., `"./doc/response/IJob"`). This helps to avoid circular dependencies between packages in the monorepo.

Packages may have interdependencies, meaning that they depend on other packages within the same monorepo. For example, these three packages exist at the same level in the Zowe CLI monorepo:

    A. @zowe/cli
    B. @zowe/zos-files-for-zowe-sdk
    C. @zowe/core-for-zowe-sdk

Package A depends on Package B, and Packages A and B both depend on Package C.

In order for each package to be independent, they cannot import from each other using relative paths. A common pattern before Zowe CLI became a monorepo was to import SDK modules in CLI code like this:
```javascript
import { Download } from "../zosfiles/api";
```

Instead of using relative imports, add other packages as dependencies and reference them by their name in import statements. For example, to rewrite the relative import above, declare `@zowe/zos-files-for-zowe-sdk` as a dependency in the "package.json" for `@zowe/cli`, and import from it like this:
```javascript
import { Download } from "@zowe/zos-files-for-zowe-sdk";
```

This works when the `@zowe/cli` package is published, because it has declared the zos-files SDK as a dependency. It also works in a local build, because Lerna creates a symlink to the zos-files SDK in the "node_modules" folder for `@zowe/cli`.
