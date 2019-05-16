# Command Format Standards
This article is a living summary of conventions and best practices for command and option descriptions (help text) in Zowe CLI and plug-ins. 

- [Command Structure](#zowe-cli-command-structure)
- [Command Definition Documents](#command-definition-documents)
- [Syntax/Naming Conventions](#syntax-naming-conventions)

## Command Structure
Most `zowe` commands adhere to the full structure. An abbreviated structure is explained following. 

#### Form: `zowe [group] [action] [object] [options]`
#### Example: `zowe zos-files list data-set 'mfuser.public.*' --attributes --max-length 5`

Segment | Definition Type | Description
--- | --- | ---
`zowe` | `root` - Specified as the executable "bin" name in package.json | The primary or root command for the Zowe CLI.
`[group]` | `group` - Specified on Imperative `ICommandDefinition` "type" property | The group defines a category of related commands (e.g. `zos-files` for access datasets). Each group contains a set of `[actions]`.
`[action]` | `group` - Specified on Imperative `ICommandDefinition` "type" property | The action is a usually a verb (e.g. `list`) that describes the operation or what it is meant to do. 
`[object]` | `command` - Specified on Imperative `ICommandDefinition` "type" property | The object is usually a noun (e.g. `data-set`) that idenifies the entity on which the `[action]` is being performed. 
`[options]` | `options` - Specified on Imperative `ICommandDefinition` "options" & "positionals" properties | Options are additional properties that modify the command (e.g., `max-length` to limit the number of results).  Options are also known as paramters, flags, switches, properites, and arguments. 

## Command Definition Documents

You create "Definition Documents" to define the syntax/help text for commands:

For detailed information about defining & creating commands see the [Imperative CLI Framework wiki](https://github.com/zowe/imperative/wiki).

For the definition interface, see[`ICommandDefinition` interface within the Imperative CLI Framework](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/ICommandDefinition.ts).

### Additional Details about Options
- Most options include a name/option and a value/argument (e.g., --max-length 5). 
- Positional arguments are a special kind of option. They are values/arguments entered that don't have an explicit option name and are usually enteried immediately after the `object` (e.g., the file name in the list dataset command). These are usually required.
- Required options are listed under a required options section. Other options are just listed under a options section. 
- The online help may include other categories of options for connecting to a service like zOSMF (e.g, `password`), setting profiles, and global options (e.g., `response-format-json`)
- Teams bulding commands and plug-ins should be mindful of the number of `[options]` because adding many options can add a lot of complxity and make it hard to use. In these cases, consider splitting a command into multiple commands. 
- Mutually exclusive options are two options that conflict and only one can be used. These can introduce usability problems. The use of both options can produce unpredicitable results or fail in error. The mutual exlusion with other options should be noted in the option description. 
- Dependencies between options can exist. These can introduce usability problems. The dependencies with other options should be noted in the option description.

### Abbreviated Command Structure 
Some commands have a shorter syntax. The authors of a command may have decided that a `object` isn't necessary. An example of this is the commands in the `plugins` group. 
#### Form: `zowe [group] [action] [options]`
#### Example: `zowe plugins list`
#### Example: `zowe plugins update my-plugin`
There is a tension here between consistency and ease of understanding. In the case of the plug-ins group, the syntax could have included a `obect` with the name plugin but that would be awkward (e.g., zowe plugins list plugins). We advise that teams use the full syntax in most cases but where it is better to have an abberviated syntax, apply to that to all commands in a `group` so that there is still a measure of consistency.

### The Lost Group Problem for Command Structure
When teams build plug-ins, the plug-in name ends up as the `group` name (e.g., zowe cics). This means that your plugin can't have groups or categories of commands. A workaround is to append a group name to the `action` name (e.g., catetory-action and jobs-list). This may or may not be desirable. To avoid actions with compound names, teams can create seperate plugins. 

## Naming Conventions
- Use lower case for `[options]`, `[actions]`, and `[objects]`
- Names should be descriptive so that the user has a clear idea of what the name means.
- Hyphenated `[options]`, `[actions]`, or `[objects]` should have an alias that is the first letter of each hyphenated word. (e.g. `access-method-services` aliased with `ams`)
- `[groups]`, `[actions]`, & `[objects]` need a summary & and full description 
    - The `summary` is a very short (~6 word) description
    - Do NOT include punctuation at the end of a summary
    - The `description` is a full description of the purpose/intent & usage of the command/group/option and should include any 
-  On an `[object]` definition, you must include at least one command example
    -  Ideally, the user should be able to copy/paste the example

- Keep descriptions brief & relevant. 
* 
shortcuts
quotes

#### `[action]` & `[object]` Naming Conventions
- `[actions]` are verbs. (e.g. "set", "run, "list", etc.)
- `[objects]` are nouns. (e.g. "data-set", "command", etc.)
- Hyphenate multiple words (e.g. `access-method-services`)
    - Except for positional parameter definitions, (limitation of yargs) which do not use hyphens. For more information, see [ICommandPositionalDefinition.ts](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/option/ICommandPositionalDefinition.ts). 

#### `[option]` Naming Conventions
- If possible, give options (especially flags), a one character alias. 
    - Do NOT choose a "random" letter (i.e `access-method-services` aliased by `z`)





