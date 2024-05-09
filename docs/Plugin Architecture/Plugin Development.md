# Plugin Development

This document is geared more towards plugin developers and the things we will need to do to enable this. Most of the concepts in here are derived from items specified in the [Plugin Management] document.

In the aformentioned document, it is stated that a CLI implemented could override or extend the **Plugin Management Facility** in the future. This document will not take this into account and the concept will need to be revisited in the future so that it is a good experience for both users and developers alike.

***NOTE:** Code examples in this document are written in TypeScript since this is the languaged to be used by imperative. It is our recommendation for plugins to be developed in TypeScript but nothing prevents them from being developed in JavaScript. Because of this, the architecture defined must be extremely robust and plugins must be well structured.*

***NOTE:** Much of this structure can be observed in the [POC Application] that I have created to help me write these documents*

## Plugin Management Facility

The **Plugin Management Facility** or **PMF** for short, is responsible for maintaining plugins in a CLI implemented under **Imperative**. This is the facility that we will be developing to enable CLI developers to have plugins to their applications.

![Lifecycle][Plugin Workflow]

##### Legend

| Color  | Description                               |
|--------|-------------------------------------------|
| Green  | Steps already in the imperative framework |
| Gray   | [PMF Initialization]                      |
| Blue   | [Plugin Initialization]                   |
| Orange | File system usage of PMF                  |

### CLI Initialization

The first step in any CLI is for it to be initialized. This functionality will already exist but additional configuration will be needed for the PMF.

It will be possible for the PFM to be completely disabled, through configuration passed on initialization. The default is to enable the PMF, but individual CLI's can turn this functionality off entirely if they so choose. Below is some example code for disabling plugins:

```TypeScript
import { Imperative } from imperative';

try {
    await Imperative.init({
        definitions: [],
        name: 'cli',
        // ... other options

        // allowPlugins is the parameter that turns the PMF on or off.
        // In this scenario, the PMF is completely disabled.
        // When omitted, it is the same as specifing allowPlugins: true
        allowPlugins: false
    });

    // Other code...
} catch (e: Error) {
    // Handle error
}
```

### PMF Initialization

After the CLI is initialized, the PMF should be initialized when enabled.

If `allowPlugins` is false then the PMF is not initialized and the CLI should continue to parse the command and execute the handler. Since this is the end of PMF logic when plugins are disabled, the rest of the document assumes that the PMF is to be enabled.

No additional code should be needed by a CLI developer to enable the PMF. The initialization should be baked into the `Imperative.init` function. This means that the Imperative initialization function needs to be extended to support the 4 grey steps in the above flowchart.

#### Are plugins enabled?

This is a simple if condition that checks the value of `allowPlugins`. All other PMF initialization should be inside this if condition. 

##### Changes to `Imperative.init`
```TypeScript
import { PMF } from 'somewhere';

export class Imperative {
    static init(config?: ConfigType): void {
        // CLI initialization
        // ...
        if (config.allowPlugins) {
            PMF.init();
        }
        // ...
    }
}
```

#### Enable Plugin Command Group

This step will enable all of the commands that the PMF provides. Imperative will need to allow commands and groups after the initial initialization for this to work properly. (which is also needed for plugins themselves)

##### Sample Typescript:
```TypeScript
//PMF.ts
import { Imperative } from 'imperative';

export class PMF {
    static init(): void {
        Imperative.addDefinition([
            name       : 'plugin',
            type       : 'group',
            description: 'Plugin Management Facility',
            children   : [
                {
                    name       : 'install',
                    type       : 'command',
                    description: 'install a plugin'
                },
                {
                    name       : 'uninstall',
                    type       : 'command',
                    description: 'uninstall a plugin'
                },
                // ...
            ]
        ]);
    }
}
```

- `Imperative.addDefinition` is something that I don't believe currently exists in Imperative and we would need to create that.

#### Get Plugins Installed to Application

Next the PMF will need to get the plugins that are installed. This is done by reading a plugins.json file stored in the CLI home directory.

***NOTE:** Imperative has a concept of a home directory for the CLI so this file will be stored in there. More information on this can be found in [Plugin Data Management]*

##### Plugin JSON File

This is the file that is used to manage and load installed plugins. It is maintained by the various commands provided by the PMF.

###### Format

