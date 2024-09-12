# Plugin Management

This document covers how plugins are to be managed by the Imperative framework as well as defining the lifecycle of a plugin's initialization.

*For the remainder of this document, assume that the Base CLI is invoked by entering `cli` at the command line. Things are just easier this way.*

## Plugin Lifecycle

It is up to the individual users of the Imperative framework to explicitly disable the use of plugins in their application. This can be done by adding the following JSON variable to the root configuration (defined by the Imperative framework).

```JSON
{
    "allowPlugins": false
}
```

*By default this variable is true.*

### Logical Flow

The following image details the entire initialization process for a CLI and its installed plugins.

![Lifecycle][Plugin Workflow]

1. This diagram enters at the point that the CLI is invoked. (e.g `cli <command>` is typed at the command line.)
2. The first thing that is done after being invoked is the base application will be initialized with a well defined JSON object. (need to get official format)
3. As mentioned earlier, it is possible to set `enablePlugins = false`. If this is the case then skip to the last step.
1. Assuming plugins are installed, the Imperative CLI proceeds to enable the `plugin` group. More on what exists in this group later.
1. Next, the Imperative CLI will get a list of installed plugins from a JSON document defined in the configuration / profile directory of the base CLI.
    - This structure will be defined later in this document.
1. It is possible at this point that no plugins are installed. If this is the case, skip to the last step.
1. Assuming that there are plugins installed. We will loop through each one found in the JSON file mentioned earlier using the following logic
    1. Require the next plugin from NodeJS.
        - When a plugin is installed it is placed in the standard **node_modules** directory.
        - Knowing this a simple `const plugin = require('<plugin name>')` will do the trick here
    1. Construct the plugin that was required
    1. Call `plugin.addPlugin` method
        - This method should return a JSON object of added commands. Should be the same syntax as the object passed to the base CLI on initialization.
        - More on this in ***DEVELOPING PLUGINS*** (TODO) 
    1. Repeat the first 3 steps until all plugins are initialized. 
1. Finally, the CLI will continue to command parsing and executing handlers

***NOTE:*** *Per Dan's request, it should be possible for a Base CLI application to extend/override the plugin functionality. This might be out of scope for the first iteration of Imperative and maybe something we come back to later.*

## Plugin Group

When enabling plugins, a group will automatically be added to the Base CLI by the Imperative Framework. This group will be called `plugin` and it's sole purpose is for managing plugin packages.

From the command line this would look something like this:

```commandline
zowe plugins <command>
```

### Commands

The plugin group contains various commands for managing the installed CLI plugins. At the very minimum, this group should define the following four commands:

- `install` - Installs plugins
- `uninstall` - Uninstalls plugins
- `update`- Updates plugins
- `list` - Lists installed plugins

In addition to those 4 base commands, 6 additional commands will be needed to create a better plugin user experience.

- `health` - Prints out the health of plugin(s)
- `version` - Prints out a specific plugin's version.
- `configure` - Allows for global plugin configuration. 
    - ***NOTE:** Per team discussions, this would not be part of the plugin group, but it would be within a config group.*
    - See [Config Group]
- `help` - Prints (or opens) more generic plugin help.
- `repair` - Attempts to repair a plugin.
- `add` - Scans the node_modules for a pre-installed plugin.
- `clean` - Removes all plugins related items.

#### Install Command

The install command is responsible for installing new plugins to the base application. These plugins are expected to be npm packages, which doesn't mean they have to be on public npm. These packages could be in a different registry or within a tar or folder on the user's machine.

The idea is for this command to act very similar to npm install (in fact it would use npm install under the covers for ease of use). When doing the npm install, the --no-save option should be used to prevent the install from modifying the package.json of the base cli.

***NOTE:** Installed plugins are not placed in the package.json because this information will be lost if the base CLI is updated. This is because the package.json will be replaced with the one present in the updated package, which obviously doesn't contain the installed plugin information.*

On successful install, the plugin.json file will have another object saved in it to represent the newly installed plugin.

##### Format of plugin.json

To prevent duplication, this definition has been moved [here][plugin.json format]

***NOTE:** This file is managed by the Imperative Plugin Framework and does not need to be maintained by any application that takes this functionality as is. For applications that modify the plugin management facility, it is up to them to ensure that plugins are managed according to their design.*

***NOTE:** This file could also persist between versions of the plugin and could be used to rebuild the plugin "database" through another command. This also means that someone could create a plugin.json file and place it into the expected directory and have the correct plugins be loaded for all members of their team.*

