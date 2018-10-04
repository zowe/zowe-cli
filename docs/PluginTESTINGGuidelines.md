# Zowe CLI Plug-in Testing Guidelines
This document is intended to be a living summary of conventions and best practices for development within Zowe CLI or development of Zowe CLI plug-ins.

## Contents
- [Automated Tests](#automated-tests)
- [Unit Tests](#unit-tests)
- [System and Integration Tests](#system-and-integration-tests)


## Automated Tests

This plugin has two groups of tests that can be run separately:

* unit tests 
* system and integration tests.

All automated test suite file names should end in `.test.ts`. 

To run all automated tests, use the command `npm run test`.

## Unit tests 

Unit tests test the logic of your code without interacting with any back end servers or modifying the file system. 
Dependencies, web APIs, file system functions, and so on should all be mocked with jest's mocking functionality. 

Unit tests are run with the npm script `test:unit` which is run via the command `npm run test:unit`.

Unit tests are stored under the directory `__tests__` in the project root.  
You should duplicate the directory structure of file you are unit testing within this folder. 
For instance, if you are testing the file `src/api/MyAPI.ts`, you should create the file `__tests__/api/MyAPI.test.ts`. 


## System and Integration Tests
System and integration tests are stored under the `__tests__/__system__` directory. These tests execute commands from your plugin and communicate with the relevant back end server, if any.

**Note:** You must run `npm run build` before you can successfully run the system/integration tests, because the plugin must be able to be installed from compiled source during the tests.

In addition to Node.js, you must have a means to execute ".sh" (bash) scripts (required for running integration tests). On Windows, you can install "Git Bash" (bundled with the standard [Git](https://git-scm.com/downloads) installation - check "Use Git and Unix Tools from Windows Command Prompt" installation option).

After downloading/installing the prerequisites ensure you can perform the following (and receive success responses):
1. `node --version`
2. `npm --version`
3. On Windows: `where sh`

To run the plug-in system tests, you require a configured properties file with proper system information present. 

A dummy properties file is present in the `__tests__/__resources__/properties` folder, `example_properties.yaml`. Using this
file as a template, create a `custom_properties.yaml` file within the same directory.

You can modify example_properties.yaml to include whatever properties are necessary for running your system tests, such as connection information to back end servers. If you update example_properties.yaml, please provide comments to explain each property or group of properties, and update the `ITestPropertiesSchema.ts` interface to reflect the new or changed properties. The ITestPropertiesSchema file is an interface used from your test to allow compile-time checking of references to test properties, so it should always be up to date with example_properties.yaml.

***Important!** NEVER CHECK-IN A CONFIGURED PROPERTIES FILE, AS SECURITY PRINCIPALS AS WELL AS OTHER CRITICAL INFORMATION IS PRESENT!*

You can run the system tests by issuing: `npm run test:system`.

If the `custom_properties.yaml` file cannot be found or loaded,
an error with relevant details will be thrown.

### Types of System and Integration Tests 

There are two main types of system tests that you will want to write for your plug-in. Remember to end all of your test files in both categories with either `.system.test.ts` or `.integration.test.ts`. 

API system tests, stored under the `__tests__/__system__/api` directory, exercise the Typescript APIs you write for your plugin, by connecting to a real instance of any back end APIs.

CLI tests use `.sh` shell script files in order to issue commands exposed by your plug-in. The philosophy behind these tests is that the environment should be as close as possible to how the end user will issue your commands. So even though it may be possible to install your plug-in as a stand-alone CLI for testing purposes, we recommend that you test your plug-in commands installed into Zowe CLI. 

You run these scripts using the `runCliScript` utility available in `TestUtils.ts`. 

So an example script file would be:
``` bash
#!/bin/bash
set -e # fail the script if we get a non zero exit code
directory=$1 
zowe bp-sample list directory-contents "$directory"
```
### Automated Test Utilities

A number of test utilities are available to you to aid in writing automated tests for your plug-in. 

TestEnvironment.ts contains functionality for creating an isolated environment from which to test your CLI. A new directory under `__tests__/__results__/data` is created, and logs, installed plugins, and profiles are stored under this directory. Your CLI home is automatically set to this new directory when using the `runCliScript` function from `TestUtils.ts`, so any plugins or profiles that you use with your globally installed copy of Zowe CLI will not interfere with running the tests. 

In your system test files, set up and clean up your test environment with  a call to `TestEnvironment.setUp` and `TestEnvironment.cleanUp` as shown in the following example. After you call `TestEnvironment.setUp`, you can access the values of the system properties, and also use the working directory

Example use of TestEnvironment.ts: 
``` typescript

let testEnvironment: ITestEnvironment; 
let myTestFile: string;
describe ("my tests", =>{ 

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            installPlugin: true, // install our plugin into the test environment working directory so that we can issue plugin commands
            testName: "fail_command", // this influences the name of the generated directory 
            tempTestProfiles: ["zosmf"] // create a zosmf profile from the settings in the custom_properties.yaml file
        });

        // access any of the test properties
        const user = testEnvironment.systemTestProperties.zosmf.user;

        // access the working directory from your test environment to save temporary test-related files 
        myTestFile = testEnvironment.workingDir +"/myTestFile.txt";
    });
    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
         // cleans up installed plugins and created profiles but doesn't delete the directory
         // in case you need to reference any of the files after the tests run 
    });
    //... your tests here ... 
});

```

For more information, JSDoc documentation is available on the functions and interface in `TestEnvironment.ts` and `ISetupEnvironmentParms.ts`. 

If your plugin introduces any new types of configuration profiles, see and update `TempTestProfiles.ts` (along with example_properties.yaml and ITestPropertiesSchema.ts) so that your tests can automatically create and delete profiles based on your properties. `// TODO` comments have been placed in TempTestProfiles in locations you may need to update. 