"use strict";
const globcmd1_definition_1 = require("./globcmd1/globcmd1.definition");
const globcmd2_definition_1 = require("./globcmd2/globcmd2.definition");
const GlobGroupDefinition = {
    name: "globgroup",
    summary: "The command group definition of commands formed from globs",
    description: "[actions] in Brightside are groups of commands.\n" +
        "For this action (\"globgroup\") we include 2 simple commands formed from globs.",
    type: "group",
    children: [globcmd1_definition_1.GlobCmd1Definition, globcmd2_definition_1.GlobCmd2Definition]
};
module.exports = GlobGroupDefinition;
//# sourceMappingURL=globgroup.definition.js.map