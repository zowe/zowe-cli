# Package and Plug-in Guidelines
This document is intended to be a living summary document of conventions and best practices for creating packages and plug-ins for Zowe CLI.

Packages are contributions bundled directly with the base Zowe CLI. It is the core set of commands and API functionality. 

Plug-ins are essentially identical to packages. However, you create and maintain plug-ins outside of the Zowe CLI code base and install them using the plug-in manager.

Plug-ins should use the [Zowe CLI Plug-in Starter Project](https://github.com/zowe/zowe-cli-sample-plugin) as a code base.

## Contents
- [Plug-in Repositories](#plug-in-repositories)
- [Directories](#directories)
- [Directory Structure](#directory-structure)
- [Programmatic APIs](#programmatic-apis)
- [Commands](#commands)
- [CLI Directory and File Structure](#cli-directory-and-file-structure)
- [Profiles](#profiles)

## Plug-in Repositories

Name plug-in repositories according to the `[group]` name , where `[group]` is your Zowe CLI `[group]` name. 

**Note:** For more information, see [Command Format Standards](CommandFormatStandards.md) for details on `[group]`.

For example, the `endevor` plug-in repository name is `endevor`.

## Directories
Packages and plug-ins require the following directories and files:

- `src/` for source code
- `src/cli/` contains your command definitions and handlers
  - Create your `[group]` definition within this directory.
  - Do NOT place additional `.definition` files in this directory. 
      
      **Note:** For more information,see [CLI Directory and File Structure](#cli-directory-and-file-structure). 
- A `README.md` for instructions on building, testing, packaging, etc.
  - TODO: README Guidelines
- An `index.ts` for exports from your package or plug-in.

### Package Directories

In addition to the requirements that are described in [Directories](#directories), packages require the following directories and files:
- `__tests__` directory for test code. Each package has a `__tests__` directory.
  - `__tests__` contains the unit tests (the structure maps exactly to the `src/` directory structure - this is a requirement for Jest and manual mocking).
  - `__tests__/__system__` for system tests (See [System Test Layout](TESTING.md#system-test-layout) for more details)
- The imperative configuration document has a command module glob that will automatically recognize a file in this directory (`"**/cli/*.definition!(.d).*s"`)

### Plug-in Directories
In addition to the requirements that are described in [Directories](#directories), packages plug-ins require the following directories and files:

- `package.json`

## Directory Structure
When introducing a new **package** to bundle with base Zowe CLI, you create a directory (using the `[group]` name) under the projects `packages/` directory. 

**TODO:** - Verify the following...
For plug-ins, this is handled automatically based on the name of your plug-in.

### Example Package Structure
The following diagram illustrates an example of the directory structure of a package:
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
The following diagram illustrates an example of the directory structure of a plug-in:
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

## Programmatic APIs
Programmatic APIs should adhere to the following standards and conventions:
- [Code Standards](../CONTRIBUTING.md#code-standards)
- [General Conventions](../CONTRIBUTING.md#general-conventions)
- [Programmatic APIs Standards](../CONTRIBUTING.md#programmatic-apis)
- [Source File Naming Standards](../CONTRIBUTING.md#source-file-naming-standards)
- [Testing Guidelines](TESTING.md)
- [JS Documentation](../CONTRIBUTING.md#js-documentation)

Additionally, programmatic APIs should support and the following capabilities:
- Include trace messages
- Support backward compatibility throughout releases
- Provide a `Common` version API call that accepts: 
  - Connection information, when applicable
  - Parm objects that can be extended in the future while maintaining forward and backward compatibility
- Include *convenience methods* that aid in calling `Common` methods, when appropriate
- Should be categorized in classes that identify theirs actions. For example, `GetJobs.getJobStatus` or `SubmitJobs.submitJcl`.

## Commands
Packages and plug-ins will always introduce a new command `[group]` to the Zowe CLI. 

**Note:** For more information about Zowe CLI commands, see [Command Guidelines](/docs/CommandFormatStandards.md).

Using the command structure conventions, you create a directory structure that follows the example found in section [CLI Directory and File Structure](#cli-directory-and-file-structure) section.

## CLI Directory and File Structure
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
You define profile types on the base imperative configuration document (found in the root `imperative/` directory). Packages and plug-ins can define their own profile type, or, they can take advantage of a previously defined profile type. For example, the `zos-files` and `zos-console` share a `zosmf` profile because both profile types use z/OSMF APIs.

For more information, see [Profile Guidelines](ProfileGuidelines.md).
