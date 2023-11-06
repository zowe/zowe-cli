"use strict";
const FooProfileConfig_1 = require("./profiles/FooProfileConfig");
const BarProfileConfig_1 = require("./profiles/BarProfileConfig");
const config = {
    /**
     * You can use both "definitions" and commandModuleGlobs --
     * the list of commands will be combined between the two
     */
    definitions: [
        {
            name: "foo",
            description: "dummy foo command",
            type: "command",
            handler: "./lib/sample-plugin/cmd/foo/foo.handler",
            profile: {
                required: ["foo"]
            }
        },
        {
            name: "bar",
            description: "dummy bar command",
            type: "command",
            handler: "./lib/sample-plugin/cmd/bar/bar.handler",
            profile: {
                required: ["bar"]
            }
        }
    ],
    pluginHealthCheck: "./lib/sample-plugin/healthCheck.handler",
    commandModuleGlobs: ["**/cmd/*/*.definition!(.d).*s"],
    rootCommandDescription: "Test plugin with globs and profiles",
    pluginBaseCliVersion: "^0.4.0-1",
    defaultHome: "../../../../../../__results__/.pluginstest",
    productDisplayName: "Sample CLI",
    primaryTextColor: "blue",
    name: "normal-plugin-3",
    logging: {
        additionalLogging: [
            {
                apiName: "another",
            },
            {
                apiName: "yetAnother",
                logFile: "a/different/place/here.log",
            }
        ]
    },
    secondaryTextColor: "yellow",
    profiles: [FooProfileConfig_1.FooProfileConfig, BarProfileConfig_1.BarProfileConfig],
    progressBarSpinner: ".oO0Oo.",
    experimentalCommandDescription: "These commands may damage your fruits."
    // autoGenerateProfileCommands: false
};
module.exports = config;
//# sourceMappingURL=configuration.js.map