# Command Format Guidelines and User Experience Best Practices
This article is a living summary of conventions and best practices for command syntax including descriptions (help text) in Zowe CLI and plug-ins. 

## Contents
- [Command Structure Guidelines](#command-structure-guidelines)
- [Command Naming Guidelines](#command-naming-guidelines)
- [Command Description and Help Text Guidelines](#command-description-and-help-text-guidelines)

## Command Structure Guidelines
This document is intended to be a living summary document of conventions & best practices for command definition & structure within Zowe CLI & plugins to Zowe CLI.

**NOTE:** Some rules & conventions noted in this document will be enforced via runtime validation (not yet implemented).

### Zowe CLI Command Structure
Zowe CLI command structure is based on competitive research of similar CLIs (Aws, Microsoft Azure, Google CloudPlatform).

All `zowe` commands adhere to the following consistent structure:

### `zowe [group] [action] [object] [options]`
Segment | Definition Type | Description
--- | --- | ---
`zowe` | `root` - Specified as the "bin" name in package.json | The primary/root command for the Zowe CLI.
`[group]` | `group` - Specified on Imperative `ICommandDefinition` "type" property | The `[group]` defines a set of logically related commands (e.g. `zos-files`). Groups contain a set of `[actions]`.
`[action]` | `group` - Specified on Imperative `ICommandDefinition` "type" property | The `[action]` is the command verb (e.g. `list`).
`[object]` | `command` - Specified on Imperative `ICommandDefinition` "type" property | The `[object]` is the entity on which the `[action]` is being performed (e.g. `data-set`). 
`[options]` | `options` - Specified on Imperative `ICommandDefinition` "options" & "positionals" properties | The `[options]` are the set of flags/switches & positional parameters for the command.

**Example Command:**
`zowe zos-files download data-set "HLQ.LLQ"`

### Command Definition Document
Zowe CLI is built using the Imperative CLI Framework. For details on defining & creating commands see the [Imperative CLI Framework wiki](https://github.com/zowe/imperative/wiki). For details on the definition document see the [`ICommandDefinition` interface within the Imperative CLI Framework](https://github.com/zowe/imperative/blob/master/packages/cmd/src/doc/ICommandDefinition.ts).

### General Command Guidelines
- Keep `[options]` (flags, switches, positional parms) to a minimum. Split into multiple commands (`[object]`) if the options become cumbersome. 
- Keep option syntax "logic" (only specify one, mutually exclusive parameters, etc.) to a minimum.
- Keep descriptions brief & relevant. 
- See [Command Description Guidelines](#command-description-guidelines) for command/option description & help text guidelines.
- See [Command Naming Guidelines](#command-naming-guidelines.md) for command/option naming guidelines.

## Command Naming Guidelines
This document is intended to be a living summary document of conventions & best practices for command & option naming within Zowe CLI & plugins to Zowe CLI.

**NOTE:** Some rules & conventions noted in this document will be enforced via runtime validation (not yet implemented).

### Naming Conventions
#### General Naming Conventions
- Hyphenated `[options]`, `[actions]`, or `[objects]` should have an alias that is the first letter of each hyphenated word. (e.g. `access-method-services` aliased with `ams`)
- Use lower case
- Names should be descriptive (i.e. the user should have a general/good idea of what the name means)
#### `[action]` & `[object]` Naming Conventions
- `[actions]` are verbs. (e.g. "set", "run, "list", etc.)
- `[objects]` are nouns. (e.g. "data-set", "command", etc.)
- Hyphenate multiple words (e.g. `access-method-services`)
    - Except positional parameter definition (limitation of yargs)
#### `[option]` Naming Conventions
- If possible, give options (especially flags), a one character alias. 
    - Do NOT choose a "random" letter (i.e `access-method-services` aliased by `z`)

## Command Description and Help Text Guidelines
This document is intended to be a living summary document of conventions & best practices for command & option descriptions (help text) within Zowe CLI & plugins to Zowe CLI.

### Description & Help Text Guidelines
- `[groups]`, `[actions]`, & `[objects]` must have a summary & and full description 
    - The `summary` is a very short (~6 word) description
        - Do NOT include punctuation at the end of a summary
    - The `description` is a full description of the purpose/intent & usage of the command/group/option and should include any "need to know" information about the command/group/option
-  On an `[object]` definition, you must include at least one command example
    -  Ideally, the user should be able to copy/paste the example



