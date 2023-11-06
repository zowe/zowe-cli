# Imperative CLI Framework Environment Variables
The Imperative CLI Framework allows configuration of various global properties by setting environment variables before issuing commands. This enables the user of your CLI to easily modify behaviors of your CLI, such as logging levels, without requiring you to make changes to your CLI code.

## Naming Conventions
Imperative CLI Framework automatically generates configuration environment variables using your Imperative CLI name as the prefix. For example, `mycli` - which is either specified on your Imperative configuration `name` property or (if not specified on `name`), it is captured from your package.json `name` property.

Imperative CLI Framework generates environment variables using the following format:   
`<prefix>_<ENV_VAR_SUFFIX>`

You can override the default prefix by specifying the prefix using the Imperative configuration `envVarPrefix` property. 

**Note:** When you allow Imperative CLI Framework to default to using your CLI name as the prefix, ensure that you use characters in the name of your CLI that are valid characters for environment variables. This stipulation also applies to using the prefix property. No transformation/validation will be performed.

## Automatically Generated ENV Configuration Variables

### Log Levels
Env Variable | Description | Values | Default
---|---|---|---
\<prefix\>\_APP\_LOG\_LEVEL | Application logger level (for example, your CLI built on Imperative) | Log4JS log levels (OFF, TRACE, DEBUG, INFO, WARN, ERROR, FATAL) | DEBUG
\<prefix\>\_IMPERATIVE\_LOG\_LEVEL | Imperative core logger level (i.e. internal imperative) | Log4JS log levels (OFF, TRACE, DEBUG, INFO, WARN, ERROR, FATAL) | DEBUG

**Note:** Setting the log level to TRACE or ALL may result in "sensitive" data being logged. For example, command line arguments will be logged when TRACE is set.