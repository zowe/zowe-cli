# Package and Plug-in Guidelines
This document is a living summary of conventions for developing packages and plug-ins for Zowe CLI. Packages are contributions bundled directly with the base Zowe CLI. They are the core set of commands and API functionality. Plug-ins are similar to packages, however, you create and maintain plug-ins outside of the Zowe CLI code base and install them using the plug-in manager.

Plug-ins should use the [Zowe CLI Plug-in Starter Project](https://github.com/zowe/zowe-cli-sample-plugin) as a code base.

- [Plug-in Repositories](#plug-in-repositories)
- [Directories](#directories)
- [Directory Structure](#directory-structure)
- [Programmatic APIs](#programmatic-apis)
- [Commands](#commands)
- [Profiles](#profiles)

## Plug-in Repositories

Name plug-in repositories according to the Zowe CLI `[group]` name. For example, the `cics` plug-in repository name is `/zowe-cli-cics-plugin`.

**Note:** See [Command Format Standards](CommandFormatStandards.md) for details about `[group]`.

## Directories

The following directories and files are required in packages and plug-ins:

- `src/` for source code
- `src/cli/` contains command definitions and handlers
  - Create your `[group]` definition within this directory.
  - Do NOT place additional `.definition` files in this directory. 
- A `README.md` for instructions about building, testing, etc... For more information, see [Documentation Guidelines](../CONTRIBUTING.md#documentation-guidelines).
- An `index.ts` for exports from your package or plug-in.

### Package Directories

In addition to the requirements described in [Directories](#directories), **packages** require the following directories and files:
- A `packages` folder (built in contributions to Zowe CLI)
- `__tests__` directory for test code. Each package has a `__tests__` directory.
  - `__tests__` contains the unit tests (the structure maps exactly to the `src/` directory structure - this is a requirement for Jest and manual mocking).
  - `__tests__/__system__` for system tests (See [System Test Layout](TESTING.md#system-test-layout) for more details)
- The imperative configuration document has a command module glob that will automatically recognize a file in this directory (`"**/cli/*.definition!(.d).*s"`)


### Plug-in Directories
In addition to the requirements that are described in [Directories](#directories), **plug-ins** require the following directories and files:

- `package.json`

## Directory Structure
When introducing a new **package** to bundle with base Zowe CLI, you create a directory (using the `[group]` name) under the projects `packages/` directory. 

**TODO:** - Verify the following...
For plug-ins, this is handled automatically based on the name of your plug-in.

### Example Package Structure
The following diagram illustrates the package directory structure:

```
packages
└── mypackage
    ├── src
    |   ├── api 
    |   └── cli
    ├── __tests__
    |   ├── cli 
    |   ├── api
    |   └── __system__
    |       ├── api 
    |       └── cli
    └── index.ts
    └── README.md
```

### Example Plug-in Structure
The following diagram illustrates the plug-in directory structure

```
<root>
├── src
|   ├── api 
|   ├── cli
|   └── index.ts
├── __tests__
|   ├── api
|   ├── cli
|   └── __system__
|       ├── api 
|       └── cli
├── CONTRIBUTING.md
├── README.md
└── package.json
```

## Commands
Packages and plug-ins will always introduce a new command `[group]` to the Zowe CLI. The command `[group]` is the first term you type into the command line after zowe (e.g., `zowe cics`). 

**Note:** For more information Zowe CLI commands best practices including command structure, naming, shortcuts, examples, options, and descriptions in Zowe CLI and plug-ins see [Command Guidelines](CommandFormatStandards.md).

Using the command structure conventions, you create a directory structure that follows the following example:

**Example Layout:**
```
cli
├── action1
│   ├── object1 
│   |   ├──Object1.handler.ts
|   |   └──Object1.definition.ts
|   └── Action2.definition.ts
├── action2
│   ├── object1 
│   |   ├──Object1.handler.ts
|   |   └──Object1.definition.ts
|   └── Action2.definition.ts
└── Group.definition.ts
```

## Profiles 
Define profile types on the base imperative configuration document (found in the root `imperative/` directory). Packages and plug-ins can define their own profile type, or, they can take advantage of a previously defined profile type. For example, the `zos-files` and `zos-console` share a `zosmf` profile because both profile types use z/OSMF APIs.

For more information, see [Profile Guidelines](ProfileGuidelines.md).
