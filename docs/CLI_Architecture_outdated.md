# Imperative CLI

This document covers some of the concepts and ideas discussed with the Event Horizon team about the basic architecture of Imperative CLI. Also covered will be some of the conversations that took place around the plugin architecture.

## Architecture

Imperative will be a collection of plugins and utility functions underneath a command processing mechanism. 

### 0.0.1 Features

The following features are targeted for the initial implementation of the Imperative Framework:

- Command Definition and Processing Infrastructure
    - Standardized Command Definition Structure
    - Standardized Handler definition and implementation 
    - Standardized Command Responses
        - JSON response formats
        - Standardized Messaging 
    - Advanced Syntax Validation
    - Auto generation of help text
    - Compound Command Handlers
    - Auto-load of User Profiles
    - "Helper" Utilities
        - Read from STDIN before invoking handlers
- Secure Credential Store
- User Profiles (CLI Configuration) 
    - Including validation infrastructure 
- Extension Framework
- Auto generation of C/LI reference Markdown
- Utilities 
    - Progress Bar
    - Logging 
    - Error Handling
    - Table Generation
    - Pretty JSON 
- Ability to mark commands "experimental"


### Creating an Imperative Project

An Imperative project should be created in an npm package. Imperative itself will be published to npm.

You use the Imperative framework by adding `imperative` as a dependency, and calling `Imperative.init()` and `Imperative.parse()`. To aid in getting started, we may eventually provide a code generator for a basic Imperative CLI project. Think of this method to be similar to [Angular CLI]'s `ng new` command. A yeoman (`yo`) generator would be an avenue to explore for this feature. 

#### Configuration

A CLI application implemented under imperative will be defined with a configuration object. 
This configuration can be specified when the Imperative APIs are initialized (through `Imperative.init()`), or it can be defined in the `"imperative"` field of package.json. 

Whether the CLI developer specifies the configuration as an argument to `Imperative.init` or in package.json, they can opt to provide a path on the `configurationModule` field of the configuration object which. The `configurationModule` should be a Node.js javascript file, the default export of which is the full configuration object.

For example: 
```typescript
// package.json
{
//...
"imperative" : {
"configurationModule": "lib/configuration.js"
}
//...
}
```
``` javascript
// lib/configuration.js
module.exports = {
    definitions: [...],
    defaultHome: "~/.mycli",
    primaryTextColor: "green",
  //  ...
}
```
The configuration object describes the CLI developer's desired command syntax, as well as several settings they'll want to specify, such as any configuration profiles they might want to allow users to create and use, highlighting colors, custom  help text formatting, and so on. Depending on user demand, it's possible for us to implement the reading of configuration objects in other formats such as YAML. 

Within the configuration object, the command syntax is defined in a tree-like structure.  The `definitions` field is built with an array of these definition trees. Each entry in the array is assumed to be a child tree of the root command. The trees can nest commands arbitrarily deep, which can be useful for organizing complex CLIs or CLIs whose syntax is similar to natural language. 

For example, if your CLI is called "banana", `banana --help` will display the overall description for your CLI, as well as what child command groups are available underneath of banana. `banana --version` will print the current version of your banana CLI. 

Let's look at an example definition: 
```typescript
{
    "definitions": [{
        "name"    : "config",
        "type"    : "group",
        "description" : "Configure your CLI",
        "children": [
            {
                "name"   : "list",
                "type"   : "command",
                "handler": "path/to/file"
            },
            {
                "name"   : "set",
                "type"   : "command",
                "handler": "path/to/file"
            }, 
            {
                // ...
            }
        ]
    }, 
    {
     "name": "server", "aliases": ["serv"],
     "description": "Manage the CLI's server mode",
     "type": "group",
     "children": [
     { 
        "name" : "start",
        "description" : "Start the server",
        "handler": "path/to/file",
        "options" : [
          "name": "port", "aliases": ["p"]
          "type": "number", 
          "description" : "the port to run the server with",
        ]
      }
     ]
    }]
}
```

- The above example creates these three commands:
    - `banana config list`
    - `banana config set`
    - `banana server start`
- Handlers are defined by a path in the `handler` property and loaded on-demand when the command is issued. 
- Features available on the syntax definition tree include: 
    - Positional arguments with names and help text
    - Support for --options, which can be described with aliases, help text 
    - Advanced syntax validation rules such as conflicting options, implications, regex pattern matching, and more
    - Exposing options for configuration profiles on your commands
    - Example commands 

In a similar concept to the `configurationModule` mentioned above, command syntax definition trees can be loaded from  Node.js javascript files by specifying paths in the `modules` field of the configuration object. You can specify `definitions`, `modules`, or both to build your complete command syntax. 