```TypeScript 
/**
 * This type defines the format of the input JSON of
 * plugins.json
 */
interface PluginJSON {
    /**
     * Each plugin should be a key in this object. It can 
     * be assumed that no two plugins will have the same
     * name as that will break the require structure.
     */
    [key: string]: PluginInfo
}

/**
 * This interface defines the information saved within each
 * plugin.
 */
interface PluginInfo {
    /**
     * This is the resolved package name. At this point, any
     * name or path resolving has been done so we will
     * always be able to reload the plugin with this info
     * if needed.
     *
     * Relative paths have been converted to absolute paths.
     *
     * Anything that is not a path is considered to be a
     * normal npm package
     */
    packageName: string;

    /**
     * The installed plugin version. Should be in the
     * semantic versioning format.
     */
    version: string;

    /**
     * The registry where the plugin was installed from.
     */
    registry?: string;
}
```

##### Sample Typescript:
```TypeScript
export class PMF {
    static init() {
        // Initialize PMF
        // ...

        PMF.initPlugins();
    }

    static initPlugins(): void {
        // Provide mechanism to read this from the home location
        const installedPlugins: PluginConfig = readFile('path/to/config/file');

        for (const installedPlugin in installedPlugins) {
            // Talk about this section later.
        }
    }
}
```

#### Are plugins installed?

This isn't really a check that gets explicitly done in code, but it still represents what happens when no plugins are installed. If plugins are not installed, then the PMF will hand control back to the CLI application to parse commands and execute the appropriate handler. If plugins are installed, the PMF continues on to initialize the installed plugins.

***NOTE:** This step was covered by the for loop in the previous TypeScript example*

### Plugin Structure

Before we continue to plugin initialization, perhaps it makes sense to talk about how a simple plugin is developed. 

Plugins cannot just be developed with the same freedom as a base CLI application, because of how they have to play nicely with the main application. It would be a bad user experience if a plugin is installed then prevents them from even using the base CLI. So plugins must follow a well defined structure to be useable by the base CLI.

The PMF also needs to be smart as well. Since plugin developers can do whatever they want without care, we need to be sure that their mistakes don't affect the overall CLI. Plugins can be written in both JavaScript and TypeScript so the PMF can not just assume that everything is there without handling the possibility of a missing implementation.

That's enough overview on the subject, how about we talk about the bare minimum that needs to be implemented for a plugin to be loaded by us?

#### Expected Plugin Structure

Similar to the `main` method in Java, a plugin will have to export a `Main` class. The PMF expects this class to be exported so that a `require(plugin).Main` can be done. The plugin will also need to implement a method called `init` which returns a JSON definition object (similar to the definition provided by the base CLI).

##### Typings

The following TypeScript interfaces covers all of the expected implementations that are needed for the barebones PMF.

```TypeScript
import { CommandDefinition } from 'imperative';

/**
 * Expected interface methods implemented on the Main
 * class. In a TypeScript plugin, it could be specified
 * as `export class Main implements PluginMain`. Nothing
 * is enforcing this though.
 */
export interface PluginMain {
    /**
     * This is called by the PMF and is responsible for
     * returning JSON that can add commands.
     */
    init: () => CommandDefinition[];
}

/**
 * This allows a class typed as PluginConstructor to be
 * initialized with the `new` keyword and that it will be
 * of type PluginMain.
 */
export interface PluginConstructor {
    new (): PluginMain;
}


/**
 * The format of the package root file. This is what needs
 * to be provided when require(plugin) is performed.
 */
export interface PluginRequire {
    /**
     * The main plugin class
     */
    Main: PluginConstructor;
}
```

#### Simple TypeScript Plugin

With all of the above information, a very basic TypeScript plugin would look something like this:

```TypeScript
import { 
    CommandDefinition
    PluginMain 
} from 'imperative';                       // Imperative Framework
import { someFunction } from 'cli';            // Function provided by a base CLI
import { anotherFunction } from 'npm-package'; // A function provided from a plugin specific package.

export class Main implements PluginMain {
    constructor() {
        // Do some plugin initialization here
        // Ideally, not much heavy lifting happens here to
        // allow for a much faster initialization process
        console.log('beep boop...CONSTRUCTING PLUGIN...boop boop beep!');
    }

    init(): CommandDefinition[] {
        someFunction();
        anotherFunction();

        return [
            {
                name       : 'new-group',
                type       : 'group',
                description: 'Group description',
                children   : [
                    {
                        name       : 'foo',
                        type       : 'command',
                        description: 'Adds a foo'
                    },
                    {
                        name       : 'bar',
                        type       : 'command',
                        description: 'Adds a bar'
                    },
                    // ...
                ]
            }
        ];
    }
}
```

