# Command Format Guidelines and User Experience Best Practices
This article provides standard conventions and best practices for command structure, naming, shortcuts, examples including descriptions (help text) in Zowe CLI and plug-ins. 

- [Command Structure](#zowe-cli-command-structure)
- [Command Definition Documents](#command-definition-documents)
- [Command Naming](#command-naming)
- [Command Descriptions](#command-descriptions)
- [Command Examples](#command-examples)
- [Additional Details about Options](#additional-details-about-options)
- [Abbreviated Command Structure](#abbreviated-command-structure)
- [The Lost Group Problem for Command Structure](#the-lost-group-problem-for-command-structure)

## Command Structure
Most `zowe` commands should adhere to the following complete structure. There are some exceptions described later in [Abbreviated Command Structure](#abbreviated-command-structure).

#### Form: `zowe [group] [action] [object] <positional argument> [options...]`

#### Example: `zowe zos-files list data-set 'mfuser.public.*' --attributes --max-length 5`

Segment | Definition Type | Description
--- | --- | ---
`zowe` | `root` - Specified as the executable "bin" name in package.json | The primary or root command for Zowe CLI.
`[group]` | `group` - Specified on Imperative `ICommandDefinition` "type" property | The group defines a category of related commands (for example, `zos-files` for access to data sets). Each group contains a set of `[actions]`.
`[action]` | `group` - Specified on Imperative `ICommandDefinition` "type" property | The action is a usually a verb (for example, `list`) that describes the operation and what it does.
`[object]` | `command` - Specified on Imperative `ICommandDefinition` "type" property | The object is usually a noun (for example, `data-set`) that identifies the entity on which the `[action]` is being performed. 
`[options]` | `options` - Specified on Imperative `ICommandDefinition` "options" & "positionals" properties | Options are additional properties that modify the command (for example, `max-length` to limit the number of results). Options are also known as flags or arguments.

## Command Definition Documents

You create "Definition Documents" to define the syntax/help text for commands. For detailed information about defining & creating commands see the [Imperative CLI Framework wiki](https://github.com/zowe/imperative/wiki). For the definition interface, see[`ICommandDefinition` interface within the Imperative CLI Framework](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/ICommandDefinition.ts).

## Naming Commands

Refer to the following guidelines for naming `[groups]`, `[actions]`, `[objects]`, and `[options]` in syntax:

- Aim for consistency between commands and across groups and plug-ins. Look at what others have done and consider existing conventions. Re-inventing the wheel often makes it difficult for users to learn and remember syntax. An example is the use of the term `list` for outputting information. We've seen variations such as `print`, `echo`, and `view`, but generally settled on a standard of `list`.

- Use lower case so that it is easier to type commands. The CLI is case sensitive and mixed case introduces usability problems with typos/errors. An exception is mainframe dataset name values, which are not case-sensitive.

- Segment names should be descriptive so that the user has a clear idea of the meaning/purpose.

- `[actions]` are verbs. for example, `set`, `run`, `list`, etc...

- `[objects]` are nouns. For example, `data-set`, `command`, etc..
    
- Each segment should have an alias or shortcut (for example,, `data-set | ds`). The alias should be short because the purpose is to simplify the typing of commands. Ideally, the alias should be semantic. Avoid choosing a "random" letter (i.e `access-method-services` aliased by `z`). 

    - For hyphenated names, define an alias that is the first letter of each hyphenated word. For example, `access-method-services` aliased with `ams`. Note that you should not hyphenate the name of a positional argument due to limitations of Imperative CLI Framework. For more information, see [ICommandPositionalDefinition.ts](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/option/ICommandPositionalDefinition.ts). 

    - Single letter aliases are typed with a single dash (for example, -a) on the command-line while multi-letter aliases require two dashes (for example, `--ac`). So, single letter aliases are attractive because they are the easiest to type. 

    - We have cases of three names/aliases (for example, password includes --password | --pass | --pw). This example came about due to a desire to have compatiblity across the core CLI and various plugins and the desire to use OS Environmental Variables to assign passwords across services such zOSMF. 

## Command Descriptions

Refer to the following guidelines when writing descriptions for syntax segments `[group]`, `[actions]`, `[objects]`, and `[options]`:

- Segments names require both a summary and full description.

- The `summary` is a one line, short description. This appears in the list of sub-segments on online help pages (for example, Zowe root help lists the groups with their short descriptions. Zowe group help lists the actions with their descriptions.
   
    - Do NOT include punctuation at the end of a summary description for consistency.

- The full `description` explains the purpose, intent, & usage of the group, action, object, or option. Ideally, include use cases that apply so that people understand the practical value. There is some tension between clarity and length. Extremely long descriptions can clutter the interface, but users want to know what they can accomplish with a given command. Some end users have indicated that they struggle to understand what the CLI is capable of and how they might use it, so good descriptions are essential.

- Descriptions should go beyond merely self referential (For example, "The job list command lists jobs" could be better written as "the job list command displays JCL data-sets on an LPAR"). Some users are unfamiliar with the underlying technology of the CLI and mainframe, so the descriptions should inform and reveal the capabilities and function of the technology.

## Command Examples

Research and usability testing has revealed that examples are the single most important element of the online help pages. Adding useful examples should be a priority.

- On the help page for an `[object]` definition, you should include at least one command example. Where there are multiple options, there should be examples to demonstrate each.

- Ideally, the user should be able to copy/paste examples into the command line or a script.

- Examples include one-line descriptions that should explain the use-case that the command fulfills. Where there are multiple examples, the description should distinguish between them.

## Additional Details about Options

- Most options include a an explicit name/option and a value/argument (for example, `--max-length 5`).

- Positional arguments are a special kind of option. They are values/arguments entered that have an implicit option name and are usually entered immediately after the `object` (for example, the file name in the `zowe zos-files list dataset` command). These are usually required arguments. A single positional argument is most common but some commands have multiple positional arguments that are entered space-separated. We do not advise having multitple positional arguments because then the user must type several values in a row in the correct order, which can be error prone and hard to understand the proper syntax. Where there appears to be a need for multiple positional arguments, consider adding formal `option` names and make them required. 

- Required options are listed under a Required Options section in the help. User research and usability testing have shown that statements explaining which options are required is among the most useful information in the online help pages, so it is important to write good descriptions and include these in the examples.

- Non-required options are listed under an Options section in the help.

- The help may include other categories of options for connecting to a service such as z/OSMF (for example, `--password`), setting profiles, and global options (for example,`response-format-json`)

- Teams building commands and plug-ins should be mindful of the number of `[options]`, because adding many options can add complexity to the commands and reduce usability. In these cases, consider splitting a command into multiple commands.

- Mutually exclusive options are two options that conflict and only one can be used. These can introduce usability problems. The use of both options can produce unpredictable results or fail in error. The mutual exclusion with other options should be noted in the option description. 

- Dependencies between options can exist (if you specify one, you must specify the other, for example). This can introduce usability problems. The dependencies with other options should be noted in the option description.

- The arguments/values for an `option`  can sometimes take wildcards (for example, a data-set name). The wildcard symbol is generally the asterisk * character. When building commands, consider using asterisk as the standard.

- The arguments/values can sometimes include quotes and can be a safer way to type the command. When writing examples, it is advisable to show arguments in quotes.

- Some options take array values. The standard format is space separated. For more information, see [ICommandPositionalDefinition.ts](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/option/ICommandPositionalDefinition.ts).

## Abbreviated Command Structure 

Some commands have a shorter syntax. The authors of a command might have decided that a `object` isn't necessary. An example is the commands in the `plugins` group. 

#### Form: `zowe [group] [action] [options]`
#### Example: `zowe plugins list`
#### Example: `zowe plugins update my-plugin`

There is a tension here between consistency and ease of understanding. In the case of the plug-ins group, the syntax could have included a `object` with the name plugin but that would be awkward (for example, zowe plugins list plugins). We advise that teams use the full syntax in most cases but where it is better to have an abbreviated syntax, apply to that to all commands in a `group` so that there is still a measure of consistency. 

## The Lost Group Problem for Command Structure
When teams build plug-ins, the plug-in name ends up as the `group` name (for example, zowe cics). This means that your plugin can't have groups or categories of commands. A workaround is to append a group name to the `action` name (for example, category-action and jobs-list). This may or may not be desirable. To avoid actions with compound names, teams can create separate plug-ins. 