##### Format of Configuration Files

Configuration for profiles, commands, plugins, and other configuration that may arise will be in the form of JSON documents.

#### Imperative API Object
After a single invokation of `Imperative.init()`, the imperative API object can be referenced to obtain instance API access (e.g. the logging object).

Assuming an initial `Imperative.init()` was invoked, elsewhere you can access the API object via:

```typescript
import { Imperative } from "imperative"
const appLogger = Imperative.api.appLogger;
appLogger.debug("My debug data");
```

## Plugin Architecture

Now to the fun stuff, let's talk about how we can allow plugins to be created for an Imperative CLI application. Every plugin to an Imperative CLI based application will be it's own package. (For simplicity assume an npm package in my examples)

To make this easier, let's say that we have created a CLI based on Imperative called **Supernova** (invoked at the command line with `nova`) for the rest of this section.

It will be up to Supernova to manage it's own plugins. The Imperative framework will allow this to happen easily though.

A possible thing that could be done is for Supernova to provide, as part of that config.json mentioned earlier, an option to enable or disable plugins. If plugins are enabled, Imperative will add a command to manage plugins. These commands could be accessed by using the following command implemented by Imperative:

```
nova plugin
```

### Plugin Commands

Currently I see the need for 3 plugin commands under this scheme:

- `nova plugin install <plugin-name>`
    - Installs a plugin to Supernova using the specified npm package name.
- `nova plugin list`
    - Lists all the plugins and possibly a status of the health of the plugins
- `nova plugin uninstall <plugin-name>`
    - Opposite of install, we will uninstall the specified plugin.

**NOTE:** *THESE COMMANDS WOULD NOT BE IMPLEMENTED BY Supernova BUT WOULD BE ADDED BY THE Imperative FRAMEWORK. THAT WAY, PLUGINS WOULD BE CONSISTENT FROM CLI TO CLI*

### Managing Plugins

Under the above mechanism, we will need to manage plugins ourselves. I do have a proof of concept [here][POC] that will illustrate the concepts below.

#### Installing

Plugins are installed to Supernova by doing `nova plugin install <plugin-name>`. So assuming a plugin for Supernova called **Hypernova** (package hypernova), one could do `nova plugin install hypernova`.

What this will do is do an npm install to Supernova of the `hypernova` package. Meaning that it will now be saved into the **node\_modules** directory where it can be required later. This will also save the plugin to a configuration file for plugins. We will call that **_plugins.json** and it could look something like this after the install command.

```json
{
    "hypernova": true
}
```

#### Uninstalling

Uninstalling Hypernova from Supernova is done by simply doing: `nova plugin uninstall hypernova`.

This performs the opposite operation as the install above, removing Hypernova from the node_modules and the _plugins.json file.

#### Listing

Supernova also should list which plugins are installed. This is achieved by executing `nova plugin list`. 

This command will list all plugins installed to Supernova, and a health status of the plugin. *(More information on this in the Developing Plugins section later)*

#### Plugin Loading

Plugins are loaded to Supernova dynamically as they are installed. The user doesn't need to know how this is done but Imperative will do something like this:

1. Read _plugins.json
1. Loop through each plugin in the file (if it is there then it is assumed to be installed)
    1. `require(plugin-name).addPlugin(ImperativeApi)`
    1. On error skip this plugin and load the next one (print out message `nova plugin list` should give more details)

Below is the code I have in my POC to do this:

```TypeScript
import chalk from 'chalk';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { readFileSync, writeFileSync } from 'jsonfile';
import * as yargs from 'yargs';
import { PluginHandler } from '../../commands/plugin-feature/plugins';
import { PluginConfig } from '../types/plugin-types';
import { Constants } from '../utils/constants';
import { ImperitiveApi } from '../api/api';

export class PluginModule {
  public readonly configFile = join(Constants.Config.root, '_plugins.json');

  /**
   * Initialize the plugins module
   * @param {boolean} enablePlugins Should plugins be allowed
   */
  constructor(public readonly enablePlugins = true) {
    if(!existsSync(this.configFile)) {
      mkdirSync(Constants.Config.root);
      writeFileSync(this.configFile, {});
    }
  }

  addPluginCommand() {
    if (this.enablePlugins) {
      // Add the plugins to the command handler
      yargs.command(new PluginHandler());
    }
  }

  initPlugins() {
    try {
      const plugins: PluginConfig = readFileSync(this.configFile);

      for (const plugin in plugins) {
        try {
          require(plugin).addPlugin(ImperitiveApi);
        } catch (e) {
          console.error(chalk.yellow(`Unable to initialize plugin ${plugin}`));
          console.error(e);
        }
      }
    } catch (e) {
      console.error();
      console.error(chalk.redBright(`Malformed plugin database. Unable to load plugins`));
      console.error(`We should create a ${chalk.cyanBright('cli plugins fix')} command to handle this.`);
      console.error();
    }
  }
}

export const PluginFeature = new PluginModule(true);
```

