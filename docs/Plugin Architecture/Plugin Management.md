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
cli plugin <command>
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
cli plugin install [plugin...] [--registry <registry>] [--isLocalURI] [--isRemoteURI] [--use <config>]
```
- `[plugin...]` is an npm package or a pointer to a URI (either local or remote). It is passed the same way it would be to npm install. 
    - Semantic versioning should also be handled for each plugin much like how it is done in `npm install`. So versions for plugins could be specified like `cli plugin install plugin@^1.0.0` and this would be saved in the plugin.json file so that the update command can respect this.
        - In the instance that no version is specified, the latest version will be installed and prefixed with the same thing stored in npm's save-prefix. See [npm save prefix].
        - For information on npm's semantic versioning, see [npm semver].
    - Also like `npm install`, the ability to install multiple plugins in one command should be considered.
        - `cli plugin install plugin1 plugin2 plugin3` (consistent with npm)
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
cli plugin uninstall <plugin...>
```

- `<plugin...>` is a list of installed plugins to uninstall. This would be the value of one of the keys in plugins.json.

#### Update Command

The update command will take some of the information stored within plugins.json and perform the equivalent of an npm update. Upon completing the update, the plugin information will be updated in plugins.json. Essentially the update is done through npm install @latest of the original plugin.

Things become a bit trickier when dealing with things that weren't installed from an npm registry so for now this command will just go out and pull the most recent source it can in this scenario.

For instances where the update is done on an npm package at a given registry. The registry where the original install took place could be inferred from plugins.json but we should still provide a mechanism to override this information.

##### Command Usage

```commandline
cli plugin update [plugin...] [--registry <registry>]
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
cli plugin list
```

No arguments are sent to this command as it is meant to list all installed plugins and their status. That is good enough for now and could be built upon later.

#### Health Command

The health command will list the health of all plugins or the plugins specified when sent to the command. This is useful as a first step in troubleshooting a plugin or base CLI as things such as missing methods and classes. Plugins also will need to implement a health check method that provides further diagnostic information about the plugin.

This type of command is needed because it is feasible that a user could be using a plugin for some amount of time with no problem and then some kind of hiccup happens on their machine which breaks the plugin. The health check would be able to help the user quickly find the problem in their environment / plugin to get a quicker resolution to their problem. The information returned by this command could also be used in a bug report to the base CLI or plugin developer.

##### Command Usage
```commandline
cli plugin health [plugin...]
```

- `[plugin...]` is an optional list of plugins to perform a health check on. If no plugins are specified, then all plugins will be checked by this command.

#### Version Command

This command will print out the version of a plugin. 

This could be used by an automation script in a development environment to ensure that proper versions of a plugin are installed acrossed team members' machines. For example, say that a team is using `cli` with `cli-plugin` version 1 but version 2 is released and some of the build processes now need functionality in version 2. A script could be written to check these versions and perform updates as needed.

##### Command Usage
```commandline
cli plugin version <plugin>
```

- `<plugin>` is the name of an installed plugin. If this plugin isn't installed, the command will report an error.

#### Repair Command

This command will attempt to repair a plugin.

It could be feasible that their might be some scenarios where a plugin might become corrupt or broken over time due to unforseen circumstances. Thus it would be ideal if there was a command that existed to easily fix a plugin.

***NOTE:** This is not expected to be part of the first iteration.*

Plugins would have to implement a corresponding `fix` method if they have the ability to repair themselves. One example of how this could be useful:

Assume that a plugin didn't properly install a node_module or somehow one became missing. The plugin could implement a fix method, which could call it's health check to determine what the problem is. After determining that a required module isn't installed, the plugin could attempt to install all missing modules. 

This could also have been done by uninstalling and reinstalling the plugin but that could be considered a painfull process depending on the plugin. The repair command would make this process a bit easier.

##### Command Usage
```commandline
cli plugin repair <plugin>
```

- `<plugin>` is the name of an installed plugin. If the plugin is not broken, then nothing should happen. If the plugin is broken and the repair is successful, a simple success message will suffice. On a failed repair, a detailed message (and possible stack trace) should be printed to console.error.

#### Help Command

The help command would display additional plugin help. Some of these things could be:

- Plain text to output in the console.
- A local HTML/PDF/TXT/MD file that opens in an appropriate application
- Some form of online help that is opened in the browser.
    - GitHub
    - Doc Site

For this to be a good experience for plugin developers, some utility functions will need to be written to open up links or local files. Plugins will also need to implement a `help` function / variable that is called by the framework.

##### Command Usage
```commandline
cli plugin help <plugin> [arg]
```

- `<plugin>` is the name of the plugin to display help for.
- `[arg]` is an optional argument to send to the help function of a plugin. This could be used to open up more contextual help.

#### Add Command

The add command would add preinstalled plugins to the plugins.json file so that the base CLI can make use of them. 

Imagine that a user went to their global install of a cli and started doing npm installs of plugins there, the add command could then be used to initialize the nessary config to use them. This could be extended at some point in the future to allow plugins to be installed via `npm install -g <plugin>` and then added with this command.

##### Command Usage
```commandline
cli plugin add <plugin...>
```

- `<plugin...>` is a variable length list of plugins to be added to the base CLI.
- Plugins listed are expected to be in the node_modules directory already. Could be achieved by the user manually doing an `npm install` in the install directory.
    - This could be expanded to also try to look in the global node_modules.

#### Clean Command

The clean command could be used to completely blow away a single plugin or all plugins in the case that the plugin environment becomes broken or poluted. Files, installiation, global set options should be allowed to be selectivly blown away or done in bulk.