##### Command Usage
```commandline
zowe plugins install [plugin...] [--registry <registry>] [--isLocalURI] [--isRemoteURI] [--use <config>]
```
- `[plugin...]` is an npm package or a pointer to a URI (either local or remote). It is passed the same way it would be to npm install. 
    - Semantic versioning should also be handled for each plugin much like how it is done in `npm install`. So versions for plugins could be specified like `zowe plugins install plugin@^1.0.0` and this would be saved in the `plugin.json` file so that the update command can respect this.
        - In the instance that no version is specified, the latest version will be installed and prefixed with the same thing stored in npm's save-prefix. See [npm save prefix].
        - For information on npm's semantic versioning, see [npm semver].
    - Also like `npm install`, the ability to install multiple plugins in one command should be considered.
        - `zowe plugins install plugin1 plugin2 plugin3` (consistent with npm)
        - ***NOTE:** Assume this format for the rest of the document when referring to `plugin...` type arguments.*
    - This parameter has been marked as optional so that it works like an npm install would in a project. In the first iteration, this functionality probably doesn't exist. In the event that no parameters are passed, a plugin.json file will need to exist or be provided. All plugins in this file will be installed using the same concept that `npm install` uses with a package.json.
        - ***NOTE:** This is not part of the first iteration.*
- `--registry <registry>` is an optional flag that can be set to mimic the `npm install --registry` syntax.
- `--isLocalURI` and `--isRemoteURI` are both mechanisms for helping the command handler determine what to do an npm install with. These flags would be useful in cases where a misdetection of what **plugin** is pointing to. The easy example is when you want **plugin** to be ./folder-name, which could resolve to folder-name. In this case if a public npm package called folder-name existed, then that would be installed instead of the local folder we wanted.
    - *If we do some better parameter parsing, then these flags may not be needed. I just didn't have the time to do this proper in my POC*
- `[--use <config>]` is a parameter to specify which configuration file to use. This file should be in the format of a plugin.json file (which could have been shared from a teammate). 
    - If this parameter is specified, then no plugins should be specified on the command line.
    - If no plugins are specified on the command line and this parameter is not passed, this parameter will default to the location of the actual plugin.json. This is for the case that an reinstall of the base CLI occurred and the user wishes to get their plugins back.

#### Uninstall Command

This command is less complicated than the install command. Basically all this command will do is an npm uninstall of the package and remove the corresponding configuration from the plugin.json file.

##### Command Usage
```commandline
zowe plugins uninstall <plugin...>
```

- `<plugin...>` is a list of installed plugins to uninstall. This would be the value of one of the keys in plugins.json.

#### Update Command

The update command will take some of the information stored within plugins.json and perform the equivalent of an npm update. Upon completing the update, the plugin information will be updated in plugins.json. Essentially the update is done through npm install @latest of the original plugin.

Things become a bit trickier when dealing with things that weren't installed from an npm registry so for now this command will just go out and pull the most recent source it can in this scenario.

For instances where the update is done on an npm package at a given registry. The registry where the original install took place could be inferred from plugins.json but we should still provide a mechanism to override this information.

##### Command Usage

```commandline
zowe plugins update [plugin...] [--registry <registry>]
```

- **[plugin...]** is a list of installed plugins to update. This would be the value of one of the keys in plugins.json. It should be noted that this parameter could be optional. If omitted, all plugins would be updated to the most current version (which is determined in the plugin.json file).
    - Much like the install command, semantic versioning will be accepted on each plugin. In cases where the semantic versioning is omitted, we will look to the plugin.json file to determine how best to update.
- `--registry <registry>` is an optional flag that can be used to install the plugin from a different registry than was originally. If this is not set, the registry is inferred from the plugin's entry in plugins.json.

***NOTE:** For plugins that referred to files, only the plugin name can be specified in the first iteration of this mechanism. Thus the original file / folder needs to be modified in order for the update to have any effect. In the case of a TAR file plugin, this would imply that a new one would need to be downloaded and copied to the exact location as the original TAR file and be named the same.*

***NOTE:** This will be part of the first iteration and is more of a user experience type command. An update is the same thing as doing an install of the plugin that already exists. So this command should just hook into most of the logic provided by the install command. (It might even share all the install logic)*

#### List Command

The list command will list all installed plugins to the Base CLI application. The health check functionality that was originally included here has been moved to an explicit health command, that doesn't prevent us from doing something with that here.

##### Command Usage
```commandline
zowe plugins list
```

No arguments are sent to this command as it is meant to list all installed plugins and their status. That is good enough for now and could be built upon later.

[Plugin Workflow]: ./High_Level_Plugin_Workflow.png
[Config Group]: #config-group
[npm semver]: https://docs.npmjs.com/misc/semver
[npm save prefix]: https://docs.npmjs.com/misc/config#save-prefix

[plugin.json format]: ./Plugin%20Development.md#plugin-json-file