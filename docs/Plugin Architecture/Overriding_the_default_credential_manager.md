# How to override the Zowe CLI default credential manager

**Table of Contents:**

- [How to override the Zowe CLI default credential manager](#how-to-override-the-zowe-cli-default-credential-manager)
  - [Introduction](#introduction)
  - [Overriding credential manager is done with a plugin and/or Zowe Explorer extension](#overriding-credential-manager-is-done-with-a-plugin-andor-zowe-explorer-extension)
  - [The Imperative framework maintains a list of known credential managers](#the-imperative-framework-maintains-a-list-of-known-credential-managers)
  - [Plugin definition properties that are required](#plugin-definition-properties-that-are-required)
  - [Classes that a plugin must implement](#classes-that-a-plugin-must-implement)
  - [Imperative utility functions](#imperative-utility-functions)

## Introduction

Zowe CLI contains a credential manager that is automatically used by CLI commands. The credential manager stores any values that are specified as "secure" within your Zowe CLI configuration into a secure vault.

In some environments, the default credential manager may not be available. For example, you would not be able to use the default credential manager in an operating system architecture for which the default credential manager's underlying binary code has not been compiled. Some virtualized or containerized environments may not permit the default credential manager to be easily used.

To enable 3rd party contributors to provide a credential manager that operates in a specialized environment, Zowe CLI provides a means to override the credential manager functionality of Zowe CLI.

## Overriding credential manager is done with a plugin and/or Zowe Explorer extension

Zowe CLI and Zowe Explorer share many common traits. One of those traits is the ability to store secure properties with a credential manager. Zowe CLI enables 3rd parties to provide expanded functionality through a plugin. Zowe Explorer allows enhanced functionality to be provided through Zowe Explorer / VS Code extensions.

To provide a credential manager override for the Zowe CLI, you must write a specialized plugin. To provide a credential manager override for Zowe Explorer(ZE), you must write a specialized ZE extension. To support consumers using both the CLI and ZE, you must create both a CLI plugin and a ZE extension.

This document focuses on the implementation of a Zowe CLI plugin that overrides the default credential manager.

## The Imperative framework maintains a list of known credential managers

Because a credential manager override may be supplied for both the CLI and ZE, the Zowe Imperative library maintains a list of known credential managers. Each known credential manager has a "display name", which is associated with a CLI plugin name, or a ZE extension name, or both. This enables the Imperative library to recognize that a credential manager override has been installed for only the CLI and inform the user of the corresponding extension needed for Zowe Explorer. The reverse situation can also be handled.

A 3rd party creating a new credential manager override must ask the Zowe CLI/Explorer team to add that new credential manager to the known list. We anticipate that new credential managers will be a rare occurrence, so we do expect that it will be a significant burden to maintaining this known list.

The CLI will only permit a known credential manager to be configured as the credential manager used by the CLI. A hand-editing workaround exists to enable testing such a new credential manager override during its early development.

We anticipate that the use of a 3rd party credential manager will be a site-wide decision. We do not expect individual users to switch back and forth among credential managers. Thus, if multiple credential manager plugins are installed by a customer, the CLI decision of which to use is a very simple algorithm - the last one installed wins. If customers install multiple overrides and get themselves into an unworkable situation, they can resolve the problem by uninstalling any unwanted plugins and reinstalling the desired plugin.

## Plugin definition properties that are required

All plugins specify an "imperative" property in their package.json files. Typically, it contains a "configurationModule" property, whose value points to a file containing properties that define a plugin. The detailed format for such a definition is provided in the interface [IImperativeConfig](https://github.com/zowe/imperative/blob/master/packages/imperative/src/doc/IImperativeConfig.ts)

There is no need to define commands or profiles for a plugin that overrides the default credential manager. In fact, our recommendation is that a plugin either adds commands to the CLI or overrides the credential manager, but not both.

Within its definition, a credential manager override plugin must supply a property named "overrides".

A credential manager override plugin must also supply a property named "pluginLifeCycle".

For both of these properties, see [Classes that a plugin must implement](#classes-that-a-plugin-must-implement) for details.

## Classes that a plugin must implement

The value of the plugin definition property named "overrides" is a filename path to a file in which the plugin provides a class that implements the [IImperativeOverrides](https://github.com/zowe/imperative/blob/master/packages/imperative/src/doc/IImperativeOverrides.ts) interface. This is the class that provides credential manager operations at runtime.

The value of the plugin definition property named 'pluginLifeCycle' contains a filename path to a file in which a plug-in implement a class containing lifecycle functions. That plugin class must extend the [AbstractPluginLifeCycle](https://github.com/zowe/imperative/blob/master/packages/imperative/src/plugins/AbstractPluginLifeCycle.ts) class.

Within this lifecycle class, you must implement both the "postInstall" and "preUninstall" functions. As the name implies, Zowe CLI will call the postInstall function of the plugin immediately after the plugin has been installed. Similarly, the preUninstall function will be called immediately before the Zowe CLI uninstalls the plugin.

Any plugin *CAN* supply a lifecycle class. However, credential manager override plugins *MUST* supply that class. While you can perform any desired actions during the lifecycle functions, a credential manager override must configure itself to be the current credential manager during postInstall, and restore the default credential manager during preUninstall. [Imperative utility functions](#imperative-utility-functions) assist with those credential manager configuration duties.

## Imperative utility functions

The Imperative class [CredentialManagerOverride ](https://github.com/zowe/imperative/blob/master/packages/security/src/CredentialManagerOverride.ts) provides a number of useful utilities related to the configuration of known credential mangers. Two functions of particular value to a credential manger override plugin are recordCredMgrInConfig and recordDefaultCredMgrInConfig.

A credential manager override plugin must call recordCredMgrInConfig() during its postInstall() function to configure that plugin for use during CLI commands. During its preUninstall() function, the plugin must call recordDefaultCredMgrInConfig() to restore the default credential manager. This leaves the CLI in an operational state after the plugin has been uninstalled.