***NOTE:** The init function of a plugin is responsible for defining the commands and groups that a plugin adds. A plugin cannot specify groups that already exist in the base CLI or other installed plugins. More on this in [Error Handling]*

***NOTE:** The typings could have easily been omitted and the main plugin class isn't forced to be Main. The PMF expects these types to have been implemented but it still needs to verify that they are actually there. In other words, it cannot blindly trust that a plugin implemented everything as it should.*

#### Simple JavaScript Plugin

Since plugins can also be written in JavaScript, the above plugin in JavaScript would look like this. Comments have been stripped out since they would be repeating the same thing.

```JavaScript
const { someFunction } = require('cli');
const { anotherFunction } = require('npm-package');

exports.Main = function() {
    console.log('beep boop...CONSTRUCTING PLUGIN...boop boop beep!');
    
    // This could have also been done with 
    // exports.Main.prototype.init, but this seems cleaner.
    this.init = () => {
        someFunction();
        anotherFunction();

        return [
            {
                name       : 'new-group',
                type       : 'group',
                description: 'Group description',
                children   : [
                    {
                        name       : 'foo',
                        type       : 'command',
                        description: 'Adds a foo'
                    },
                    {
                        name       : 'bar',
                        type       : 'command',
                        description: 'Adds a bar'
                    },
                    // ...
                ]
            }
        ];
    }
}
```
*Notice how all the typings aren't there. This is why the PMF needs to handle missing methods.*

### Plugin Initialization

Now that plugin development has been discussed, let's move on to how the PMF initializes plugins that are installed. Each plugin found in the plugins.json file will be loaded, instantiated, and then initialized under the following model:

```TypeScript
import { addDefinition } from 'imperative';

export class PMF {
    // ...
    static initPlugins(): void {
        // Provide mechanism to read this from the home location
        const installedPlugins: PluginConfig = readFile('path/to/config/file');

        for (const installedPlugin in installedPlugins) {
            // This works because plugins are installed to node_modules via npm install and
            // if you remember correctly, the key in PluginConfig is the name of the plugin
            // in node modules.
            const pluginModule: PluginRequire = require(installedPlugin);

            // Now because of typings defined in PluginRequire we know that a main class
            // exists inside of the require. This is why plugins have to export a class
            // called main. The new keyword can be used on this because of the typing
            // provided by the PluginConstructor.
            const plugin = new pluginModule.Main();

            // Recall that plugin.init returns a definition that can be used to add groups
            // to the cli. The addDefinition function is something that we need to implement
            // as part of the plugin effort.
            addDefinition(plugin.init());
        }
    }
}
```

***NOTE:** Inside the for loop, we are not guaranteed that anything actually exists. So we should probably wrap everything inside of a try/catch. Error information should not be output here, but it should be stored in some fashion so that the health command can use that as the problem. This way the command doesn't get broken and flood the terminal unless explicitly asked for.*

After the for loop completes, all plugins should be added to the base CLI. Some things to note about this though:

- Every plugin installed will increase the load time of the CLI due to the disk activity and extra code that the plugin has in the constructor and init method. Plugins should try to be as lightweight as possible in these methods to reduce the effect but we cannot control this in any way.
    - This implies that there is a point at which too many plugins would cause a bad user experience. We should try to get some optimal numbers and performance metrics across a wide variety of plugins.
- Plugins can only add new groups and cannot extend existing groups. This allieviates the issues that can occur where plugins are extending other plugins that extend other plugins by making this condition an error. Under this scenario, if a plugin attempts to modify a group that already exists, the addDefinition method should error and debug information should be stored for the health command.
    - Since plugins will be loaded in alphabetical order, the plugin that comes alphabetically first will win here and everything else will be in error. Unless of corse the plugin is trying to override a base group.

### Data Management

