# Testing Guidelines

Zowe CLI uses the [jest] testing framework.

Generally speaking, tests should adhere to same lint rules and conventions as other code within the project.

## Test Locations

There are multiple folders in the project that are used for testing purposes. Folders used for testing will have the syntax of `__folder-name__` making them easier to spot.

At the root of the project there are currently 2 main folders:

- [\_\_tests\_\_](../__tests__): This folder contains
  - Test utilities
  - Resources for tests
  - Results of tests
- [\_\_mocks\_\_](../__mocks__): Defined by the [jest] framework as a place where entire `node_modules` can be mocked.

The actual test source will be found under each package's `__test__` directory. Every package must have a single `__test__` directory as a sibling folder to the package's `src` folder.

## Test Structure

This section covers all the common guidelines for unit, integration, and system testing.

- `describe` blocks within the test file should never contain a `.` character. The reason for this is that it will affect the reporting on the CI/CD pipeline because of how we are parsing the JUnit output. 

## Unit Testing

Unit testing is an important aspect for testing as it makes sure all of our underlying functions are properly tested before even being used together with other components. As such, here are the rules to keep in mind for unit testing:

- For every new TypeScript file that introduces a piece of functionality, a corresponding unit test needs to be created for it.
  - All unit test files should end with `.unit.test.ts` for test filtering purposes. Any unit test that doesn't end in this exact syntax will not be run in the CI/CD environment.
  - A package's `__tests__` folder should have the exact same directory structure as the `src` folder. (example: if you have `src/folder/another-folder`, then you should have `__tests__/folder/another-folder`)
  - With the 2 above things in mind, if there is a class under `src/folder/SomeClass.ts`, the corresponding unit test would be under `__tests__/folder/SomeClass.unit.test.ts`.
- Mocking should take place of any IO, network calls, or other calls to an outside component to isolate testing of the class that you're testing. Essentially, the only thing that should be tested is the class or function you are directly executing, all other external calls should be mocked (including calls to other project modules).
- Jest snapshots can be used as long as tests are deterministic.
- For abstract classes (where necessary, some abstracts have "base" implementations that will suffice for unit testing), create a `__model__` directory under `__tests__` directory and create a test implementation of the abstract class.

## Integration Tests
**Note:** Do NOT write integration tests until we get a proper delivery mechanism for the mock server.

Package/Plugin integration tests are divided into two categories:
- **API**: Invoking the REST/other public APIs directly (as an app, CI/CD environment, etc. would)
- **CLI**: Issuing commands via script/exec and ensuring correctness of output (as a user at their terminal/console would)

The intent of integration tests is to test all edge cases without having to rely on a specific system setup. Instead of sending the requests to one of your systems, you can do so to a mock server that can be modified on the fly. 

### Integration Test Layout
- Place integration tests under the packages `__tests__/__integration__` directory. 
  - Place **API** integration tests under `__tests__/__integration__/api`
  - Place **CLI** integration tests under `__tests__/__integration__/cli`
- Arrange **API** & **CLI** integration test directories to match the structure of your **API** & **CLI** src directories.
- Name **API** integration tests as `<api class name>.integration.test.ts`
- Name **CLI** integration tests as `cli.<group>.<action>.<object>.integration.test.ts`

## System Tests
Package/Plugin system tests are divided into two categories:
- **API**: Invoking our REST/other public APIs directly (as an app, CI/CD environment, etc. would)
- **CLI**: Issuing commands via script/exec and ensuring correctness of output (as a user at their terminal/console would)

The intent of system tests are to test the commands & APIs as they will be used in "real-world" scenarios. Meaning, system tests can/should manipulate the file-system, invoke remote services, etc. as the commands & APIs normally would. 

When writing CLI System tests, you can use the utilities in TestEnvironment.ts to create a temporary directory for logging, profiles, and other test data. 
Calling TestEnvironment.setUp gives you an environment from which to run CLI scripts. You can also ask it to automatically create profiles from your custom_properties.yaml file like so: 

```typescript
beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_submit_command",
            tempProfileTypes: ["zosmf"]
        });
        // you can access test properties on the TEST_ENVIRONMENT object
        psJclDataSet = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14PSDataSet;
        // you could also set environmental variables or use in running cli scripts 
        // for example TEST_ENVIRONMENT.env.some_key = some_value;

        // Retrieve properties from the profile
        const systemProps: TestProperties = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        const defaultSystem: ITestSystemSchema = systemProps.getDefaultSystem();

        // the zosmf profile is stored in defaultSystem.zosmf
    });

    afterAll(async () => {
        // delete any profiles that have been created 
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    }); 

```

Temporary profiles are created using a randomized profile name to avoid collision with any existing profiles you may be using. The Zowe CLI home environmental variable is automatically set to the temporary directory created in the TestEnvironment.setUp function. 
If you do request any temporary profiles being created, please be sure to call TestEnvironment.cleanUp in an afterAll block as shown in the example above.

If you run the tests and forgot to call TestEnvironment.cleanUp, killed the process before the afterAll jest hook could run, 
or otherwise prevented the profiles from being deleted, you can clean up these stranded profiles by running the command `npm run test:cleanUpProfiles`.

However, this script is dependent on the contents of the `__tests__/__results__/data`. If you have deleted that directory, you will have to clean up the credentials manually.

See `__tests__/__scripts__/clean_profiles.sh` for more information


### System Test Layout
- Place system tests under the packages `__tests__/__system__` directory. 
  - Place API system tests under `__tests__/__system__/api`
  - Place CLI system tests under `__tests__/__system__/cli`
- Arrange API & CLI system test directories to match the structure of your API & CLI src directories.
- Name API system tests as `<api class name>.system.test.ts`
- Name CLI system tests as `cli.<group>.<action>.<object>.system.test.ts`
- It is OK to invoke other APIs/CLIs in an system test (given the functionality exists within the same package)
  - E.g. `cli.zos-files.create.data-set.system.test.ts` may invoke delete functionality to "cleanup". 
  
### System Test CLI Scripts
- It is preferred that you create bash/shell scripts (`.sh` files) for CLI system tests. 
  - Scripts can be run manually by a developer outside of the system test (ease of debugging) 
  - Git bash is a good option for Windows platforms
- Place scripts in a `__scripts__` directory at the same level you would find `__snapshots__`.
- Make the scripts as complex as necessary to perform a "real-world" test scenario (e.g. download a source file from a data set, make changes using to the local file, re-upload)
- Perform negative (e.g. invalid parameters specified) and positive (e.g. create a data set) tests within scripts
- Test logic would submit the script and assert on the stdout/stderr (or effects that the script should have, such as downloading a file)

## Inter-Package Integration Tests
**TODO:** This section is under construction and not yet fully decided upon.

Inter-package integration tests should consist of "real-world" scenarios that involve multiple commands or APIs. For example, Creating a source data set, uploading an ASMPGM, compiling the ASMPGM, and running the ASMPGM.

[jest]: https://facebook.github.io/jest/
[Integration Tests]: ./packages/PackagesAndPluginGuidelines.md#integration-tests
[PackagesAndPluginGuidelines.md]: ./packages/PackagesAndPluginGuidelines.md