### Developing Plugins

This section will touch on how plugins like Hypernova could be developed for a Supernova application.

#### API Access

Currently we are debating two mechanisms to allow plugins to have access to the parent modules API.

In our example, I am talking about how Hypernova gets access to Supernova's API.

##### API Object

This method involves Hypernova receiving an API object from Supernova upon initialization. This could look something like this:

```TypeScript
// Hypernova index.ts

import { SupernovaAPI } from 'supernova'; // Installed to @types/supernova

export function addPlugin(api: SupernovaAPI) {
    // Do Stuff
}
```

Of course, Hypernova doesn't have to be written in TypeScript. So the above code could look like this in JavaScript.

```JavaScript
exports.addPlugin = (api) => {
    // Do Stuff
}
```

Under either method, the load would look the same as seen earlier.

```TypeScript
// Assume plugin is hypernova and SupernovaAPI is defined
require(plugin).addPlugin(SupernovaAPI);
```

Then in the Hypernova plugin SupernovaAPIs could be accessed by doing.

```TypeScript
api.log('stuff');
api.getClass('SomeSupernovaClass') as SomeSupernovaClass // Imported from @types/Supernova
```

##### Direct Import of Parent

This method assumes that Hypernova would just import well defined Supernova classes directly. This would be done like so:

```TypeScript
import { SomeSupernovaClass } from 'supernova'; // Installed to supernova package

export function addPlugin() {
    // Do Stuff
    new SomeSupernovaClass();
}
```

#### Expected Plugin Methods

I believe that the below methods should be implemented to keep this whole thing clean.

##### addPlugin

This method acts as an explicit entry point to the plugin as opposed to an arbritary entry point of loading the file. I tend to like to be more explicit.

##### healthCheck

This method is used when `nova plugin list` is called to determine the health of a plugin. If this method returns false or throws and exception, the list command will indicate the false result or the message contained within the exception.

### Additional Considerations

This architecture is not entirely complete yet so some questions do exist.

#### How do we want to install plugins?

I mentioned that we could do an npm install of the plugin into a cli's node_modules, but that probably means that plugins will be cleared when an update of the base CLI happens or an npm prune occurs. This could be overcome by having a postinstall script to redo all the installs based on the _plugins.json file.

#### What about plugins that aren't in public npm? (Dan K.)

Good question Dan, I'll get back to you later. But I don't see why we can't point to a git repo or a tar file with a flag on the plugin install (much like npm install allows). But this means that the plugin still needs a package.json.

#### How should plugins be developed?

As you can see by the above documentation, it is still very unclear how plugins are to be documented.

[Angular CLI]: https://cli.angular.io/

