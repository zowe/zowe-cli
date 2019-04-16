# Zowe CLI Conformance Checklist

A plug-in must follow meet the following requirements to align with the Zowe Conformance Program:

- The plug-in is constructed on Imperative CLI Framework.
- The `@lts-incremental` version of your plug-in is installable into the `@lts-incremental` version of the core Zowe CLI, at minimum.(cannot run as a standalone CLI).
- Users of the plug-in can store mainframe connection information in user profiles.
- Users can override profiles using options on the command line and/or environment variables.
- The plug-in is compatible with For more information about the symantic versioning that CLI uses, see [Maintainer Versioning](https://github.com/zowe/zowe-cli/blob/master/docs/MaintainerVersioning.md).
- The plug-in generally adheres to the CLI [Package and Plug-in Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/PackagesAndPluginGuidelines.md).
- The tests for you plug-in generally adhere to the guidelines listed in [Testing Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/TESTING.md) and [Plugin Testing Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/PluginTESTINGGuidelines.md). 
- The plug-in command/help syntax adheres to the [Command Format Standards](https://github.com/zowe/zowe-cli/blob/master/docs/CommandFormatStandards.md).
- Provide external (user guide, readme) and internal (jsdoc) documentation for the plug-in. For more information, see [Documentation Guidelines](https://github.com/zowe/zowe-cli/blob/master/CONTRIBUTING.md#documentation-guidelines).
- Brand the plug-in (in documentation, for example) to be consistent with other CLI plug-ins. For example, "Zowe CLI Plug-in for Abc". 
- All commands in the plug-in should only write to `stdout` or `stderr` via Imperative Framework's `response.console` APIs. This ensures that your commands function with the `--response-format-json` flag. 

**Note:** This list contains the absolute requirements for the Zowe Conformance program, but we also recommend that you reference the [Zowe CLI Contribution Guidelines](https://github.com/zowe/zowe-cli/blob/conformance/CONTRIBUTING.md) as you develop so that you can onboard your contribution quickly and efficiently.

If you are new to the project, you might want to start with [Zowe CLI Development Tutorials](https://zowe.github.io/docs-site/latest/extend/extend-cli/cli-devTutorials.html#getting-started).
