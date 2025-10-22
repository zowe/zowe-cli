# Change Log

All notable changes to the Imperative package will be documented in this file.

## Recent Changes

- Enhancement: Added support for providing options to both default and custom credential managers. [#2601](https://github.com/zowe/zowe-cli/issues/2601) 

## `8.27.4`

- BugFix: Updated minimum supported version of Node from 18 to 20. Added Node 24 support. [#2616](https://github.com/zowe/zowe-cli/pull/2616)

## `8.27.2`

- BugFix: Fixed an issue where carriage returns before new lines were unexpectedly preserved when uploading to a USS file or data set. [#2606](https://github.com/zowe/zowe-cli/issues/2606)

## `8.27.1`

- BugFix: The Imperative framework adds the value in the `set-cookie` response header to the `_availableCreds` property in the `ISession` object. [#2605](https://github.com/zowe/zowe-cli/pull/2605)

## `8.27.0`

- Enhancement: Added the ability to censor headers to the `Censor` class. [#2600](https://github.com/zowe/zowe-cli/pull/2600)
- BugFix: Censored base64 credential information from the `appendInputHeaders` function's trace log in the `AbstractRestClient` when the `Authorization` header is set. [#2598](https://github.com/zowe/zowe-cli/issues/2598)
- BugFix: Stopped logging the token into the trace log when using cookie based token authentication in the `AbstractRestClient`. [#2598](https://github.com/zowe/zowe-cli/issues/2598)

## `8.26.2`

- BugFix: Added a validity check in the `ProfileInfo` class `mergeArgsForProfile` method to ensure the base profile exists before merging its values. This prevents Zowe Explorer UI loading errors when a non-existent base profile is referenced. [#2575](https://github.com/zowe/zowe-cli/pull/2575)

## `8.26.0`

- Enhancement: Added the following `AuthOrder` functions: `getPropNmFor`, `putNewAuthsFirstInSess`, `putNewAuthsFirstOnDisk`, `formNewAuthOrderArray`, `authArrayToCfgVal`, `authCfgValToArray`. No external behavior is changed by this addition to/refactoring of the Zowe SDK logic. [#2568](https://github.com/zowe/zowe-cli/pull/2568)
- Enhancement: When no credentials are available, prompt for the credentials related to the first entry in the `authOrder` property instead of arbitrarily prompting for user and password. [#2568](https://github.com/zowe/zowe-cli/pull/2568)
- Enhancement: Reordered `authOrder` information in error messages to be easier for a user to follow the effect of the `authOrder`. [#2568](https://github.com/zowe/zowe-cli/pull/2568)
- BugFix: Fixed invalid value for npm log level when `--verbose` option is true on the `zowe plugins install` command. [#2571](https://github.com/zowe/zowe-cli/pull/2571)

## `8.25.0`

- Enhancement: Added `--verbose` option to the `zowe plugins install` command to make debugging easier. [#2562](https://github.com/zowe/zowe-cli/pull/2562)
- Enhancement: Added `spawnWithInheritedStdio` method to `ExecUtils` which inherits output instead of piping it. [#2562](https://github.com/zowe/zowe-cli/pull/2562)

## `8.24.6`

- BugFix: Updated the web help generator logic to fix links with special characters [#2553](https://github.com/zowe/zowe-cli/issues/2553) [#2308](https://github.com/zowe/zowe-cli/issues/2308)

## `8.24.5`

- BugFix: Resolved an issue where streaming uploads of special characters could result in data corruption at chunk boundaries [#2556](https://github.com/zowe/zowe-cli/issues/2555)

## `8.24.1`

- BugFix: Fixed an issue with the `zowe config` commands to ensure correct user input handling. [#2519](https://github.com/zowe/zowe-cli/issues/2519)

## `8.23.1`

- BugFix: Updated the `brace-expansion` dependency for technical currency. [#2523](https://github.com/zowe/zowe-cli/pull/2523)

## `8.22.0`

- Enhancement: Updated the Zowe Client REST APIs to obey the choice of authentication specified by a user. [#2491](https://github.com/zowe/zowe-cli/pull/2491)
- BugFix: Fixed issue where Imperative integration tests can fail due to a missing `glob` dependency. [#2511](https://github.com/zowe/zowe-cli/pull/2511)

## `8.21.0`

- Enhancement: Updated the `Logger` class to support the `winston` library, and introduced migration tools to switch from `log4js` to `winston`. For more information on how to migrate your logger instance to use the `winston` library, refer to the ["Configuring logging" page](https://github.com/zowe/zowe-cli/wiki/Configuring-Logging) on the Zowe CLI wiki. [#2488](https://github.com/zowe/zowe-cli/issues/2488)
- BugFix: Fixed an issue where downstream dependencies using `log4js` have their log output redirected after creating an instance of the `ProfileInfo` class. [#2488](https://github.com/zowe/zowe-cli/issues/2488)

## `8.20.0`

- Enhancement: Added a request timeout to the Imperative REST client. [#2490](https://github.com/zowe/zowe-cli/pull/2490)
- Enhancement: Added the `ZOWE_REQUEST_COMPLETION_TIMEOUT` environment variable to the `EnvironmentalVariableSettings` class to allow extenders to determine how long to wait for a request to complete before timing out. [#2490](https://github.com/zowe/zowe-cli/pull/2490)

## `8.19.0`

- Enhancement: Added a connection timeout to the Imperative REST Client, with a default of 60 seconds. [#2486](https://github.com/zowe/zowe-cli/pull/2486)
- Enhancement: Added the `ZOWE_SOCKET_CONNECT_TIMEOUT` environment variable to the `EnvironmentalVariableSettings` class to allow extenders to determine how long to wait for a socket connection before timing out. [#2486](https://github.com/zowe/zowe-cli/pull/2486)
- BugFix: Added checks to the `AbstractRestClient` abstract class to ensure the `hostname` parameter does not contain a protocol. [#2486](https://github.com/zowe/zowe-cli/pull/2486)
- Enhancement: Updated help examples to replace short option aliases (e.g. `-h`) with full option names (e.g. `--help`) for improved clarity and consistency in documentation. [#2484](https://github.com/zowe/zowe-cli/pull/2484)
- Enhancement: Exposed the private `buildPrefix` function as a replacement of `moment.format(...)`. [#2478](https://github.com/zowe/zowe-cli/pull/2478)

## `8.18.0`

- BugFix: Ensured that the `ProfileCredentials` class evaluates all layers to determine if the credentials are secure. [#2460](https://github.com/zowe/zowe-cli/issues/2460)
- Enhancement: Allowed instances of the `ProfileCredentials` class to check only for the active layer to determine if the credentials are secure. [#2460](https://github.com/zowe/zowe-cli/issues/2460)

## `8.17.0`

- BugFix: Fixed a bug that resulted in daemon commands running slower with every additional command. [#2470](https://github.com/zowe/zowe-cli/issues/2470)

## `8.16.0`

- Enhancement: Added a line to the output to display the authentication type when using the `--show-inputs-only` option. [#2462](https://github.com/zowe/zowe-cli/issues/2462)
- Enhancement: Added a favicon to the Web Help that displays in browser tabs. [#801](https://github.com/zowe/zowe-cli/issues/801)
- BugFix: When in daemon mode, the user would not see Imperative initialization errors, but now the errors are passed back to the user's terminal window. [#1875](https://github.com/zowe/zowe-cli/issues/1875).

## `8.15.1`

- BugFix: Fixed the `--show-inputs-only` option on commands with chained command handlers. [#2446](https://github.com/zowe/zowe-cli/issues/2446)

## `8.14.1`

- BugFix: Fixed help text example section's wrapping issue where the first line of the description is wrapped differently than the rest of the lines. [#1945](https://github.com/zowe/zowe-cli/issues/1945).

## `8.14.0`

- BugFix: Fixed inconsistent behavior with the `ZOWE_SHOW_SECURE_ARGS` environment variable continuing to mask secure properties when it should not. [#2430](https://github.com/zowe/zowe-cli/issues/2430)
- Enhancement: Added the `Censor` class, consolidating all sensitive data hiding logic into one class. [#2424](https://github.com/zowe/zowe-cli/pull/2424)
- Enhancement: Added the `showSecureArgs` environment variable to the `EnvironmentalVariableSettings` class to allow extenders to determine if they should mask secure values. [#2424](https://github.com/zowe/zowe-cli/pull/2424)
- Enhancement: Added the ability to see secure properties when running `zowe config list` when the `ZOWE_SHOW_SECURE_ARGS` environment variable is set to `true`. [#2259](https://github.com/zowe/zowe-cli/issues/2259)
- Deprecated: The `LoggerUtils` class has been deprecated. Use the `Censor` class instead. [#2424](https://github.com/zowe/zowe-cli/pull/2424)
- Deprecated: The `CliUtils.CENSOR_RESPONSE` property has been deprecated. Use the `Censor.CENSOR_RESPONSE` property instead. [#2424](https://github.com/zowe/zowe-cli/pull/2424)
- Deprecated: The `CliUtils.CENSORED_OPTIONS` property has been deprecated. Use the `Censor.CENSORED_OPTIONS` property instead. [#2424](https://github.com/zowe/zowe-cli/pull/2424)
- Deprecated: The `CliUtils.censorCLIArgs` function has been deprecated. Use the `Censor.censorCLIArgs` function instead. [#2424](https://github.com/zowe/zowe-cli/pull/2424)
- Deprecated: The `CliUtils.censorYargsArguments` function has been deprecated. Use the `Censor.censorYargsArguments` function instead. [#2424](https://github.com/zowe/zowe-cli/pull/2424)

## `8.13.0`

- Format fix: `DeferredPromise` and `DeferredPromise.unit.test` comment format changed to match standard.

## `8.11.0`

- Enhancement: Added `DeferredPromise` class to Imperative to provide utilities for data synchronization. [#2405](https://github.com/zowe/zowe-cli/pull/2405)

## `8.10.4`

- BugFix: Fixed a typo in the syntax validation code for positional arguments which caused the validation to never fail. [#2375](https://github.com/zowe/zowe-cli/issues/2375)

## `8.10.3`

- BugFix: Resolved an issue where extraneous base profiles were created in project configurations when a nested profile property was updated. [#2400](https://github.com/zowe/zowe-cli/pull/2400)

## `8.10.1`

- BugFix: Resolved an issue where base profiles in a team configuration file were overwritten when a user configuration file did not include a base profile. [#2383](https://github.com/zowe/zowe-cli/pull/2383)

## `8.10.0`

- BugFix: Modified location of Proxy-Authorization header to be located in the agent instead of the request. [#2389](https://github.com/zowe/zowe-cli/issues/2389)

## `8.8.3`

- BugFix: Modified 8.8.2 bugfix to correct web help alias. [#2361](https://github.com/zowe/zowe-cli/pull/2361)
- BugFix: Resolved issue where special characters could be corrupted when downloading a large file. [#2366](https://github.com/zowe/zowe-cli/pull/2366)

## `8.8.2`

- BugFix: Fixed an issue where the Imperative Event Emitter could skip triggering event callbacks. [#2360](https://github.com/zowe/zowe-cli/pull/2360)
- BugFix: Enhanced [#2301](https://github.com/zowe/zowe-cli/pull/2301) to include "--help-web" commands to pass even if presence of a faulty configuration.

## `8.8.1`

- BugFix: Fixed an issue where the `ProfileInfo.profileManagerWillLoad` method failed if profiles were not yet read from disk. [#2284](https://github.com/zowe/zowe-cli/issues/2284)
- BugFix: Fixed an issue where the `ProfileInfo.onlyV1ProfilesExist` method could wrongly return true when V2 profiles exist. [#2311](https://github.com/zowe/zowe-cli/issues/2311)
  - Deprecated the static method `ProfileInfo.onlyV1ProfilesExist` and replaced it with an `onlyV1ProfilesExist` instance method on the `ProfileInfo` class.
- BugFix: Fixed an issue where the `ConvertV1Profiles.convert` method may create team configuration files in the wrong directory if the environment variable `ZOWE_CLI_HOME` is set. [#2312](https://github.com/zowe/zowe-cli/issues/2312)
- BugFix: Fixed an issue where the Imperative Event Emitter would fire event callbacks for the same app that triggered the event. [#2279](https://github.com/zowe/zowe-cli/issues/2279)
- BugFix: Fixed an issue where the `ProfileInfo.updateKnownProperty` method could rewrite team config file to disk without any changes when storing secure value. [#2324](https://github.com/zowe/zowe-cli/issues/2324)

## `8.8.0`

- BugFix: Enabled commands with either the `--help` or `--version` flags to still display their information despite any configuration file issues. [#2301](https://github.com/zowe/zowe-cli/pull/2301)

## `8.7.1`

- BugFix: Deprecated `IO` functions `createDirsSync` and `mkdirp` due to code duplication. Please use `createDirSync` instead. [#2352](https://github.com/zowe/zowe-cli/pull/2352)

## `8.7.0`

- Enhancement: Added optional `proxy` object to ISession interface for extenders to pass a ProxyVariables object that would override the environment variables if in place. [#2330](https://github.com/zowe/zowe-cli/pull/2330)

## `8.6.1`

- BugFix: Handled an HTTP 1.1 race condition where an SDK user may experience an ECONNRESET error if a session was reused on Node 20 and above due to HTTP Keep-Alive. [#2339](https://github.com/zowe/zowe-cli/pull/2339)

## `8.3.1`

- BugFix: Fixed an issue where the `plugins install` command could fail when installing a scoped package because scoped registry was used to fetch all dependencies. [#2317](https://github.com/zowe/zowe-cli/issues/2317)

## `8.2.0`

- Enhancement: Use the new SDK method `ConfigUtils.hasTokenExpired` to check whether a given JSON web token has expired. [#2298](https://github.com/zowe/zowe-cli/pull/2298)
- Enhancement: Use the new SDK method `ProfileInfo.hasTokenExpiredForProfile` to check whether the JSON web token has expired for a specified profile. [#2298](https://github.com/zowe/zowe-cli/pull/2298)

## `8.1.2`

- BugFix: Fixed issues flagged by Coverity [#2291](https://github.com/zowe/zowe-cli/pull/2291)
- BugFix: Fixed an issue where the default credential manager failed to load when using ESM or the Node.js REPL environment. [#2297](https://github.com/zowe/zowe-cli/pull/2297)

## `8.1.0`

- Enhancement: Added the ability to specify a profile with the `zowe config secure` command. This allows the user to prompt for the secure values of the specified profile. [#1890] https://github.com/zowe/zowe-cli/issues/1890

## `8.0.1`

- BugFix: Removed Secrets SDK requirement when Imperative is a bundled dependency. [#2276](https://github.com/zowe/zowe-cli/issues/2276)

## `8.0.0`

- MAJOR: v8.0.0 Release

## `8.0.0-next.202409191615`

- Update: Final prerelease
- Update: See `5.27.1` for details

## `8.0.0-next.202408301809`

- LTS Breaking: Removed the following obsolete V1 profile classes/functions:

  - `CliProfileManager`
  - `CliUtils.getOptValueFromProfiles`
  - `CommandProfiles`
  - `ProfileValidator`

  See [`8.0.0-next.202408271330`](#800-next202408271330) for replacements

- Next Breaking: Changed 2nd parameter of `CliUtils.getOptValuesFromConfig` method from type `ICommandDefinition` to `ICommandProfile`.
- Next Breaking: Renamed `ConfigSecure.secureFieldsForLayer` method to `securePropsForLayer`.

## `8.0.0-next.202408291544`

- Enhancement: Added a new SDK method (`ConfigSecure.secureFieldsForLayer`) to allow developers to get vault content in the context of the specified layer. [#2206](https://github.com/zowe/zowe-cli/issues/2206)
- Enhancement: Added a new SDK method (`ProfileInfo.secureFieldsWithDetails`) to allow developers to the more details regarding the securely stored properties. [#2206](https://github.com/zowe/zowe-cli/issues/2206)

## `8.0.0-next.202408271330`

- LTS Breaking: [#2231](https://github.com/zowe/zowe-cli/issues/2231)
  - Removed the obsolete V1 `profiles` property from `IHandlerParameters` interface - Use `IHandlerParameters.arguments` to access profile properties in a command handler
  - Deprecated the following obsolete V1 profile interfaces:
    - `IProfileTypeConfiguration.dependencies` - For team config, use nested profiles instead
    - `IProfileTypeConfiguration.validationPlanModule` - For team config, validate with JSON schema instead
  - Deprecated the following obsolete V1 profile classes/functions:
    - `CliProfileManager` - Use `ProfileInfo` class to manage team config profiles
    - `CliUtils.getOptValueFromProfiles` - Use `CliUtils.getOptValuesFromConfig` to load properties from team config
    - `CommandProfiles` - Use `ImperativeConfig.instance.config.api.profiles` to load profiles from team config
    - `ProfileValidator` - No direct replacement

## `8.0.0-next.202408231832`

- LTS Breaking: Fixed command parsing error where `string` typed options would be converted into `number`s if the value provided by the user consists only of numeric characters. [#1881](https://github.com/zowe/zowe-cli/issues/1881)
- LTS Breaking: Renamed `Proxy` class to `ProxySettings` to avoid name conflict with JS built-in `Proxy` object. [#2230](https://github.com/zowe/zowe-cli/issues/2230)

## `8.0.0-next.202408191401`

- Update: See `5.26.3` and `5.27.0` for details

## `8.0.0-next.202408131445`

- Update: See `5.26.2` for details

## `8.0.0-next.202408092029`

- BugFix: Resolved bug that resulted in user not being prompted for a key passphrase if it is located in the secure credential array of the ssh profile. [#1770](https://github.com/zowe/zowe-cli/issues/1770)

## `8.0.0-next.202407262216`

- Update: See `5.26.1` for details

## `8.0.0-next.202407232256`

- Enhancement: Allowed boolean value (`false`) to be provided to the Credential Manager related function. [zowe-explorer-vscode#2622](https://github.com/zowe/zowe-explorer-vscode/issues/2622)
- Update: See `5.26.0` for details

## `8.0.0-next.202407181904`

- Enhancement: Added the function ConfigUtils.formGlobOrProjProfileNm and modified the function ConfigBuilder.build so that the 'zowe config init' command now generates a base profile name of 'global_base' or 'project_base', depending on whether a global or project configuration file is being generated. Related to Zowe Explorer issue https://github.com/zowe/zowe-explorer-vscode/issues/2682.

## `8.0.0-next.202407181255`

- BugFix: Resolved bug that resulted in each plug-in to have identical public registries regardless of actual installation location/reference. [#2189](https://github.com/zowe/zowe-cli/pull/2189)
- BugFix: Resolved bug that resulted in every plug-in to have the same registry location field as the first if multiple plugins were installed in the same command. [#2189](https://github.com/zowe/zowe-cli/pull/2189)

## `8.0.0-next.202407112150`

- Enhancement: Add client-side custom-event handling capabilities. [#2136](https://github.com/zowe/zowe-cli/pull/2136)
- Next-Breaking: Refactored the Imperative Event Emitter class. [#2136](https://github.com/zowe/zowe-cli/pull/2136)
  - Removed the `ImperativeEventEmitter` class.
  - Added an `EventProcessor` class to handle event listening and emitting.
  - Added an `EventOperator` class to handle creation and deletion of `EventProcessors`.
  - Added an `EventUtils` class to contain all common utility methods for the Client Event Handling capabilities.
  - Added `IEmitter`, `IWatcher`, and `IEmitterAndWatcher` interfaces to expose what application developers should see.

## `8.0.0-next.202407051717`

- BugFix: V3 Breaking: Modified the ConvertV1Profiles.convert API to accept a new ProfileInfo option and initialize components sufficiently to enable VSCode apps to convert V1 profiles. [#2170](https://github.com/zowe/zowe-cli/issues/2170)

## `8.0.0-next.202407021516`

- BugFix: Updated dependencies for technical currency [#2188](https://github.com/zowe/zowe-cli/pull/2188)
- Update: See `5.25.0` for details

## `8.0.0-next.202406201950`

- Enhancement: Added `ProfileInfo.profileManagerWillLoad` function to verify the credential manager can load. [#2111](https://github.com/zowe/zowe-cli/issues/2111)

## `8.0.0-next.202406111958`

- LTS Breaking: Modified the @zowe/imperative SDK [#2083](https://github.com/zowe/zowe-cli/issues/2083)
  - Removed the following exported classes:
    - AbstractAuthHandler
    - AbstractCommandYargs
    - AbstractHelpGenerator
    - AbstractHelpGeneratorFactory
    - CommandPreparer
    - CommandProcessor
    - CommandUtils
    - CommandYargs
    - CompressionUtils
    - ConfigAutoStore
    - ConfigurationLoader
    - ConfigurationValidator
    - DefinitionTreeResolver
    - FailedCommandHandler
    - GroupCommandYargs
    - HelpConstants
    - HelpGeneratorFactory
    - ImperativeReject
    - LoggerConfigBuilder
    - LoggerUtils
    - RestStandAloneUtils
    - SharedOptions
    - SyntaxValidator
    - WebHelpManager
    - YargsConfigurer
    - YargsDefiner
  - Removed the following exported interfaces:
    - ICommandHandlerResponseChecker
    - ICommandHandlerResponseValidator
    - ICommandValidatorError
    - ICommandValidatorResponse
    - IConstructor
    - IHelpGenerator
    - IHelpGeneratorFactory
    - IYargsParms
    - IYargsResponse
  - Deprecated the following classes:
    - Operation
    - Operations

## `8.0.0-next.202406111728`

- Enhancement: Added `BufferBuilder` utility class to provide convenient way of downloading to a stream that can be read as a buffer. [#2167](https://github.com/zowe/zowe-cli/pull/2167)
- BugFix: Fixed error in REST client that when using stream could cause small data sets to download with incomplete contents. [#744](https://github.com/zowe/zowe-cli/issues/744)
- BugFix: Updated `micromatch` dependency for technical currency. [#2167](https://github.com/zowe/zowe-cli/pull/2167)

## `8.0.0-next.202406061600`

- BugFix: Updated `braces` dependency for technical currency. [#2158](https://github.com/zowe/zowe-cli/pull/2158)

## `8.0.0-next.202405241520`

- BugFix: Modified command output to show appropriate error message given available ImperativeError properties. [#1897](https://github.com/zowe/zowe-cli/issues/1897)
- Patch: Modify error text in SyntaxValidator.invalidOptionError. [#2138](https://github.com/zowe/zowe-cli/issues/2138)

## `8.0.0-next.202405211929`

- BugFix: Fixed error "Only one instance of the Imperative Event Emitter is allowed" when running system tests. [#2146](https://github.com/zowe/zowe-cli/issues/2146)

## `8.0.0-next.202405151329`

- Enhancement: Add client-side event handling capabilities. [#1987](https://github.com/zowe/zowe-cli/issues/1987)

## `8.0.0-next.202405061946`

- Enhancement: Consolidated the Zowe client log files into the same directory. [#2116](https://github.com/zowe/zowe-cli/issues/2116)
- Deprecated: The `IO.FILE_DELIM` constant. Use `path.posix.sep` instead or `path.sep` for better cross-platform support.
- Deprecated: The `LoggerConfigBuilder.DEFAULT_LOG_DIR` and `LoggerConfigBuilder.DEFAULT_LOG_FILE_DIR` constants. Use `LoggerConfigBuilder.DEFAULT_LOGS_DIR` instead.

## `8.0.0-next.202405031808`

- BugFix: Restore the previous precedence of token over password in AbstractRestClient [#2109](https://github.com/zowe/zowe-cli/issues/2109)

## `8.0.0-next.202404301428`

- Enhancement: Add informative messages before prompting for connection property values in the CLI callback function getValuesBack.

## `8.0.0-next.202404191414`

- Enhancement: Added a new class named ConvertV1Profiles to enable other apps to better convert V1 profiles into a current Zowe config file.
  - Refactored logic from convert-profiles.handler and ConfigBuilder.convert into ConvertV1Profiles.convert.
  - Removed ConfigBuilder.convert.
  - Replaced IConfigConvertResult with IConvertV1Profiles (which contains IConvertV1ProfResult).
  - Renamed class V1ProfileConversion (formerly known as ProfileIO) to V1ProfileRead for consistency.
    - Marked class V1ProfileRead as @internal.

## `8.0.0-next.202403272026`

- BugFix: Resolved technical currency by updating `markdown-it` dependency. [#2107](https://github.com/zowe/zowe-cli/pull/2107)

## `8.0.0-next.202403251613`

- BugFix: Fixed issue where the `ProfileInfo.addProfileTypeToSchema` function did not update the global schema if a project-level configuration was detected. [#2086](https://github.com/zowe/zowe-cli/issues/2086)
- BugFix: Updated debugging output for technical currency. [#2100](https://github.com/zowe/zowe-cli/pull/2100)

## `8.0.0-next.202403141949`

- LTS Breaking: Modified the @zowe/imperative SDK [#1703](https://github.com/zowe/zowe-cli/issues/1703)
  - Renamed class ProfileIO to V1ProfileConversion.
    - Removed the following obsolete V1 profile functions:
      - createProfileDirs
      - deleteProfile
      - exists
      - writeMetaFile
      - writeProfile
    - Removed the following obsolete V1 profile constant:
      - MAX_YAML_DEPTH
    - Changed fileToProfileName from public to private
  - Removed deprecated function ConfigProfiles.expandPath
    - Use ConfigProfiles.getProfilePathFromName
  - Removed deprecated function ProcessUtils.execAndCheckOutput
    - Use ExecUtils.spawnAndGetOutput

## `8.0.0-next.202403132009`

- Enhancement: Prompt for user/password on SSH commands when a token is stored in the config. [#2081](https://github.com/zowe/zowe-cli/pull/2081)

## `8.0.0-next.202403061549`

- V3 Breaking: Changed prompting logic to prompt for port if port provided is 0 [#2075](https://github.com/zowe/zowe-cli/issues/2075)
- BugFix: Fixed issue with peerDep warnings showing when a plug-in is installed and the version ranges satisfy the semver requirements. [#2067](https://github.com/zowe/zowe-cli/pull/2067)

## `8.0.0-next.202403041352`

- BugFix: Updated engine to Node 18.12.0. [#2074](https://github.com/zowe/zowe-cli/pull/2074)
- BugFix: Removed `profileVersion` from the response given by `--show-inputs-only` to fix [#1689](https://github.com/zowe/zowe-cli/issues/1689). Extended that change to the `config report-env` command, where similar soon-to-be obsolete v1 considerations occur.
- BugFix: Changed text displayed for configuration from "V2" to "TeamConfig" [#2019](https://github.com/zowe/zowe-cli/issues/2019)
- BugFix: Eliminated a Node Version Manager (NVM) GUI popup dialog which NVM now displays during the `zowe config report-env` command by removing the NVM version number from our report.
- Enhancement: Replaced the term "Team configuration" with "Zowe client configuration" in the `zowe config report-env` command.

- LTS Breaking: [#1703](https://github.com/zowe/zowe-cli/issues/1703)

  - Removed the following obsolete V1 profile interfaces:

    - @zowe/cli-test-utils

      - ISetupEnvironmentParms.createOldProfiles

    - @zowe/imperative
      - ICliLoadProfile
      - ICliLoadAllProfiles
      - ICommandLoadProfile
      - ICommandProfileTypeConfiguration.createProfileExamples
      - ICommandProfileTypeConfiguration.createProfileFromArgumentsHandler
      - ICommandProfileTypeConfiguration.updateProfileExamples
      - ICommandProfileTypeConfiguration.updateProfileFromArgumentsHandler
      - IDeleteProfile
      - ILoadAllProfiles
      - ILoadProfile
      - IProfileDeleted
      - IProfileManager.loadCounter
      - IProfileManagerFactory
      - IProfileSaved
      - IProfileValidated
      - ISaveProfile
      - ISaveProfileFromCliArgs
      - ISetDefaultProfile
      - IUpdateProfile
      - IUpdateProfileFromCliArgs
      - IValidateProfile
      - IValidateProfileForCLI
      - IValidateProfileWithSchema

  - Removed the following obsolete V1 profile classes/functions:

    - @zowe/core-for-zowe-sdk

      - File ProfileUtils.ts, which includes these functions:
        - getDefaultProfile
        - getZoweDir - moved to ProfileInfo.getZoweDir

    - @zowe/cli-test-utils

      - TempTestProfiles.forceOldProfiles
      - TestUtils.stripProfileDeprecationMessages

    - @zowe/imperative

      - AbstractProfileManager
        - Any remaining functions consolidated into CliProfileManager
      - AbstractProfileManagerFactory
      - BasicProfileManager
        - Any remaining functions consolidated into CliProfileManager
      - BasicProfileManagerFactory
      - CliProfileManager
        - clearDefault
        - configurations
        - constructFullProfilePath
        - delete
        - deleteProfile
        - deleteProfileFromDisk
        - getAllProfileNames
        - getDefaultProfileName
        - isProfileEmpty
        - load
        - loadAll
        - loadCounter
        - loadDependencies
        - loadFailed
        - loadProfile
        - loadSpecificProfile
        - locateExistingProfile
        - managerParameters
        - mergeProfiles
        - META_FILE_SUFFIX
        - PROFILE_EXTENSION
        - profileRootDirectory
        - profileTypeSchema
        - save
        - saveProfile
        - setDefault
        - update
        - updateProfile
        - validate
        - validateProfile
        - validateProfileAgainstSchema
        - validateProfileObject
        - validateRequiredDependenciesAreSpecified
      - CommandProfiles
        - getMeta
        - getAll
      - ImperativeProfileManagerFactory
      - ProfileInfo.usingTeamConfig
        - To detect if a team config exists, use ProfileInfo.getTeamConfig().exists
        - To detect if only V1 profiles exist, use ProfileInfo.onlyV1ProfilesExist

    - @zowe/zos-uss-for-zowe-sdk
      - SshBaseHandler
        - Removed the unused, protected property ‘mSshProfile’

  - Removed the following obsolete V1 profile constants:

    - @zowe/imperative
      - CoreMessages class
        - createProfileCommandSummary
        - createProfileDisableDefaultsDesc
        - createProfileOptionDesc
        - createProfileOptionOverwriteDesc
        - createProfilesCommandDesc
        - createProfilesCommandSummary
        - deleteProfileActionDesc
        - deleteProfileCommandDesc
        - deleteProfileDepsDesc
        - deleteProfileExample
        - deleteProfileForceOptionDesc
        - deleteProfileNameDesc
        - deleteProfilesCommandDesc
        - deleteProfilesCommandSummary
        - detailProfileCommandDesc
        - listGroupWithOnlyProfileCommandSummary
        - listGroupWithOnlyProfileDefaultDesc
        - listGroupWithOnlyProfilesDefinition
        - listGroupWithOnlyProfileSetDesc
        - listGroupWithOnlyProfilesSummary
        - listProfileCommandDesc
        - listProfileCommandSummary
        - listProfileExample
        - listProfileExampleShowContents
        - listProfileLoadedModulesOptionDesc
        - listProfilesFoundMessage
        - listProfilesNotFoundMessage
        - listProfileVerboseOptionDesc
        - locateProfilesDesc
        - overroteProfileMessage
        - profileCreatedSuccessfully
        - profileCreatedSuccessfullyAndPath
        - profileCreateErrorDetails
        - profileCreateErrorHeader
        - profileDeletedSuccessfully
        - profileDeleteErrorDetails
        - profileDeleteErrorHeader
        - profileDesc
        - profileLoadError
        - profileNotDeletedMessage
        - profileReviewMessage
        - profileUpdatedSuccessfullyAndPath
        - selectProfileNameDesc
        - setGroupWithOnlyProfilesCommandDesc
        - setGroupWithOnlyProfilesListDesc
        - setGroupWithOnlyProfilesSummary
        - setProfileActionDesc
        - setProfileActionSummary
        - setProfileExample
        - setProfileOptionDesc
        - showDependenciesCommandDesc
        - unableToCreateProfile
        - unableToDeleteProfile
        - unableToFindProfile
        - unableToLoadRequestedProfilesError
        - unexpectedProfileCreationError
        - unexpectedProfileLoadError
        - unexpectedProfilesLoadError
        - unexpectedProfileUpdateError
        - updateProfileActionDesc
        - updateProfileCommandDesc
        - updateProfileCommandSummary
        - validateProfileCommandDesc
        - validateProfileCommandSummary
        - validateProfileGroupDesc
        - validateProfileNameDesc
        - validateProfileOptionDesc
      - ProfilesConstants class
        - DEPRECATE_TO_CONFIG_EDIT
        - DEPRECATE_TO_CONFIG_INIT
        - DEPRECATE_TO_CONFIG_LIST
        - DEPRECATE_TO_CONFIG_SET
        - PROFILES_COMMAND_TYPE_KEY

  - Annotated the following items as @internal:
    - @zowe/imperative
      - CommandProfileLoader
      - ImperativeApi.profileManager
      - ProfileValidator

## `8.0.0-next.202402271901`

- BugFix: Fixed chalk functionality that was broken due to the use of the removed `.enabled` property. [#2071](https://github.com/zowe/zowe-cli/issues/2071)

## `8.0.0-next.202402261705`

- LTS Breaking: Updated `ICommandArguments` and `IHandlerParameters` to accept strings or numbers per Yargs changes. [#2069](https://github.com/zowe/zowe-cli/pull/2069)
- BugFix: Correct the examples displayed by the `--help-examples` command. [#1865](https://github.com/zowe/zowe-cli/issues/1865) and [#1715](https://github.com/zowe/zowe-cli/issues/1715)
- BugFix: Updated additional dependencies for technical currency. [#2061](https://github.com/zowe/zowe-cli/pull/2061)
- BugFix: Updated engine to Node 16.7.0. [#2061](https://github.com/zowe/zowe-cli/pull/2061)

## `8.0.0-next.202402221834`

- Enhancement: Added multiple APIs to the `ProfileInfo` class to help manage schemas between client applications. [#2012](https://github.com/zowe/zowe-cli/issues/2012)

## `8.0.0-next.202402211923`

- BugFix: Updated dependencies for technical currency. [#2057](https://github.com/zowe/zowe-cli/pull/2057)

## `8.0.0-next.202402132108`

- LTS Breaking: Added Zowe release version output for `--version` [#2028](https://github.com/zowe/zowe-cli/issues/2028)
- Enhancement: Added `name-only` alias to `root` on `config list` command [#1797](https://github.com/zowe/zowe-cli/issues/1797)
- BugFix: Resolved technical currency by updating `socks` transitive dependency

## `8.0.0-next.202401191954`

- LTS Breaking: Removed the following:
  - All 'profiles' commands, since they only worked with now-obsolete V1 profiles.
  - BasicProfileManager.initialize function
  - These interfaces:
    - IProfileManagerInit
    - IProfileInitialized

## `8.0.0-next.202401081937`

- BugFix: Fixed error message shown for null option definition to include details about which command caused the error. [#2002](https://github.com/zowe/zowe-cli/issues/2002)

## `8.0.0-next.202401031939`

- Enhancement: Revised help text for consistency [#1756](https://github.com/zowe/zowe-cli/issues/1756)

## `8.0.0-next.202311291643`

- LTS Breaking: Removed check for `ZOWE_EDITOR` environment variable in `ProcessUtils.openInEditor` [#1867](https://github.com/zowe/zowe-cli/issues/1867)

## `8.0.0-next.202311282012`

- LTS Breaking: Unpinned dependency versions to allow for patch/minor version updates for dependencies [#1968](https://github.com/zowe/zowe-cli/issues/1968)

## `8.0.0-next.202311141903`

- LTS Breaking: Removed the following previously deprecated items:
  - `flattenCommandTreeWithAliases()` -- Use `CommandUtils.flattenCommandTree()` instead
  - `AbstractAuthHandler.getPromptParams()` -- Use `getAuthHandlerApi()` instead
  - `BaseAuthHandler.getPromptParams()` -- Use `getAuthHandlerApi()` instead
  - `promptForInput()` -- Use the asynchronous method `readPrompt()` instead
  - `promptWithTimeout()` -- Use `readPrompt` instead which supports more options
  - `Imperative.envVariablePrefix` -- Use `ImperativeConfig.instance.envVariablePrefix` instead
  - `pluginHealthCheck()` -- Plugins that want to perform a health check can
    specify the `pluginLifeCycle` property to load a class from the plugin.
    The plugin can implement the `postInstall()` function of that class to perform
    a health check, or any other desired operation.
  - `IProfOpts.requireKeytar` -- removing the default implementation of `require("keytar")` from the caller app's node_modules folders

## `8.0.0-next.202311141517`

- LTS Breaking: Replaced the previously deprecated function AbstractCommandYargs.getBrightYargsResponse - use AbstractCommandYargs.getZoweYargsResponse

## `8.0.0-next.202311132045`

- Major: First major version bump for V3

## `5.27.1`

- BugFix: Updated `dataobject-parser` dependency for technical currency. [#2262](https://github.com/zowe/zowe-cli/pull/2262)
- BugFix: Updated `fs-extra` and `jsonfile` dependencies for technical currency. [#2264](https://github.com/zowe/zowe-cli/pull/2264)

## `5.27.0`

- BugFix: Modified `showMsgWhenDeprecated` function to allow an empty string as a parameter when no replacement is available for the deprecated command. When no replacement is available an alternative message will be printed. [#2041](https://github.com/zowe/zowe-cli/issues/2041)
- BugFix: Resolved bug that resulted in user not being prompted for a key passphrase if it is located in the secure credential array of the ssh profile. [#1770](https://github.com/zowe/zowe-cli/issues/1770)

## `5.26.3`

- BugFix: Fixed issue in local web help with highlighted sidebar item getting out of sync. [#2215](https://github.com/zowe/zowe-cli/pull/2215)
- BugFix: Updated web help dependencies for technical currency. [#2215](https://github.com/zowe/zowe-cli/pull/2215)

## `5.26.2`

- BugFix: Refactored code to reduce the use of deprecated functions to prepare for upcoming Node.js 22 support. [#2191](https://github.com/zowe/zowe-cli/issues/2191)
- BugFix: Fixed error in REST client when making requests with session type of `SessConstants.AUTH_TYPE_NONE`. [#2219](https://github.com/zowe/zowe-cli/issues/2219)

## `5.26.1`

- BugFix: Fixed missing export for `Proxy` class in Imperative package. [#2205](https://github.com/zowe/zowe-cli/pull/2205)

## `5.26.0`

- Enhancement: Updated `ProfileInfo.updateProperty` function to support updating properties in typeless profiles. [#2196](https://github.com/zowe/zowe-cli/issues/2196)

## `5.25.0`

- Enhancement: Added `ProfileInfo.profileManagerWillLoad` function to verify the credential manager can load. [#2111](https://github.com/zowe/zowe-cli/issues/2111)
- Enhancement: Added support for proxy servers using a proxy http agent. Supports the usage of the environment variables HTTP_PROXY, HTTPS_PROXY (not case sensitive).
  - If any of these environment variables is set and depending how the Zowe session is configured for http or https, the REST client instantiates an appropriate http agent.
  - If the z/OS system uses self-signed certificates then the proxy server must be configured to accept them.
  - If the proxy server itself is configured with self-signed certificates then the user needs to either import these certificates on their workstation, use rejectUnauthorized in their Zowe profile, or use the (not recommended) nodejs variable NODE_TLS_REJECT_UNAUTHORIZED=0.
  - Zowe also looks for the environment variable NO_PROXY. These work with a simple comma separated list of hostnames that need to match with the hostname of the Zowe profile.

## `5.24.0`

- Enhancement: Added `BufferBuilder` utility class to provide convenient way of downloading to a stream that can be read as a buffer. [#2167](https://github.com/zowe/zowe-cli/pull/2167)
- BugFix: Fixed error in REST client that when using stream could cause small data sets to download with incomplete contents. [#744](https://github.com/zowe/zowe-cli/issues/744)
- BugFix: Updated `micromatch` dependency for technical currency. [#2167](https://github.com/zowe/zowe-cli/pull/2167)

## `5.23.4`

- BugFix: Updated `braces` dependency for technical currency. [#2157](https://github.com/zowe/zowe-cli/pull/2157)

## `5.23.3`

- BugFix: Modified error text in SyntaxValidator.invalidOptionError. [#2138](https://github.com/zowe/zowe-cli/issues/2138)

## `5.23.2`

- BugFix: Updated error text for invalid command options so that allowable values are displayed as strings instead of regular expressions when possible. [#1863](https://github.com/zowe/zowe-cli/issues/1863)
- BugFix: Fixed issue where the `ConfigSecure.securePropsForProfile` function did not list secure properties outside the active config layer. [zowe-explorer-vscode#2633](https://github.com/zowe/zowe-explorer-vscode/issues/2633)

## `5.23.1`

- BugFix: Restore the previous precedence of token over password in AbstractRestClient [#2109](https://github.com/zowe/zowe-cli/issues/2109)

## `5.23.0`

- Enhancement: Prompt for user/password on SSH commands when a token is stored in the config. [#2081](https://github.com/zowe/zowe-cli/pull/2081)

## `5.22.7`

- BugFix: Resolved technical currency by updating `markdown-it` dependency. [#2106](https://github.com/zowe/zowe-cli/pull/2106)

## `5.22.6`

- BugFix: Updated debugging output for technical currency. [#2098](https://github.com/zowe/zowe-cli/pull/2098)

## `5.22.5`

- BugFix: Fixed issue where the `ProfileInfo.addProfileTypeToSchema` function did not update the global schema if a project-level configuration was detected. [#2086](https://github.com/zowe/zowe-cli/issues/2086)

## `5.22.4`

- BugFix: Fixed race condition in `config convert-profiles` command that may fail to delete secure values for old profiles

## `5.22.3`

- BugFix: Resolved issue in `ProfileInfo` where schema comparisons fail, specifically when comparing the cached schema against a command-based schema during registration.

## `5.22.2`

- BugFix: Resolved technical currency by updating `socks` transitive dependency

## `5.22.0`

- BugFix: Updated `mustache` and `jsonschema` dependencies for technical currency.
- Enhancement: Added multiple APIs to the `ProfileInfo` class to help manage schemas between client applications. [#2012](https://github.com/zowe/zowe-cli/issues/2012)

## `5.21.0`

- Enhancement: Hid the progress bar if `CI` environment variable is set, or if `FORCE_COLOR` environment variable is set to `0`. [#1845](https://github.com/zowe/zowe-cli/issues/1845)
- BugFix: Fixed issue where secure property names could be returned for the wrong profile. [zowe-explorer#2633](https://github.com/zowe/vscode-extension-for-zowe/issues/2633)

## `5.20.2`

- BugFix: Fixed issue when a property is not found in `ProfileInfo.updateProperty({forceUpdate: true})`. [zowe-explorer#2493](https://github.com/zowe/vscode-extension-for-zowe/issues/2493)

## `5.20.1`

- BugFix: Fixed error message shown for null option definition to include details about which command caused the error. [#2002](https://github.com/zowe/zowe-cli/issues/2002)

## `5.19.0`

- Enhancement: Deprecated function AbstractCommandYargs.getBrightYargsResponse in favor of AbstractCommandYargs.getZoweYargsResponse
- Enhancement: Deprecated the 'bright' command as an alias for the 'zowe' command. The 'bright' command will be removed in Zowe V3.

## `5.18.4`

- BugFix: Removed out of date `Perf-Timing` performance timing package.

## `5.18.3`

- BugFix: Fix for `AbstactRestClient` failing to return when streaming a large dataset or USS file [#1805](https://github.com/zowe/zowe-cli/issues/1805), [#1813](https://github.com/zowe/zowe-cli/issues/1813), and [#1824](https://github.com/zowe/zowe-cli/issues/1824)

## `5.18.2`

- BugFix: Fixed normalization on stream chunk boundaries [#1815](https://github.com/zowe/zowe-cli/issues/1815)

## `5.18.1`

- BugFix: Fixed merging of profile properties in `ProfileInfo.createSession`. [#1008](https://github.com/zowe/imperative/issues/1008)

## `5.18.0`

- Enhancement: Replaced use of `node-keytar` with the new `keyring` module from `@zowe/secrets-for-zowe-sdk`. [zowe-cli#1622](https://github.com/zowe/zowe-cli/issues/1622)

## `5.17.0`

- Enhancement: Added `inSchema` property for ProfileInfo to indicate if argument is a known schema argument [#899](https://github.com/zowe/imperative/issues/899)

## `5.16.0`

- Enhancement: Handled unique cookie identifier in the form of dynamic token types. [#996](https://github.com/zowe/imperative/pull/996)
- Enhancement: Added a new utility method to `ImperativeExpect` to match regular expressions. [#996](https://github.com/zowe/imperative/pull/996)
- Enhancement: Added support for multiple login operations in a single `config secure` command execution. [#996](https://github.com/zowe/imperative/pull/996)
- BugFix: Allowed for multiple `auth logout` operations. [#996](https://github.com/zowe/imperative/pull/996)
- BugFix: Prevented `auto-init` from sending two `login` requests to the server. [#996](https://github.com/zowe/imperative/pull/996)

## `5.15.1`

- BugFix: Enabled NextVerFeatures.useV3ErrFormat() to form the right environment variable name even if Imperative.init() has not been called.

## `5.15.0`

- Enhancement: Enabled users to display errors in a more user-friendly format with the ZOWE_V3_ERR_FORMAT environment variable. [zowe-cli#935](https://github.com/zowe/zowe-cli/issues/935)

## `5.14.2`

- BugFix: Handle logic for if a null command handler is provided

## `5.14.1`

- BugFix: Fixed a logic error in the `config list` command that caused unwanted behavior when a positional and `--locations` were both passed in.

## `5.14.0`

- Enhancement: Added the function IO.giveAccessOnlyToOwner to restrict access to only the currently running user ID.
- Enhancement: Enable command arguments to change `{$Prefix}_EDITOR`. Updating IDiffOptions
  to include names for the files that are to be compared. Updating IO.getDefaultTextEditor() for different os versions. Updating return value types for `CliUtils.readPrompt`. Changes made to support recent zowe cli work:
  [zowe-cli#1672](https://github.com/zowe/zowe-cli/pull/1672)

## `5.13.2`

- BugFix: Reduced load time by searching for command definitions with `fast-glob` instead of `glob`.

## `5.13.1`

- BugFix: Removed validation of the deprecated pluginHealthCheck property. [#980](https://github.com/zowe/imperative/issues/980)

## `5.13.0`

- Enhancement: Alters TextUtils behavior slightly to enable daemon color support without TTY

## `5.12.0`

- Enhancement: Added `--prune` option to `zowe config secure` command to delete unused properties. [#547](https://github.com/zowe/imperative/issues/547)

## `5.11.1`

- BugFix: Fixed the `login` and `logout` handlers, fixing the `li` and `lo` aliases.

## `5.11.0`

- Enhancement: Added `credMgrOverride` property to `IProfOpts` interface that can be used to override credential manager in the ProfileInfo API. [zowe-cli#1632](https://github.com/zowe/zowe-cli/issues/1632)
- Deprecated: The `requireKeytar` property on the `IProfOpts` interface. Use the `credMgrOverride` property instead and pass the callback that requires Keytar to `ProfileCredentials.defaultCredMgrWithKeytar`.

## `5.10.0`

- Enhancement: Added AbstractPluginLifeCycle to enable plugins to write their own postInstall and preUninstall functions, which will be automatically called by the 'zowe plugins" install and uninstall commands.

- Enhancement: Added pluginLifeCycle property to IImperativeConfig to enable a plugin to specify the path name to its own module which implements the AbstractPluginLifeCycle class.

- Enhancement: Added a list of known credential manager overrides to imperative. When a credential manager cannot be loaded, a list of valid credential managers will be displayed in an error message.

- Enhancement: Added a CredentialManagerOverride class containing utility functions to replace the default CLI credential manager or restore the default CLI credential manager. Plugins which implement a credential manager override can call these utilities from their AbstractPluginLifeCycle functions.

- Enhancement: Added documentation [Overriding_the_default_credential_manager](https://github.com/zowe/imperative/blob/master/doc/Plugin%20Architecture/Overriding_the_default_credential_manager.md) describing the techniques for overriding the default CLI credential manager with a plugin.

## `5.9.3`

- BugFix: Fixed broken plugin install command for Windows when file has a space in the name

## `5.9.2`

- BugFix: Fixed plugin install error not displayed correctly. [#954](https://github.com/zowe/imperative/issues/954)

## `5.9.1`

- BugFix: Fixed environment file not applying to daemon client environment variables

## `5.9.0`

- Enhancement: Adds `~/.<cli_name>.env.json` file to provide environment variables to the Imperative framework during Imperative initialization
  - Allows sites without environment variable access to specify process specific environment variables
  - Changes require daemon reload to take effect
  - SDK method is available as part of `EnvFileUtils` export

## `5.8.3`

- BugFix: Fixed `--help-examples` option failing on command groups. [zowe-cli#1617](https://github.com/zowe/zowe-cli/issues/1617)

## `5.8.2`

- BugFix: Fixed npm not found on `zowe plugins install` when using daemon mode in Windows. [zowe-cli#1615](https://github.com/zowe/zowe-cli/issues/1615)

## `5.8.1`

- BugFix: Fixed web help not showing top-level options like `--version` for the "zowe" command. [#927](https://github.com/zowe/imperative/issues/927)
- BugFix: Removed `--help-examples` option from CLI help for commands since it only applies to groups. [#928](https://github.com/zowe/imperative/issues/928)

## `5.8.0`

- Enhancement: Add `ProfileInfo.removeKnownProperty`, a convenience method for removing properties in addition to `ProfileInfo.updateKnownProperty`. [#917](https://github.com/zowe/imperative/issues/917)
- Enhancement: Allow type `IProfArgValue` to be of type `undefined` to support removing properties more easily. [#917](https://github.com/zowe/imperative/issues/917)

## `5.7.7`

- BugFix: Fixed `IO.writeFileAsync` method throwing uncatchable errors. [#896](https://github.com/zowe/imperative/issues/896)

## `5.7.6`

- BugFix: Fixed a logic error where chained command handlers would cause plugin validation to fail [#320](https://github.com/zowe/imperative/issues/320)

## `5.7.5`

- BugFix: Fixed ProfileInfo API failing to load schema for v1 profile when schema exists but no profiles of that type exist. [#645](https://github.com/zowe/imperative/issues/645)
- BugFix: Updated return type of `ProfileInfo.getDefaultProfile` method to indicate that it returns null when no profile exists for the specified type.

## `5.7.4`

- BugFix: Exported the IAuthHandlerApi from imperative package [#839](https://github.com/zowe/imperative/issues/839)

## `5.7.3`

- BugFix: Exported `AppSettings` for cli and other apps to use [#840](https://github.com/zowe/imperative/issues/840)

## `5.7.2`

- BugFix: Added validation for null/undefined command definitions [#868](https://github.com/zowe/imperative/issues/868)

## `5.7.1`

- BugFix: Updated plugins `--login` command option to behave as expected when running in an NPM 9 environment
- BugFix: Cleaned up uses of execSync in Imperative where it makes sense to do so.

## `5.7.0`

- Enhancement: Add `zowe config report-env` command to show a diagnostic report of the CLI's working environment.

## `5.6.0`

- Extend zowe plugins verbs to show information for a plugin's first steps [#1325](https://github.com/zowe/zowe-cli/issues/1325)

## `5.5.4`

- BugFix: Updated `glob` and `js-yaml` dependencies for technical currency.

## `5.5.3`

- BugFix: Updated `diff2html` and `npm-package-arg` dependencies for technical currency.
- BugFix: Fixed inconsistent behavior of Config API introduced in the last version. It now skips loading project config layers when project directory is `false` instead of an empty string.

## `5.5.2`

- BugFix: Updated `Config.search` API to skip loading project config layers when project directory is an empty string. [#883](https://github.com/zowe/imperative/issues/883)

## `5.5.1`

- BugFix: Prevented base profile secure-property lookup on the global layer when there is not default base profile. [#881](https://github.com/zowe/imperative/issues/881)

## `5.5.0`

- Enhancement: Added ZOWE_CLI_PLUGINS_DIR environment variable to override location where plugins are installed. [zowe/zowe-cli#1483](https://github.com/zowe/zowe-cli/issues/1483)
- BugFix: Fixed exception when non-string passed to ImperativeExpect.toBeDefinedAndNonBlank(). [#856](https://github.com/zowe/imperative/issues/856)

## `5.4.3`

- BugFix: Removed periods in command example descriptions so descriptions look syntactically correct. [#795](https://github.com/zowe/imperative/issues/795)
- BugFix: Improved performance of ProfileInfo API to load large team config files. [zowe/vscode-extension-for-zowe#1911](https://github.com/zowe/vscode-extension-for-zowe/issues/1911)
- BugFix: Fixed dot-separated words incorrectly rendered as links in the web help. [#869](https://github.com/zowe/imperative/issues/869)

## `5.4.2`

- BugFix: Web-diff template directory included in files section of package.json file.

## `5.4.1`

- BugFix: Changed the default log level of `Console` class from "debug" to "warn". In Zowe v2 the `Logger` class was changed to have a default log level of "warn" but we missed updating the `Console` class to make it behave consistently. If you want a different log level, you can change it after initializing the console like this: `console.level = "info";` [zowe/zowe-cli#511](https://github.com/zowe/zowe-cli/issues/511)

## `5.4.0`

- Enhancement: Added Diff utility features for getting differences between two files and open diffs in browser. Also added web diff generator for creating web diff dir at the cli home.

## `5.3.8`

- BugFix: Introduced examples for setting default profiles in `zowe config set` Examples section. [#1428](https://github.com/zowe/zowe-cli/issues/1428)

## `5.3.7`

- BugFix: Fixed error when installing plug-ins that do not define profiles. [#859](https://github.com/zowe/imperative/issues/859)

## `5.3.6`

- BugFix: Removed some extraneous dependencies. [#477](https://github.com/zowe/imperative/issues/477)

## `5.3.5`

- BugFix: Fixed `DefaultHelpGenerator` unable to find module "ansi-colors" when Imperative is imported.

## `5.3.4`

- BugFix: Added ANSI escape codes trimming for the Web Help. [#704](https://github.com/zowe/imperative/issues/704)
- BugFix: Fixed `AbstractRestClient` not converting LF line endings to CRLF for every line when downloading large files on Windows. [zowe/zowe-cli#1458](https://github.com/zowe/zowe-cli/issues/1458)
- BugFix: Fixed `zowe --version --rfj` including a trailing newline in the version field. [#842](https://github.com/zowe/imperative/issues/842)
- BugFix: Fixed `--response-format-json` option not supported by some commands in daemon mode. [#843](https://github.com/zowe/imperative/issues/843)

## `5.3.3`

- Expose the isSecured functionality from the ProfilesCredentials [#549](https://github.com/zowe/imperative/issues/549)
- Allow the ConfigAutoStore to store plain-text properties that are defined as secure in the schema (e.g. user, password) [zowe/vscode-extension-for-zowe#1804](https://github.com/zowe/vscode-extension-for-zowe/issues/1804)

## `5.3.2`

- BugFix: Fixed `ProfileInfo.readProfilesFromDisk` failing when team config files and old-school profile directory do not exist.
- BugFix: Fixed `ProfileInfo.updateProperty` not updating properties that are newly present after reloading team config.
- BugFix: Fixed ProfileInfo API not detecting secure credential manager after profiles have been reloaded.
- **Note:** If you are developing an SDK that uses the ProfileInfo API, use the method `ProfileInfo.getTeamConfig` instead of `ImperativeConfig.instance.config` which may contain outdated config or be undefined.

## `5.3.1`

- BugFix: Fixed `config init` saving empty string values to config file when prompt was skipped.
- BugFix: Fixed `ConfigLayers.read` skipping load of secure property values.
- BugFix: Improved performance of `ConfigLayers.activate` by skipping config reload if the active layer directory has not changed.
- BugFix: Removed `async` keyword from `ConfigLayers.read` and `ConfigLayers.write` methods since they do not contain asynchronous code.

## `5.3.0`

- Enhancement: Added environmental variable support to the ProfileInfo APIs by defaulting `homeDir` to `cliHome`. [zowe/vscode-extension-for-zowe#1777](https://github.com/zowe/vscode-extension-for-zowe/issues/1777)
- BugFix: Updated `cli-table3` dependency for performance improvements.
- BugFix: Fixed `config init` not replacing empty values with prompted for values in team config. [#821](https://github.com/zowe/imperative/issues/821)

## `5.2.2`

- BugFix: Fixed `config secure` not respecting the `rejectUnauthorized` property in team config. [#813](https://github.com/zowe/imperative/issues/813)
- BugFix: Fixed `config import` not respecting the `rejectUnauthorized` property in team config. [#816](https://github.com/zowe/imperative/issues/816)

## `5.2.1`

- BugFix: Fixed issue where `config auto-init` may fail to create project config when global config already exists. [#810](https://github.com/zowe/imperative/issues/810)

## `5.2.0`

- Enhancement: Adds the ability for CLIs and Plug-ins to override some of the prompting logic if an alternate property is set.
- BugFix: Fixed `osLoc` information returning project level paths instead of the global layer. [#805](https://github.com/zowe/imperative/pull/805)
- BugFix: Fixed `autoStore` not being checked by `updateKnownProperty`. [#806](https://github.com/zowe/imperative/pull/806)
- BugFix: Fixed `plugins uninstall` command failing when there is a space in the install path.

## `5.1.0`

- Enhancement: Introduced flag `--show-inputs-only` to show the inputs of the command
  that would be used if a command were executed.
- Enhancement: Added dark theme to web help that is automatically used when system-wide dark mode is enabled.
- BugFix: Fixed ProfileInfo API `argTeamConfigLoc` not recognizing secure fields in multi-layer operations. [#800](https://github.com/zowe/imperative/pull/800)
- BugFix: Fixed ProfileInfo API `updateKnownProperty` possibly storing information in the wrong location due to optional osLoc information. [#800](https://github.com/zowe/imperative/pull/800)

## `5.0.2`

- BugFix: Fixed a bug where, upon trying to create a V1 profile containing no secure properties, if the credential manager cannot access the credential vault, an error would be thrown.

## `5.0.1`

- BugFix: Fixed ProfileInfo API targeting default base profile instead of the operating layer's base profile. [#791](https://github.com/zowe/imperative/issues/791)

## `5.0.0`

- Major: Introduced Team Profiles, Daemon mode, and more. See the prerelease items below for more details.

## `5.0.0-next.202204142147`

- BugFix: Fixed missing `osLoc` information from `ProfileInfo.getAllProfiles()`. [#771](https://github.com/zowe/imperative/issues/771)
- BugFix: Fixed updateKnownProperty saving to the active layer instead of the layer of the desired profile.
- Enhancement: Added the ability to exclude the home directory from `ProfileInfo.getAllProfiles()`. [#787](https://github.com/zowe/imperative/issues/771)

## `5.0.0-next.202204131728`

- BugFix: Fixed `autoStore` property not being merged properly between team config layers.

## `5.0.0-next.202204111131`

- BugFix: Updated `moment` dependency.

## `5.0.0-next.202204081605`

- BugFix: Fixed `config set` command not respecting the property type defined in the schema. [#772](https://github.com/zowe/imperative/issues/772)

## `5.0.0-next.202204051515`

- Enhancement: Added support for profile name aliases in team config so that `--zosmf-profile lpar1` falls back to profile "zosmf_lpar1" if "lpar1" does not exist.
- BugFix: Reworded potentially misleading output of `config convert-profiles` command mentioning obsolete plug-ins.
- BugFix: Made `--dry-run` and `--prompt` options mutually exclusive on `config init` command.
- **Next Breaking**: The team config API method `config.api.profiles.get` now returns `null` if a profile doesn't exist unless `mustExist` is false. [#518](https://github.com/zowe/imperative/issues/518)
- BugFix: Added the ability to read option values from aliases. Enhanced backward compatibility with V1 profiles. [#770](https://github.com/zowe/imperative/issues/770)

## `5.0.0-next.202203311701`

- BugFix: Allowed `ProfileCredentials.isSecured` to be insecure on teamConfig based on existing secure fields. [#762](https://github.com/zowe/imperative/issues/762)

## `5.0.0-next.202203231534`

- Enhancement: Added JSON property autocompletion to `secure` array in team config files. [zowe/zowe-cli#1187](https://github.com/zowe/zowe-cli/issues/1187)
- BugFix: Fixed incorrect description for untyped profiles in team config files. [zowe/zowe-cli#1303](https://github.com/zowe/zowe-cli/issues/1303)
- **Next Breaking**: Schema files created or updated with the above changes are not backward compatible with older versions of Imperative.

## `5.20.0`

- Enhancement: Added the ability to `forceUpdate` a property using the `ProfileInfo.updateProperty` method. [zowe-explorer#2493](https://github.com/zowe/vscode-extension-for-zowe/issues/2493)

## `5.0.0-next.202203222132`

- BugFix: Reverted unintentional breaking change that prevented `DefaultCredentialManager` from finding Keytar outside of calling CLI's node_modules folder.

## `5.0.0-next.202203211501`

- Enhancement: Enhanced secure ProfileInfo APIs with user-defined secure properties. [#739](https://github.com/zowe/imperative/issues/739)
- Enhancement: Introduced `updateKnownProperty` which will update a given property in most cases and `resolve(false)` otherwise.
- Enhancement: Introduced `updateProperty` which takes care of special cases where the property is not found.
- Enhancement: Allowed adding and removing properties from the ProfileInfo class.
- Enhancement: Allowed properties to be stored securely from the ProfileInfo class. `v2 profiles only`
- BugFix: Removed user-defined secure properties if `getSecureValues: false`. [#738](https://github.com/zowe/imperative/issues/738)
- BugFix: Removed strict requirement of `IHandlerParameter` from the `ConfigAutoStore` class by implementing helper methods.
- BugFix: Allowed `private loadSchema` function to return the corresponding schema for a user config. [#758](https://github.com/zowe/imperative/issues/758)

## `5.0.0-next.202203181826`

- BugFix: Fixed a bug where the `<APP>_EDITOR` environment variable was not being respected in a graphical environment [zowe/zowe-cli#1335](https://github.com/zowe/zowe-cli/issues/1335)
- BugFix: Fixed AbstractRestClient returning compressed data in `causeErrors` property for streamed responses. [#753](https://github.com/zowe/imperative/issues/753)

## `5.0.0-next.202203091934`

- Enhancement: Added prompt for base profile host property to `zowe config init`. [zowe/zowe-cli#1219](https://github.com/zowe/zowe-cli/issues/1219)
- **Next Breaking**
  - The `getSecureValue` callback property has been renamed to `getValueBack` on the `IConfigBuilderOpts` interface.
  - If your plug-in defines profile properties with `includeInTemplate` and `secure` both true, the `config init` command no longer prompts for their values.

## `5.0.0-next.202203072228`

- BugFix: Removed extra space in help text following option name [#745](https://github.com/zowe/imperative/issues/745).
- BugFix: Fixed Ctrl+C (SIGINT) response to CLI prompts throwing an error rather than exiting silently.

## `5.0.0-next.202202232039`

- Enhancement: Added `stdin` property to `IHandlerParameters` which defaults to `process.stdin` and can be overridden with another readable stream in daemon mode.
  - This may be a breaking change for unit tests that mock the `IHandlerParameters` interface since a required property has been added.
- **Next Breaking**: Replaced `IYargsContext` interface with `IDaemonContext` and renamed `yargsContext` property of `ImperativeConfig.instance` to `daemonContext`. A context object is no longer supplied to `yargs` since it gets parsed as CLI arguments which is undesired behavior.

## `5.0.0-next.202202111730`

- **Next Breaking**: Changed the default behavior of `Config.save` and `ConfigSecure.save` APIs to save only the active config layer. [#732](https://github.com/zowe/imperative/issues/732)

## `5.0.0-next.202202111433`

- Enhancement: Convert previously used profile property names into V2-compliant property names during the `zowe config convert-profiles` command. Conversions are: hostname -> host, username -> user, pass -> password.

## `5.0.0-next.202201311918`

- BugFix: Fixed useful debugging information missing from error message when Keytar module fails to load.

## `5.0.0-next.202201102100`

- BugFix: Fixed ZOWE_CLI_HOME environment variable not respected by team config in daemon mode. [zowe/zowe-cli#1240](https://github.com/zowe/zowe-cli/issues/1240)

## `5.0.0-next.202201071721`

- Enhancement: Replaced hidden `--dcd` option used by CommandProcessor in daemon mode with IDaemonResponse object.
- **Next Breaking**
  - Changed the "args" type on the `Imperative.parse` method to allow a string array.
  - Restructured the IDaemonResponse interface to provide information to CommandProcessor.

## `5.0.0-next.202201061509`

- Enhancement: Added `overwrite` option for `zowe config init` command to overwrite config files instead of merging new changes. [#1036](https://github.com/zowe/zowe-cli/issues/1036)

## `5.0.0-next.202201051456`

- BugFix: Fixed inconsistent error message when invalid CLI command is run in daemon mode. [zowe/zowe-cli#1081](https://github.com/zowe/zowe-cli/issues/1081)

## `5.0.0-next.202112221912`

- Enhancement: Added `delete` option to `config convert-profiles` command.

## `5.0.0-next.202112201553`

- BugFix: Fixed config auto-store may store secure properties in plain text if secure array is outside of subprofile in team config. [#709](https://github.com/zowe/imperative/issues/709)

## `5.0.0-next.202112171553`

- Enhancement: Added `config convert-profiles` command that converts v1 profiles to team config. [zowe/zowe-cli#896](https://github.com/zowe/zowe-cli/issues/896)
- Enhancement: Added `config edit` command that opens config JSON file in default text editor. [zowe/zowe-cli#1072](https://github.com/zowe/zowe-cli/issues/1072)

## `5.0.0-next.202112151934`

- BugFix: Removed `@internal` methods from type declarations so they don't appear in IntelliSense. [#679](https://github.com/zowe/imperative/issues/679)
- BugFix: Made the `ProfileInfo.initSessCfg` method public for easier instantiation of classes that extend AbstractSession.
- Deprecated: All methods in the `IHandlerParameters.profiles` class. Use the `ConfigProfiles` API for team config instead.

## `5.0.0-next.202112132158`

- Enhancement: Added an environment variable to control whether or not sensitive data will be masked in the console output.<br/>
  This behavior excludes any TRACE level logs for both, Imperative.log and AppName.log.<br/>
  This behavior also excludes properties defined as secure by the plugin developers.<br/>
  If the schema definition is not found, we will exclude the following properties: user, password, tokenValue, and keyPassphrase.<br/>
  More information: [zowe/zowe-cli #1106](https://github.com/zowe/zowe-cli/issues/1106)

## `5.0.0-next.202112101814`

- BugFix: Fixed daemon mode not loading secure properties in team config. [zowe/zowe-cli#1232](https://github.com/zowe/zowe-cli/issues/1232)

## `5.0.0-next.202112021611`

- BugFix: Fixed `config import` and `config init` behaving incorrectly when config JSON exists in higher level directory. [zowe/zowe-cli#1218](https://github.com/zowe/zowe-cli/issues/1218)
- BugFix: Fixed `config import` command not failing when positional argument "location" is missing.

## `5.0.0-next.202112012301`

- Enhancement: Changed CLI prompt input to be hidden for properties designated as secure in team config. [zowe/zowe-cli#1106](https://github.com/zowe/zowe-cli/issues/1106)
- BugFix: Improved error message when Keytar module fails to load. [#27](https://github.com/zowe/imperative/issues/27)
- **Next Breaking**
  - Removed the `ConfigProfiles.load` API method. Use the methods `ConfigLayers.find` and `ConfigSecure.securePropsForProfile` instead. [#568](https://github.com/zowe/imperative/issues/568)

## `5.0.0-next.202111301806`

- Enhancement: Added a utility function to get basic system architecture and platform info

## `5.0.0-next.202111292021`

- **Next Breaking**: Use JSON-based communication protocol between imperative daemon server and client.

## `5.0.0-next.202111192150`

- BugFix: Changed credentials to be stored securely by default for v1 profiles to be consistent with the experience for v2 profiles. [zowe/zowe-cli#1128](https://github.com/zowe/zowe-cli/issues/1128)
- **Next Breaking**
  - Removed the `credentialServiceName` property from ImperativeConfig. The default credential manager uses the `name` property instead.

## `5.0.0-next.202111101806`

- Enhancement: Added `dry-run` option for `zowe config init` command to preview changes instead of saving them to disk. [#1037](https://github.com/zowe/zowe-cli/issues/1037)
- Bugfix: Fix crashing issue related to reloading the config when `--dcd` option is specified [#943](https://github.com/zowe/zowe-cli/issues/943) [#1190](https://github.com/zowe/zowe-cli/issues/1190)

## `5.0.0-next.202111032034`

- Enhancement: Added `autoStore` property to config JSON files which defaults to true. When this property is enabled and the CLI prompts you to enter connection info, the values you enter will be saved to disk (or credential vault if they are secure) for future use. [zowe/zowe-cli#923](https://github.com/zowe/zowe-cli/issues/923)
- **Next Breaking**
  - Changed the default behavior of `Config.set` so that it no longer coerces string values to other types unless the `parseString` option is true.

## `5.0.0-next.202110201735`

- **LTS Breaking**
  - Changed the return value of the public `PluginManagementFacility.requirePluginModuleCallback` function
- BugFix: Updated the profiles list as soon as the plugin is installed.

## `5.0.0-next.202110191937`

- **Next Breaking**: Added the new, required, abstract method 'displayAutoInitChanges' to the 'BaseAutoInitHandler' class.

## `5.0.0-next.202110071645`

- Enhancement: Added `config update-schemas [--depth <value>]` command. [zowe/zowe-cli#1059](https://github.com/zowe/zowe-cli/issues/1059)
- Enhancement: Added the ability to update the global schema file when installing a new plugin. [zowe/zowe-cli#1059](https://github.com/zowe/zowe-cli/issues/1059)
- **Next Breaking**
  - Renamed public static function ConfigSchemas.loadProfileSchemas to ConfigSchemas.loadSchema

## `5.0.0-next.202110011948`

- **LTS Breaking**: Changed default log level from DEBUG to WARN for Imperative logger and app logger to reduce the volume of logs written to disk. [#634](https://github.com/zowe/imperative/issues/634)

## `5.0.0-next.202109281439`

- Enhancement: Added `config import` command that imports team config files from a local path or web URL. [#1083](https://github.com/zowe/zowe-cli/issues/1083)
- Enhancement: Added Help Doc examples for the `zowe config` group of commands. [#1061](https://github.com/zowe/zowe-cli/issues/1061)

## `5.0.0-next.202109031503`

- Enhancement: Log in to authentication service to obtain token value instead of prompting for it in `config secure` command.

## `5.0.0-next.202108181618`

- **LTS Breaking**: Make `fail-on-error` option true by default on `zowe plugins validate` command.

## `5.0.0-next.202108121732`

- Enhancement: Flattened the default profiles structure created by the `config init` command.
- **Next Breaking**: Split up authToken property in team config into tokenType and tokenValue properties to be consistent with Zowe v1 profiles.

## `5.0.0-next.202108062025`

- BugFix: Export all Config related interfaces.

## `5.0.0-next.202107122104`

- BugFix: Fixed secure credentials not being stored by the `config auto-init` command.

## `5.0.0-next.202107092101`

- Enhancement: Adds the `config auto-init` base handler and command builder, allowing a CLI to build a configuration auto-initialization command and handler
- Enhancement: Adds the optional `configAutoInitCommandConfig` interface to the IImperativeConfig interface, allowing for an auto-init command to be generated if a CLI supports it
- Enhancement: Better support for comments in JSON
- Bugfix: Revert schema changes related to additionalProperties. Re-enable IntelliSense when editing zowe.config.json files
- **Next Breaking**
  - Changed the schema paths and updated schema version

## `5.0.0-next.202106221817`

- **Next Breaking**
  - Replaced --user with --user-config on all config command groups due to conflict with --user option during config auto-initialization
  - Replaced --global with --global-config on all config command groups for consistency

## `5.0.0-next.202106212048`

- Enhancement: A new interface (IApimlSvcAttrs) was added. A property (apimlConnLookup) of that interface type was added to IImperativeConfig to enable plugins to tie themselves to an APIML service. Zowe-CLI can then ask APIML for the configuration data for the plugin to connect to that service.

## `5.0.0-next.202106041929`

- **LTS Breaking**: Removed the following previously deprecated items:
  - ICliLoadProfile.ICliILoadProfile -- use ICliLoadProfile.ICliLoadProfile
  - IImperativeErrorParms.suppressReport -- has not been used since 10/17/2018
  - IImperativeConfig.pluginBaseCliVersion -- has not been used since version 1.0.1
  - AbstractRestClient.performRest -- use AbstractRestClient.request
  - AbstractSession.HTTP_PROTOCOL -- use SessConstants.HTTP_PROTOCOL
  - AbstractSession.HTTPS_PROTOCOL -- use SessConstants.HTTPS_PROTOCOL
  - AbstractSession.TYPE_NONE -- use SessConstants.AUTH_TYPE_NONE
  - AbstractSession.TYPE_BASIC -- use SessConstants.AUTH_TYPE_BASIC
  - AbstractSession.TYPE_BEARER -- use SessConstants.AUTH_TYPE_BEARER
  - AbstractSession.TYPE_TOKEN -- use SessConstants.AUTH_TYPE_TOKEN

## `5.0.0-next.202104262004`

- Enhancement: Remove message about NPM peer dep warnings that no longer applies to npm@7.
- **LTS Breaking**: Imperative no longer requires plug-ins to include CLI package as a peer dependency. It is recommended that CLI plug-ins remove their peer dependency on @zowe/cli for improved compatibility with npm@7. This is a breaking change for plug-ins, as older versions of Imperative will fail to install a plug-in that lacks the CLI peer dependency.

## `5.0.0-next.202104140156`

- BugFix: Allow SCS to load new securely stored credentials. [#984](https://github.com/zowe/zowe-cli/issues/984)

## `5.0.0-next.202104071400`

- Enhancement: Add the ProfileInfo API to provide the following functionality:
  - Read configuration from disk.
  - Transparently read either a new team configuration or old style profiles.
  - Resolve order of precedence for profile argument values.
  - Provide information to enable callers to prompt for missing profile arguments.
  - Retain the location in which a profile or argument was found.
  - Automatically initialize CredentialManager, including an option to specify a custom keytar module.
  - Provide a means to postpone the loading of secure arguments until specifically requested by the calling app to delay loading sensitive data until it is needed.
  - Provide access to the lower-level Config API to fully manipulate the team configuration file.

## `5.0.0-next.202103111923`

- Enhancement: Allow custom directory to be specified for project config in `Config.load` method. [#544](https://github.com/zowe/imperative/issues/544)
- BugFix: Fixed Config object not exported at top level. [#543](https://github.com/zowe/imperative/issues/543)

## `5.0.0-next.202101292016`

- BugFix: Fixed error when Imperative APIs are called and "config" property of ImperativeConfig is not initialized. [#533](https://github.com/zowe/imperative/issues/533)

## `5.0.0-next.202101281717`

- Enhancement: Added new config API intended to replace the profiles API, and new "config" command group to manage config JSON files. The new API makes it easier for users to create, share, and switch between profile configurations.
- Deprecated: The "profiles" command group for managing global profiles in "{cliHome}/profiles". Use the new "config" command group instead.
- **LTS Breaking**: Removed "config" command group for managing app settings in "{cliHome}/imperative/settings.json". If app settings already exist they are still loaded for backwards compatibility. For storing app settings use the new config API instead.
- Enhancement: Added support for secure credential storage without any plug-ins required. Include the "keytar" package as a dependency in your CLI to make use of it.
- Enhancement: Added `deprecatedReplacement` property to `ICommandDefinition` to deprecate a command.

## `5.0.0-next.202010301408`

- Enhancement: Allow hidden options.

## `5.0.0-next.202010161240`

- Enhancement: Allow process exit code to be passed to daemon clients.

## `5.0.0-next.202009251501`

- Enhancement: add support for CLIs that want to run as a persistent process (daemon mode).

## `4.18.3`

- BugFix: Removed `moment` dependency.

## `4.18.2`

- BugFix: Updated `moment` dependency.

## `4.18.1`

- BugFix: Fixed AbstractRestClient returning compressed data in `causeErrors` property for streamed responses. [#753](https://github.com/zowe/imperative/issues/753)

## `4.18.0`

- Enhancement: Sorted output of `plugins list` command in alphabetical order to make it easier to read. [#489](https://github.com/zowe/imperative/issues/489)
- Enhancement: Added `--short` option to `plugins list` command to abbreviate its output. [#743](https://github.com/zowe/imperative/issues/743)
- BugFix: Fixed single character options rendered in help with double dash instead of single dash. [#638](https://github.com/zowe/imperative/issues/638)

## `4.17.6`

- BugFix: Fixed an error where, in certain situations, the web help displays data for another command with the same name. [#728](https://github.com/zowe/imperative/issues/728)
- BugFix: Fixed web help wrongly escaping characters inside code blocks. [#730](https://github.com/zowe/imperative/issues/730)

## `4.17.5`

- BugFix: Updated log4js and nanoid for improved security.

## `4.17.4`

- BugFix: Fixed --hw not adding new lines when `\n` is present in the text. [#715](https://github.com/zowe/imperative/issues/715)

## `4.17.3`

- BugFix: Fixed AbstractRestClient silently failing to decompress last chunk of gzip-compressed binary data that is truncated.

## `4.17.2`

- BugFix: Updated prettyjson and cli-table3 in order to lockdown the `colors` package. [#719](https://github.com/zowe/imperative/issues/719)
- BugFix: Updated markdown-it to address a vulnerability. [Snyk Report](https://security.snyk.io/vuln/SNYK-JS-MARKDOWNIT-2331914)

## `4.17.1`

- BugFix: Fixed an issue where plugin install and uninstall did not work with NPM version 8. [#683](https://github.com/zowe/imperative/issues/683)

## `4.17.0`

- Enhancement: Export the Imperative Command Tree on the data object of the `zowe --ac` command when `--rfj` is specified.

## `4.16.2`

- BugFix: Reverts hiding the cert-key-file path so users can see what path was specified and check if the file exists

## `4.16.1`

- BugFix: Updated dependencies to resolve problems with the ansi-regex package

## `4.16.0`

- Enhancement: Implemented the ability to authenticate using client certificates in PEM format.

## `4.15.1`

- Bugfix: Updated js-yaml to resolve a potential security issue

## `4.15.0`

- Enhancement: Improved command suggestions for mistyped commands, add aliases to command suggestions

## `4.14.0`

- Enhancement: The `plugins validate` command returns an error code when plugins have errors if the new `--fail-on-error` option is specified. Also added `--fail-on-warning` option to return with an error code when plugins have warnings. [#463](https://github.com/zowe/imperative/issues/463)
- BugFix: Fixed regression where characters are not correctly escaped in web help causing extra slashes ("\") to appear. [#644](https://github.com/zowe/imperative/issues/644)

## `4.13.4`

- BugFix: Added missing periods at the end of command group descriptions for consistency. [#55](https://github.com/zowe/imperative/issues/55)

## `4.13.3`

- Performance: Improved the way that HTTP response chunks are saved, reducing time complexity from O(n<sup>2</sup>) to O(n). This dramatically improves performance for larger requests. [#618](https://github.com/zowe/imperative/pull/618)

## `4.13.2`

- BugFix: Fixed web help examples description typo at line 440 in `packages/cmd/src/CommandPreparer.ts`. [#612](https://github.com/zowe/imperative/issues/612)
- BugFix: Fixed Markdown special characters not being escaped in web help for descriptions of positional options and examples. [#620](https://github.com/zowe/imperative/issues/620)
- BugFix: Fixed subgroups not being displayed under their own heading in web help. [#323](https://github.com/zowe/imperative/issues/323)

## `4.13.1`

- BugFix: Fixed active command tree item not updating in web help when scrolling. [#425](https://github.com/zowe/imperative/issues/425)
- BugFix: Fixed main page of web help not staying scrolled to top of page when loaded. [#525](https://github.com/zowe/imperative/issues/525)

## `4.13.0`

- Enhancement: Added headers[] option to TextUtils.getTable(). [#369](https://github.com/zowe/imperative/issues/369)
- BugFix: Print a subset of the `stdout` and `stderr` buffers when calling `mProgressApi`'s `endBar()` to prevent duplication of output.
- Bugfix: Replaced `this` with `ImperativeConfig.instance` in `ImperativeConfig.getCallerFile()`. [#5](https://github.com/zowe/imperative/issues/5)

## `4.12.0`

- Enhancement: Added decompression support for REST responses with Content-Encoding `gzip`, `deflate`, or `br`. [#318](https://github.com/zowe/imperative/issues/318)

## `4.11.2`

- BugFix: Added `Protocol` to the Error Details coming from the `AbstractRestClient`. [#539](https://github.com/zowe/imperative/issues/539)

## `4.11.1`

- BugFix: Fixed vulnerabilities by replacing marked with markdown-it and sanitize-html.
- BugFix: Fixed plugin install failing to install package from private registry.

## `4.11.0`

- Enhancement: Fixed plugin install commands which were broken in npm@7. [#457](https://github.com/zowe/imperative/issues/457)
- BugFix: Fixed incorrect formatting of code blocks in web help. [#535](https://github.com/zowe/imperative/issues/535)

## `4.10.2`

- BugFix: Fixed vulnerabilities by updating marked

## `4.10.1`

- BugFix: Fixed an issue when `TypeError` has been raised by `Logger.getCallerFileAndLineTag()` when there was not filename for a stack frame. [#449](https://github.com/zowe/imperative/issues/449)

## `4.10.0`

- Enhancement: Added an `arrayAllowDuplicate` option to the `ICommandOptionDefinition` interface. By default, the option value is set to `true` and duplicate values are allowed in an array. Specify `false` if you want Imperative to throw an error for duplicate array values. [#437](https://github.com/zowe/imperative/issues/437)

## `4.9.0`

- BugFix: Updated `opener` dependency due to command injection vulnerability on Windows - [GHSL-2020-145](https://securitylab.github.com/advisories/GHSL-2020-145-domenic-opener)
- Enhancement: Expose `trim` parameter from `wrap-ansi` within `TextUtils.wordWrap()`

## `4.8.1`

- BugFix: Fixed an issue with `ConnectionPropsForSessCfg` where the user would be prompted for user/password even if a token was present. [#436](https://github.com/zowe/imperative/pull/436)

## `4.8.0`

- Enhancement: Added the SSO Callback function, which allows applications to call their own functions while validating session properties (i.e. host, port, user, password, token, etc...). The callback option is named `getValuesBack`. [#422](https://github.com/zowe/imperative/issues/422)

## `4.7.6`

- Enhancement: Added support for dynamically generated cookie names. Updated `AbstractSession.storeCookie()` to process cookie names that are not fully known at build-time. [#431](https://github.com/zowe/imperative/pull/431)

## `4.7.5`

- BugFix: Added support for creating an array with `allowableValues`. Previously, array type options could fail in the Syntax Validator. [#428](https://github.com/zowe/imperative/issues/428)

## `4.7.4`

- Fix update profile API storing secure fields incorrectly when called without CLI args

## `4.7.3`

- Fix web help failing to load in Internet Explorer 11
- Fix `--help-web` not working on macOS when DISPLAY environment variable is undefined
- Change type of `ISession.tokenType` to "string" (for compatiblity with versions older than 4.7.0).

## `4.7.2`

- Hide sensitive session properties (user, password, and token value) in log file. Since 4.7.0, only password was hidden.

## `4.7.1`

- Don't load token value into Session object if user or password are supplied

## `4.7.0`

- Add the --dd flag to profile creation to allow the profile to be created without the default values specified for that profile.
- Use a token for authentication if a token is present in the underlying REST session object.
- Added a new ConnectionPropsForSessCfg.addPropsOrPrompt function that places credentials (including a possible token) into a session configuration object.
  - Plugins must use this function to create their sessions to gain the features of automatic token-handling and prompting for missing connection options.
  - Connection information is obtained from the command line, environment variables, a service profile, a base profile, or from an option's default value in a service profile's definition, in that order.
  - If key connection information is not supplied to any cor Zowe command, the command will prompt for:
    - host
    - port
    - user
    - and password
  - Any prompt will timeout after 30 seconds so that it will not hang an automated script.
- Add base profiles, a new type of profile which can store values shared between profiles of other types.
  - The properties that are currently recognized in a base profile are:
    - host
    - port
    - user
    - password
    - rejectUnauthorized
    - tokenType
    - tokenValue
  - To use base profiles in an Imperative-based CLI, define a `baseProfile` schema on your Imperative configuration object.
  - If the `baseProfile` schema is defined, base profile support will be added to any command that uses profiles.
- Due to new options (like tokenValue) help text will change. Plugin developers may have to update any mismatched snapshots in their automated tests.
- Updated the version of TypeScript from 3.7.4 to 3.8.0.
- Updated the version of TSLint from 5.x to 6.1.2.
- Add login and logout commands to get and delete/invalidate tokens
  - Add showToken flag to display token only, and not save it to the user profile
  - Add ability to create a user profile on login if no profile of that type existed previously

## `4.6.4`

- Fix optional secure fields not deleted when overwriting a profile

## `4.6.3`

- Update log4js to improve Webpack compatibility for extenders

## `4.6.2`

- Fix vulnerabilities by updating yargs

## `4.6.1`

- Update perf-timing version

## `4.6.0`

- Add Bearer token in rest Session

## `4.5.6`

- Fix allowable values not exactly matching input

## `4.5.5`

- Fix absence of default value text when falsy values are used.

## `4.5.4`

- Patched vulnerabilities.

## `4.5.3`

- Fixed alignment of output from `zowe plugins list` command.

## `4.5.2`

- Fix failure to load secure profile fields that are optional when no value is found. Thanks @tjohnsonBCM
- Don't load secure profile fields when deleting profile. Thanks @tjohnsonBCM
- Deprecate the interface `ICliILoadProfile`. Use `ICliLoadProfile` instead.

## `4.5.1`

- Check that password is defined when `AbstractSession` uses auth. Thanks @apsychogirl
- Expose `IRestOptions` type in the API. Thanks @apsychogirl

## `4.5.0`

- Add `request` function to `AbstractRestClient` that returns REST client object in response. Thanks @Alexandru-Dimitru
- Deprecate the method `AbstractRestClient.performRest`. Use `AbstractRestClient.request` instead.

## `4.0.0`

- Support `prompt*` as a value for any CLI option to enable interactive prompting.

## `3.0.0`

- Rename package from "@brightside/imperative" to "@zowe/imperative".
- Change name of config option "credential-manager" to "CredentialManager".