## Logging
Imperative uses [log4js](https://www.npmjs.com/package/log4js).  An instance of log4js is created whenever a call is made to 
`Imperative.init()`.  The initial imperative configuration document, `IImperativeConfig`, contains fields, `imperativeLogging` or `appLogging`, to be  populated by the [logging configuration](#loggingConfiguration).

If nothing is provided for `imperativeLogging` or `appLogging` defaults are taken.  

An application using the imperative framework can direct its logs to be written to the same log file that is used by imperative or an isolated log file.  

The log file names that are used, the level of logging, and which log files are written to are controllable via [logging configuration](#loggingConfiguration).  The level of logging (e.g. TRACE, DEBUG, INFO, etc...) are also controllable programmatically.

### Logging Configuration
Current logging configuration controls are documented [here][logging_config].

### Using Logging API

#### Note
Console logging should appear for debugging purposes only and then removed because console messages will likely prevent properly formatted JSON responses from being written to stdout or stderr.

#### Example Logging to Isolated Application Log
```typescript
import { Imperative } from "imperative"
const appLogger = Imperative.api.appLogger;
appLogger.debug("My debug data");
```
#### Example Logging to Imperative's Log

```typescript
import { Imperative } from "imperative"
const imperativeLogger = Imperative.api.imperativeLogger;
imperativeLogger.debug("My debug data");
```

### When Logging API is Not Available
If `Imperative.init()` fails, the imperative API object will not be created.  
You will not be able to use the `Imperative.api` logging objects.  For convenience, `Imperative.console` may be used to write error messages if `Imperative.init()` fails or to issue general debugging messages.

```typescript
import { Imperative } from "imperative"
Imperative.console.debug("My debug data");
```

## Profiles

imperative will offer a simple persistent configuration mechanism called "profiles".

One or more profile "types" can be implemented for your CLI. Extensions to your CLI can also introduce additional profile types.

Imperative will save the profiles in your CLI home directory "/profiles/<type>". Imperative also provides "default" and "profile dependency" mechanisms. When the first profile of a particular "type" is created, it is denoted the default (but can be changed by the user). 

### Profile Configuration

To include profiles in your CLI implementation, you configure your CLI document's profile property:

```typescript
{
    "definitions": {
        "name"    : "banana",
        "type"    : "group",
        "children": [
            {
                "name"   : "buy",
                "type"   : "command",
                "handler": "/handlers/buy"
            },
            {
                "name"   : "sell",
                "type"   : "command",
                "handler": "/handlers/sell"
            }, 
            {
                // ...
            }
        ]
    },
    "profiles": [
        {
            "schema": {},
            "type": "banana"
        }
    ]
}
```

The "type" causes the profile to be created in a separate "banana" directory (in the users home) and can be indicated on commands to direct Imperative to load a profile of that type for the commands execution.

The "schema" is a modified JSON schema document that ensure profiles loaded are well formed and can be used to auto-generate profile creation and update commands.

### Configuring Commands to Use Profiles

Once you have profile types defined to your CLI, you can indicate a profile of a particular type is loaded for a command or set of commands.

#### Configuring a Command to use Profiles 

You can associate a profile type to a command by configuring the "profile" property for a command definition. 

```typescript
{
    "definitions": {
        "name"    : "banana",
        "type"    : "group",
        "children": [
            {
                "name"   : "buy",
                "type"   : "command",
                "handler": "/handlers/buy",
                "profile": {
                  "required": [{"type": "banana", "description": "A banana profile"}],
                  "optional": [{"type": "peel", "description": "A peel profile"}]
                }
            },
            {
                "name"   : "sell",
                "type"   : "command",
                "handler": "/handlers/sell"
            }, 
            {
                // ...
            }
        ]
    },
    "profiles": [
        {
            "schema": {...},
            "type": "banana"
        }, 
        {
            "schema": {...},
            "type": "peel"
        }
    ]
}
```

The "required" property indicates that this command requires a profile of type "banana". Unless instructed otherwise, Imperative will automatically generate options that allow the user to specify a particular profile by name on the command.

The "optional" property indicates that this profile type can be specified for the command, but it is not required. 

#### Configuring a Group to use Profiles 

Commands can also inherit the profile configuration from their parent:

```typescript
{
    "definitions": [{
        "name"    : "banana",
        "type"    : "group",
        "passDown": {
            "profile": {
              "required": [{"type": "banana", "description": "A banana profile"}],
              "optional": [{"type": "peel", "description": "A peel profile"}]
            }
        },
        "children": [
            {
                "name"   : "buy",
                "type"   : "command",
                "handler": "/handlers/buy",
            },
            {
                "name"   : "sell",
                "type"   : "command",
                "handler": "/handlers/sell"
            }, 
            {
                // ...
            }
        ]
    }],
    "profiles": [
        {
            "schema": {},
            "type": "banana"
        }, 
        {
            "schema": {},
            "type": "peel"
        }
    ]
}
```

Using the "passDown" property, you can configure each child to inherit the profile specifications required by the "banana" group.

#### Configuring a Global Profile  

If you need a "global" configuration profile, you can specify profiles on the CLI configuration document. Doing so causes a profile of that "type" (the default) to be loaded when your CLI initializes (not just for a particular command).

 ```typescript
 {
     "definitions": [{
         "name"    : "banana",
         "type"    : "group",
         "profile":  [{"type": "banana", "description": "A banana profile"}],
         "children": [
             {
                 "name"   : "buy",
                 "type"   : "command",
                 "handler": "/handlers/buy",
             },
             {
                 "name"   : "sell",
                 "type"   : "command",
                 "handler": "/handlers/sell"
             }, 
             {
                 // ...
             }
         ]
     }],
     "profiles": [
         {
             "schema": {},
             "type": "banana"
         }, 
         {
             "schema": {},
             "type": "peel"
         }
     ]
 }
 ```

### Using Profiles

Imperative loads profiles into a profile management object. The object is passed to handlers for usage in a particular command and is available after "init" for the implementation to take advantage of a globally loaded profile.


[logging_config]: /packages/imperative/src/doc/IImperativeLoggingConfig.ts