Execution of this command should also require the user to confirm that they wish to perform this action since it could be considered to be destructive.

##### Command Usage
```commandline
cli plugin clean [plugin...] [--config] [--files]
```

- `[plugin...]` is an optional variable length argument that points to an installed plugin.
    - If this parameter is omitted, then the operation affects all plugins.
- Operation flags
    - Specifying no flags, will cause the clean operation to remove the package from node_modules and plugin.json. This also implies `--config` and `--files`.
    - `--config` will cause the clean operation to remove any global configuration options that were set for the plugin. This does not remove the plugin and should be considered the first step in troubleshooting a plugin.
    - `--files` will cause the clean operation to remove any files that were created by the plugin in the global CLI's storage location.
        - This implies that we need to provide a way for plugins to create files in the CLI's storage folder (same location where profiles and config options are stored).
        - This should also be a first step in troubleshooting a plugin or base CLI.

***NOTE:** This doesn't need to be included in the first iteration as this isn't needed for an MVP plugin management facility. However, this is useful because it provides an easy way of cleaning up plugins besides the user of a CLI manually going in and deleting stuff. It also gives the ability to clean up config and files which could also be causing the problem, but would persist through a reinstall of a plugin.*


## Config Group

As discussed in the plugin group, and agreed on by the team, global plugin configuration will be handled through the `cli config` command. This command should be provided with the Imperative framework and should be customizable (to a certain extent) by application built in the framework.

So assuming that this `config` group exists, we will need to extend the existing functionality to allow plugin global configurations to be modified. This could be done in one of two ways.

### Using --plugin

Under this method, a flag would be used to specify the plugin name a configuration option should be set for. The usage would look something like this:

- `cli config get <variable> --plugin <plugin_name>`
- `cli config set <variable> <value> --plugin <plugin_name>`

Some things to note:
- If `--plugin` is not specified, then the action is performed on the base CLI application.
- There needs to be a way that all configuration for the base CLI can be gotten as well as all configuration for plugins as well. This could be achieved by simply assuming that omitting the variable name on the get means return everything.

#### Pros
- It is very easy to determine if you are configuring a plugin or the base CLI.
- It keeps the syntax of the config get/set commands fairly clean

#### Cons
- This could lead to much longer commands for the user.
- It would be really difficult for two plugins to share the same global configuration options.

### Prefixing Variables

The other alternative is to prefix the variables with either the plugin name or a configurable prefix set by the plugin developers. The usage could look something like this:

- `cli config get <prefix>#<variable>`
- `cli config set <prefix>#<variable> <value>`

Now you may be wondering why the `#` symbol is being used, this is to help differentiate a plugin from a normal variable group that may exist. It could have been a `.` to be more familiar with JavaScript syntax (dot accessors), but that would have made this situation much harder to solve:

Say that you have a global variable for your base CLI called `A.B` and you install a plugin that saves it's global configuration under the prefix `A`. Well then what would `cli config get A.B` do? Well in this scenario it could do one of two things:

1. Gets the value of `A.B` in the base CLI
1. Gets the value of `B` from the plugin A

There is no good way to discern between either of these methods. Under the `#` syntax, it is real easy for us to determine which configuration to get and set. Below are examples on how to do both of previously listed possibilities for `cli config get A.B`:

1. `cli config get A.B`
1. `cli config get A#B`

Now back to the prefixes. These could be defined by plugins and if not set it is defaulted to the plugin name. This gives some flexibility by plugin developers and could allow plugins to work together and build upon each other fairly easily.

#### Pros
- Shorter command syntax
- Plugins could share prefixes
    - Really good for plugins developed by the same vendor as there could be some overlapping options.
- Similar to JavaDoc and JSDoc in the sense of members of a class can be denoted by **className#memberName**

#### Cons
- It could be a bit confusing to see something like this: `cli config get A#B.C.D`
- It could cause plugins to not be compatible if they are using the same prefix and variable names.
    - **Example:** Plugin **A** uses prefix `A` and plugin **Alpha** uses prefix `A` but the two plugins have not been developed to work together. If these two plugins have the same global variable B of different types between the two, then unpredictable things will happen.
    - The above problem can be prevented by having plugins specify a well defined configuration structure. If two plugins are using the same `prefix#variable` structure, then the types better match or a problem could be listed during the plugin health check. 

#### Dot Notation for Config

So why bother talking about the dot notation for configuration? Well for starters it can already be seen in some CLIs, such as git's `user.name` and `user.email` but it also can relate to how configurations would be stored in JSON.

Take the following two JSON files:

###### /config/global.json
```JSON
{
    "A": {
        "B": "VALUE",
        "C": 1,
        "D": false,
        "E": [
            1,
            2,
            3
        ]
    }
}
```

###### /config/plugin/A.JSON
```JSON
{
    "B": 42
}
```

Is it clearer how the dot notation plays into all of this? Below is the list of all the commands and output that can be seen from the get command:

- `cli config get A.B` -> **VALUE**
- `cli config get A.C` -> **1**
- `cli config get A.D` -> **false**
- `cli config get A.E` -> **1, 2, 3**
- `cli config get A#B` -> **42**


[Plugin Workflow]: ./High_Level_Plugin_Workflow.png
[Config Group]: #config-group
[npm semver]: https://docs.npmjs.com/misc/semver
[npm save prefix]: https://docs.npmjs.com/misc/config#save-prefix

[plugin.json format]: ./Plugin%20Development.md#plugin-json-file