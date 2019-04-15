# Zowe CLI Conformance Checklist

A plug-in must follow meet the following requirements to align with the Zowe Conformance Program:

- The plug-in is constructed on Imperative CLI Framework.
- The plug-in is installable to Zowe CLI (cannot run as a standalone CLI).
- Users of the plug-in can store mainframe connection information in user profiles.
- Users can override profiles using options on the command line and/or environment variables.
- The plug-in is compatible with `@latest` and `@lts-incremental` versions of the core CLI, at minimum. For more information about the symantic versioning that CLI uses, see [Maintainer Versioning](https://github.com/zowe/zowe-cli/blob/master/docs/MaintainerVersioning.md).
- The plug-in generally adheres to the CLI [Package and Plug-in Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/PackagesAndPluginGuidelines.md).
- The plug-in is integrated into Zowe automated testing/delivery pipelines.
- The tests for you plug-in generally adhere to the guidelines listed in [Testing Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/TESTING.md) and [Plug-in Testing Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/PluginTESTINGGuidelines.md).
- The plug-in command/help syntax adheres to the [Command Format Standards](https://github.com/zowe/zowe-cli/blob/master/docs/CommandFormatStandards.md).
- Provide external (user guide, readme) and internal (jsdoc) documentation for the plug-in. For more information, see [Documentation Guidelines](https://github.com/zowe/zowe-cli/blob/master/CONTRIBUTING.md#documentation-guidelines).
- Name your plug-in to be consistent with other CLI plug-ins. For example, "Zowe CLI Plug-in for Abc".

**Note:** This list contains the absolute requirements for the Zowe Conformance program, but we also recommend that you reference the [Zowe CLI Contribution Guidelines](https://github.com/zowe/zowe-cli/blob/conformance/CONTRIBUTING.md) as you develop so that you can onboard your contribution quickly and efficiently.

## Developing a Conformant Zowe CLI Plug-in 

An CLI plug-in is Zowe conformant if it follows these criteria: 

- 1 
- 2 
- 3 
- etc...

## Developing Conformant Commands/Features for Zowe CLI Core

A command/feature contribution to the core Zowe CLI is compliant if it follows these criteria: 

- 1 
- 2 
- 3 
- etc...