You might have noticed that I have been referring to a plugins.json file that is used when determining which plugins are installed, this file will reside inside the home directory that was specified by the base CLI. This is not the only file that will be stored here as plugins should be able to have a place for configuration and files of their own. With this in mind, a folder will be created in the home directory called **plugins** to store all of the files for plugins.

#### Plugins Folder Structure

- ~/plugins
    - plugins.json - see [Plugin JSON File]
    - ./config - Houses the global configuration options for a plugin set under the `cli config set` command.
        - module-a.json - global config for module-a plugin
        - module-b.json - global config for module-b plugin
        - ...
        - module-last.json - global config for module-last plugin
    - ./files - Houses any files that plugins need to create. Must be done through a utility.
        - ./module-a
            - Files for module-a plugin go here
        - ./module-b
            - Files for module-b plugin go here
        - ...
        - ./module-last
            - Files for module-last plugin go here

### Utilities

Plugins should have access to utility functions provided by the imperative framework to make development and management easier.

#### Logging

The base CLI will have a configurable logger provided by Imperative. This means that a plugin should never have to configure its own logger since one will already exist in the base CLI and so that the logging is consistent.

Imperative needs to export this logger and plugins can require this exported variable to get the logger. One possible way this could look:

```TypeScript
import { getLogger } from 'imperative';

export class APluginClass {
    private logger = getLogger();

    someMethod(): void {
        //...
        this.logger.log('Some stuff');
        //...
    }
}
```

#### Configuration

As described in the [Config Group] section of [Plugin Management], plugins should have the ability to store global configuration options through the `config` command. The setting of configuration options would be implemented and managed entirely by the imperative framework. While there will also be a corresponding `config get` command, which will also be implemented by imperative, plugins will need a quicker function to get their configuration options. The function that would be created in imperative would look something like this:

```TypeScript
/**
 * This function will get the config for a plugin specified.
 *
 * @param <T> This is the expected type of the configuration returned by the function. Plugins know the configuration
 *            format so they get to pass the type here as a generic.
 *
 * @param {string} pluginName The name of the plugin to get configuration for. This could also be a shorter prefix, I 
 *                            think it should be to allow for plugins to share, but it easier to talk in terms of
 *                            plugin names.
 *
 * @param {string} [variable] The variable to get out of the config. This string should be the same way you would access
 *                            a native JSON variable. I.E (a.x[1].b['test']). This doesn't have to be implemented right
 *                            away as omitting this will just return the entire object, but it helps when we get to
 *                            using defaults later.
 *
 * @param {T}      [default]  This is the default value to be used for a variable when the variable doesn't exist.
 *                            If not set, then the value returned when a variable doesn't exist is undefined. The
 *                            type must match the return type of the function. (defined by a generic)
 *
 * @returns {T} The value contained in the configuration
 */
export function getPluginConfig<T>(
    pluginName: string,
    variable?: string,
    default?: T
): T {
 //...implementation to be determined
}
```

The first iteration of this function could be to just accept the plugin name variable and make plugins go through the object returned. The additional functionality of getting a specific variable with defaults set is something that could be added later.

#### File Manipulation

Plugins may also need to do some file manipulation and these files should be stored under a common folder in the cli home directory. As mentioned above, these files would live in **~/plugins/files/&lt;plugin_name&gt;**. Plugins shouldn't be expected to  have to know this information, so two functions could be created to handle file reads and writes:

```TypeScript
/**
 * Reads a file saved by a plugin
 * 
 * @param {string} pluginName The name of the plugin that the file belongs to
 * @param {string} fileName The associated file name to retrieve
 * 
 * //... Additional options supported by the node read file go here
 *
 * @returns {string} The contents of the file
 *
 * @throws Error when something goes wrong
 */
export function readPluginFile(
    pluginName: string,
    fileName: string
    //... additional options supported by node read file go here
): string {
    //... implementation to be determined
}

/**
 * Writes a file for the plugin
 * 
 * @param {string} pluginName The name of the plugin that the file belongs to
 * @param {string} fileName The associated file name to write
 * @param {string | Buffer} contents File contents to write, should accept same types as node write command
 * 
 * //... Additional options supported by the node write file go here
 *
 * @throws Error when something goes wrong
 */
export function writePluginFile(
    pluginName: string,
    fileName: string,
    contents: string | Buffer
    //... additional options supported by node write file go here
): void {
    //... implementation to be determined
}
```

