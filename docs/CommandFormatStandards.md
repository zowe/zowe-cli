# Command Format Standards
This article is a living summary of conventions and best practices for command and option descriptions (help text) in Zowe CLI and plug-ins. 

- [Command Structure](#zowe-cli-command-structure)
- [Command Definition Documents](#command-definition-documents)
- [Syntax/Naming Conventions](#syntax-naming-conventions)

## Command Structure
Most `zowe` commands adhere to the following consistent structure:

# `zowe [group] [action] [object] [options]`

Segment | Definition Type | Description
--- | --- | ---
`zowe` | `root` - Specified as the executable "bin" name in package.json | The primary or root command for the Zowe CLI.
`[group]` | `group` - Specified on Imperative `ICommandDefinition` "type" property | The `[group]` defines a category of related commands (e.g. `zos-files`). Groups contain a set of `[actions]`.
`[action]` | `group` - Specified on Imperative `ICommandDefinition` "type" property | The `[action]` is the command verb (e.g. `list`).
`[object]` | `command` - Specified on Imperative `ICommandDefinition` "type" property | The `[object]` is the entity on which the `[action]` is being performed (e.g. `data-set`). 
`[options]` | `options` - Specified on Imperative `ICommandDefinition` "options" & "positionals" properties | The `[options]` are the set of flags/switches & positional parameters for the command.

**Example Command:**
`zowe zos-files download data-set "HLQ.LLQ"`

## Command Definition Documents

You create "Definition Documents" to define the syntax/help text for commands:

For detailed information about defining & creating commands see the [Imperative CLI Framework wiki](https://github.com/zowe/imperative/wiki).

For the definition interface, see[`ICommandDefinition` interface within the Imperative CLI Framework](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/ICommandDefinition.ts).

## Syntax/Naming Conventions

- Keep `[options]` (flags, switches, positional parms) to a minimum. Split into multiple commands (`[object]`) if the options become cumbersome. 
- Keep option syntax "logic" (only specify one, mutually exclusive parameters, etc.) to a minimum.
- Keep descriptions brief & relevant. 
- Hyphenated `[options]`, `[actions]`, or `[objects]` should have an alias that is the first letter of each hyphenated word. (e.g. `access-method-services` aliased with `ams`)
- Use lower case
- Names should be descriptive (i.e. the user should have a general/good idea of what the name means)
- `[groups]`, `[actions]`, & `[objects]` must have a summary & and full description 
    - The `summary` is a very short (~6 word) description
        - Do NOT include punctuation at the end of a summary
    - The `description` is a full description of the purpose/intent & usage of the command/group/option and should include any "need to know" information about the command/group/option
-  On an `[object]` definition, you must include at least one command example
    -  Ideally, the user should be able to copy/paste the example

#### `[action]` & `[object]` Naming Conventions
- `[actions]` are verbs. (e.g. "set", "run, "list", etc.)
- `[objects]` are nouns. (e.g. "data-set", "command", etc.)
- Hyphenate multiple words (e.g. `access-method-services`)
    - Except for positional parameter definitions, (limitation of yargs) which do not use hyphens. For more information, see [ICommandPositionalDefinition.ts](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/option/ICommandPositionalDefinition.ts). 

#### `[option]` Naming Conventions
- If possible, give options (especially flags), a one character alias. 
    - Do NOT choose a "random" letter (i.e `access-method-services` aliased by `z`)





