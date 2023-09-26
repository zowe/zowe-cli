"use strict";
const Profile_1 = require("./DupProfile1.js");
const Profile_2 = require("./DupProfile2.js");
const config = {
    /**
     * You can use both "definitions" and commandModuleGlobs --
     * the list of commands will be combined between the two
     */
    definitions: [
        {
            name: "myCmd",
            description: "dummy command",
            type: "command",
            handler: "./myCmd.handler",
            profile: {
                required: ["DupProps"]
            }
        }
    ],
    pluginHealthCheck: "./healthCheck.handler",
    rootCommandDescription: "Test plugin with profiles",
    pluginBaseCliVersion: "^1.0.0",
    defaultHome: "../../../../../../__results__/.pluginstest",
    productDisplayName: "Sample CLI",
    primaryTextColor: "blue",
    name: "profile_dup_in_plugin",
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
    profiles: [Profile_1.DupProfile1, Profile_2.DupProfile2],
    progressBarSpinner: ".oO0Oo.",
    experimentalCommandDescription: "These commands may damage your fruits."
    // autoGenerateProfileCommands: false
};
module.exports = config;
//# sourceMappingURL=configuration.js.map