Using the above method, imperative would have more control over how files get written to the system. There is still another option for reading/writing though. A function could be provided to get the path where files should be read and written from and the plugin could then just use standard node read/write utilities. For transparency, the function mentioned would look something like this:

```TypeScript
/**
 * Returns the folder where plugin files are stored.
 *
 * @param {string} pluginName The name of the plugin requesting storage access
 * 
 * @returns {string} The adjusted path for the file.
 */
export function getPluginFilePath(pluginName: string): string{
    //... implementation to be determined
}
```

Under the above mechanism, more work is placed on the plugin for managing their folder and files. (e.g they wouldn't be guarenteed that the parent folder we give them exists for their plugin yet) Thus I believe it is better to provide accessor functions to reduce the amount of work each individual plugin needs to do and to provide consistency across plugins.

### Error Handling

Loading foreign code can be dangerous so the PMF needs to be careful to handle errors. Below are some of the errors that will need to be handled by the PMF:

- Missing the plugin `Main` class. 
    - Plugins need to export a well named main class so that the PFM can perform initialization.
- Missing methods
    - init or health
    - It is important that the PFM handle missing methods accordingly. It can't assume that all methods are in place.
- Missing the actual plugin code
    - It is possible that the plugin module could just disappear from the node_modules directory. The PMF needs to handle this error accordingly
- Plugin adds a group that already existed
    - A plugin should not be able to add a group that already exists. This should be an error.
    - It also cannot add any top-level aliases that conflict with other group names or other top-level aliases.

***NOTE:** All errors above should not be output at the time of the problem. It has been discussed that a health check type command will exist for plugins and this type of error information should be displayed then. This way the cli main execution doesn't become cluttered with errors and warnings from plugins but can be retrieved on demand.*

## Plugin Architecture

As stated above, in [Plugin Structure], plugins will need to follow a specific set of definitions for the PMF facility. We have already talked about what needs exported from the main file and what method is needed for plugin initialization. In addition to these things, at least two other methods should be implemented by plugins in the main class. One method is for a health check and the other is for repairing plugins. See the below TypeScript interface:

```TypeScript
/**
 * Severity levels for a plugin error
 */
export enum ErrorSeverity {
    WARNING,
    ERROR,
    FATAL
}

/**
 * This represents an error returned by the plugin's health method.
 */
export interface PluginError {
    /**
     * A message indicating the problem.
     *
     * @type {string}
     */
    message: string,

    /**
     * The severity of this error.
     * 
     * @type {ErrorSeverity}
     */
    severity: ErrorSeverity
}

export interface PluginMain {
    // Defined above
    init: () => CommandDefinition[];

    /**
     * This method is part of the health check functionality to be added later. This method is required to
     * be implemented, any plugin that doesn't implement this will have a warning under the health command.
     *
     * The Imperative PMF will call this method on a plugin when the helth command is executed on the base
     * CLI.
     * 
     * @returns {PluginError[]} This is an array of problems that the plugin is reporing. If a plugin
     *                          doesn't have any problems, then the array returned should be empty.
     */
    health: () => PluginError[];

    /**
     * This method is called by the repair command of the base CLI. This is an optional method that plugins
     * do not have to implement because it doesn't make sense for all plugins to have a repair option.
     * The purpose of this method is to give the plugin a chance to fix problems that may exist in a clean
     * way before an uninstall and reinstall is attempted.
     *
     * @returns {PluginError[]} This is an array of problems that the plugin is still reporting after the 
     *                          repair was attempted. It can also contain errors that happened during the
     *                          repair process. If the repair was successful, then this should be an
     *                          empty array.
     */
    repair?: () => PluginError[];
}
```

***NOTE:** Most of the above architecture contains plans for the future.*


[Plugin Management]: ./Plugin%20Management.md
[Plugin Lifecycle]: ./Plugin%20Management.md#plugin-lifecycle
[Config Group]: ./Plugin%20Management.md#config-group

[Plugin Workflow]: ./High_Level_Plugin_Workflow.png

[PMF Initialization]: #pmf-initialization
[Plugin Initialization]: #plugin-initialization
[Plugin Data Management]: #plugin-data-management
[Plugin JSON File]: #plugin-json-file
[Error Handling]: #error-handling
[Plugin Structure]: #plugin-structure