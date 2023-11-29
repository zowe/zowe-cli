# Change Log

All notable changes to the Zowe z/OS workflows SDK package will be documented in this file.

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `7.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items (if any) below for more details.

## `7.0.0-next.202112142155`

- Breaking: Removed deprecated methods:
  - listWorkflows -> getWorkflows
  - getResourcesQuery -> getResourceQuery
  - archiveWorfklowByKey -> archiveWorkflowByKey

## `6.35.0`

- Enhancement: Removed the misleading `workflow-name` option for the `zowe zos-workflows list definition-file-details` help example. [#659](https://github.com/zowe/zowe-cli/issues/659)

## `6.33.1`

- Development: Migrated from TSLint (now deprecated) to ESLint for static code analysis.

## `6.32.1`

- Updated Imperative version

## `6.25.0`

- Enhancement: Deprecate misspelled version of `ArchiveWorkflow.archiveWorkflowByKey`
- Bugfix: Remove "[object Object]" that appeared in some error messages

## `6.24.2`

- Revert: Revert changes made in 6.24.1, problem was determined to be bundling pipeline

## `6.24.1`

- Bugfix: Change SDK package structure to allow for backwards compatibility for some projects importing the CLI

## `6.24.0`

- Initial release
