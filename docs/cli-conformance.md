# Zowe CLI Conformance Checklist

A plug-in must meet the following requirements to be conformant under the Zowe Conformance Program:

- The plug-in must be constructed on [Imperative CLI Framework](https://github.com/zowe/imperative).
- The `@lts-incremental` version of your plug-in must be installable into the `@lts-incremental` version of the core Zowe CLI, at minimum. For more information about the semantic versioning scheme that CLI uses, see [Maintainer Versioning](https://github.com/zowe/zowe-cli/blob/master/docs/MaintainerVersioning.md).
- The plug-in must not run as a standalone CLI. 
- When a new major version of Zowe and Zowe CLI is released, conformant plug-ins must update to function properly with the new core version within 30 days.
- The plug-in must be installable via the `zowe plugins install` command. You are also welcome to integrate with any of the current installation methods listed [here](https://zowe.github.io/docs-site/latest/user-guide/cli-installcli.html#methods-to-install-zowe-cli).
- The plug-in must be support user profiles that let users store mainframe connection information.
- Plug-in users must be able to override profiles using options on the command line and/or environment variables. 
- The plug-in command/help syntax must adhere to the [Command Format Standards](https://github.com/zowe/zowe-cli/blob/master/docs/CommandFormatStandards.md).
- All commands in the plug-in must only write to `stdout` or `stderr` via Imperative Framework's `response.console` APIs. This ensures that commands function with the `--response-format-json` flag.

If you are new to the project, get started creating your plug-in by cloning our sample plug-in. See [Zowe CLI Development Tutorials](https://zowe.github.io/docs-site/latest/extend/extend-cli/cli-devTutorials.html#getting-started) to learn more. 

**Note:** You can also reference the [Zowe CLI Contribution Guidelines](https://github.com/zowe/zowe-cli/blob/master/CONTRIBUTING.md) to help you develop a plug-in efficiently. 
