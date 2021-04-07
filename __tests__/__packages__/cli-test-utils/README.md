# Test utils package

The Zowe CLI test utils package contains utilities that can be used by CLI plug-ins to automatically manage an environment for system tests.

## How to Use

The `TestEnvironment` class in this package can be used to easily set up and tear down a CLI plug-in test environment. Supported functionality includes:
* Load system test properties from YAML file
* Create and delete CLI profiles
* Install CLI plug-in from source
* Run Bash scripts that test CLI commands

See [Plugin Testing Guidelines](../../../docs/PluginTESTINGGuidelines.md#automated-test-utilities) for a detailed example of how to use the `TestEnvironment` class.

If you want additional functionality, the `TestEnvironment` class can be extended to add new behavior in the `setUp` and `cleanUp` methods.
