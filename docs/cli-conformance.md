# Zowe CLI Conformance Checklist

A plug-in must meet the following requirements to be conformant under the Zowe Conformance Program:

- The plug-in must be constructed on [Imperative CLI Framework](https://github.com/zowe/imperative).
- The `@lts-incremental` version of your plug-in must be installable into the `@lts-incremental` version of the core Zowe CLI, at minimum. For more information about the semantic versioning scheme that CLI uses, see [Maintainer Versioning](https://github.com/zowe/zowe-cli/blob/master/docs/MaintainerVersioning.md).
- The plug-in must not run as a standalone CLI.
- When a new major version of Zowe and Zowe CLI is released, conformant plug-ins must update to function properly with the new core version within 30 days.
    - **Note:** In addition to the 30-day post-release conformance requirement, we will not introduce any breaking changes to `@latest`core CLI (forward development) within 30 days of a major Zowe release (1.x.x > 2.0.0). This provides plug-in developers with 30 days leading up to the release to integrate with core and be "day-1 compatible" with the features when they are ported to `@lts-incremental`. 
- The plug-in must be installable via the `zowe plugins install` command. You are also welcome to integrate with any of the current installation methods listed [here] (https://zowe.github.io/docs-site/latest/user-guide/cli-installcli.html#methods-to-install-zowe-cli).
- The plug-in must be uninstallable from the core CLI via the `zowe plugins uninstall` command.
- The plug-in must be support user profiles that let users store mainframe connection information.
- The plug-in must introduce a unique command group name that does not conflict with existing conformant plug-in group names. Plug-in names will be evaluated on a first-come, first-serve basis. 
- Plug-in users must be able to override profiles using options on the command line and/or environment variables. 
- All commands in the plug-in must only write to `stdout` or `stderr` via Imperative Framework's `response.console` APIs. This ensures that commands function with the `--response-format-json` flag.

If you are new to the project, get started creating your plug-in by cloning our sample plug-in. See [Zowe CLI Development Tutorials](https://zowe.github.io/docs-site/latest/extend/extend-cli/cli-devTutorials.html#getting-started) to learn more. 

**Note:** You can also reference the [Zowe CLI Contribution Guidelines](https://github.com/zowe/zowe-cli/blob/master/CONTRIBUTING.md) to help you develop a plug-in efficiently. 
