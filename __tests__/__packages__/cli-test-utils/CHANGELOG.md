# Change Log

All notable changes to the Zowe CLI test utils package will be documented in this file.

## Recent Changes

- Corrected a attempt to re-throw an error with 'throw new Error(error)' which fails to compile with the latest version of typescript.

## `7.0.0-next.202107091339`

- Change private methods to protected in `TestEnvironment` class for easier extensibility

## `7.0.0-next.202104121327`

- Initial release
