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
You create "Definition Documents" to define the syntax/help text for commands: For detailed information about defining & creating commands see the [Imperative CLI Framework wiki](https://github.com/zowe/imperative/wiki). For the definition interface, see[`ICommandDefinition` interface within the Imperative CLI Framework](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/ICommandDefinition.ts).

## Naming
For syntax segments `[objects]`, `[actions]`, `[objects]`, and `[options]` the following naming guiedelines should be followed. 
- Aim for consistency between commands and across groups and plug-ins. Look at what others have done and consider following existing conventions. Re-inventing the wheel often makes things harder for users to learn and remember syntax. An example is the use of the term 'list' for outputing information. We've seen variations such as print, echo, and view but we've generally settled on 'list.' 
- Use lower case for to make it easier to type commands. The CLI is case sensitive and mixed case introduces usability problems with typo errors. An exception to this is dataset names are which are not case-sensitive.
- Segment names should be descriptive so that the user has a clear idea of what is meant.
- `[actions]` are verbs. (e.g. "set", "run, "list", etc.)
- `[objects]` are nouns. (e.g. "data-set", "command", etc.)
- Hyphenated names should have an alias that is the first letter of each hyphenated word. (e.g. `access-method-services` aliased with `ams`)
    - Note, you should not hyphenate the name of a positional parameter due to limitations of Impretive framework. For more information, see [ICommandPositionalDefinition.ts](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/option/ICommandPositionalDefinition.ts). 
- Each segment should have an alias or shortcut (e.g., `data-set | ds`). The alias should be short because the reason for having it is to simplify the typing of commands. Ideally it would be somewhat semantic. Best NOT to choose a "random" letter (i.e `access-method-services` aliased by `z`).
    - Single letter aliases are typed with a single dash (e.g., -a) on the command line while multi-letter aliases require two dashes (e.g., --ac). So, single letter aliases are attractive because they are the easiest to type. 
    - We have cases of three names (e.g., password includes --password  | --pass | --pw). This example came about due to a desire to have compatibily across the core CLI and various plugins and the desire to use OS Environmental Variables to assign passwords across services such zOSMF. 

## Descriptions
For syntax segments `[objects]`, `[actions]`, `[objects]`, and `[options]` the following description guidelines should be followed. 
- Segments names need a summary & and full description.
- The `summary` is a one line, short description. This appears in the list of sub-segments on online help pages (e.g., Zowe root help lists the groups with their short descriptions. Zowe group help lists the actions with their descriptions. 
    - Do NOT include punctuation at the end of a summary description. 
- The full `description` is a longer description of the purpose, intent, & usage of the group, action, object, or option. It is ideal to include use cases that apply so people understand the practical value. There is some tension between clarity and length. People are turned off by long descriptions but they want to know what they would use a command to do. Customer calls have revealed that people struggle to understand what the the CLI is capable of and how they might use it so better descriptions are essential. 
- Descriptions should go beyond merely self referential (e.g., 'the job list command lists jobs' could be 'the job list command displays JCL data-sets on a LPAR'). You can expect users who are new to the underlying technology and may not know it in depth so the descriptions should inform and reveal the capabilities and function of the technology. 



## Examples
- Customer research and usability testing have revealed that examples are the single most importent element of the online help pages so they should be a priority to do well. 
- On the help page for an `[object]` definition, you should include at least one command example. Where there are multiple options, there should be examples to demonstrate each. 
- Ideally, the user should be able to copy/paste examples into the command line or a script. 
- Examples include one line descriptions that should explain the purpose. Where there are multiple examples, the description should provide the distinguishing details. 

### Additional Details about Options
- Most options include a an explicit name/option and a value/argument (e.g., --max-length 5). 
- Positional arguments are a special kind of option. They are values/arguments entered that have an implicit option name and are usually enteried immediately after the `object` (e.g., the file name in the list dataset command). These are usually required. A single positional argument is most common but some commands have multiple positional arguments that are entered space separated. It is not advisable to have mulitple positional arguments because then the user has to type several values in a row in the right order which can be error prone and hard to understand the proper syntax. Where there appears to be a need for multiple positional arguments, consider adding formal `option` names and make them required. 
- Required options are listed under a required options section. User research and usabilty testing have shown that required options are amongst the most important information in the online help pages so it is important to write good descriptions and include these in the examples.
- Non-required options are  listed under a options section. 
- The online help may include other categories of options for connecting to a service like zOSMF (e.g, `password`), setting profiles, and global options (e.g., `response-format-json`)
- Teams bulding commands and plug-ins should be mindful of the number of `[options]` because adding many options can add a lot of complxity and make it hard to use. In these cases, consider splitting a command into multiple commands. 
- Mutually exclusive options are two options that conflict and only one can be used. These can introduce usability problems. The use of both options can produce unpredicitable results or fail in error. The mutual exlusion with other options should be noted in the option description. 
- Dependencies between options can exist. These can introduce usability problems. The dependencies with other options should be noted in the option description.
- The arguments/values for an `option`  can sometimes take wildcards (e.g., a data-set name). The wildcard symbol is gnerally the asterisk * character. When building commands, consider using asterisk as the standard. 
- The argumetns/values can somtimes be quoted and can be a safer way to type the command. When writing examples, it is advisable to show arguments in quotes. 
- Some options take array values. The standard format is space separated. For more information, see [ICommandPositionalDefinition.ts](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/option/ICommandPositionalDefinition.ts).

### Abbreviated Command Structure 
Some commands have a shorter syntax. The authors of a command may have decided that a `object` isn't necessary. An example of this is the commands in the `plugins` group. 
#### Form: `zowe [group] [action] [options]`
#### Example: `zowe plugins list`
#### Example: `zowe plugins update my-plugin`
There is a tension here between consistency and ease of understanding. In the case of the plug-ins group, the syntax could have included a `obect` with the name plugin but that would be awkward (e.g., zowe plugins list plugins). We advise that teams use the full syntax in most cases but where it is better to have an abberviated syntax, apply to that to all commands in a `group` so that there is still a measure of consistency.

### The Lost Group Problem for Command Structure
When teams build plug-ins, the plug-in name ends up as the `group` name (e.g., zowe cics). This means that your plugin can't have groups or categories of commands. A workaround is to append a group name to the `action` name (e.g., catetory-action and jobs-list). This may or may not be desirable. To avoid actions with compound names, teams can create seperate plugins. 






