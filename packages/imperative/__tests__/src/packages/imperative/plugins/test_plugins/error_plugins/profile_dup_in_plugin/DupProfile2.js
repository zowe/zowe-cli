"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DupProfile2 = {
    type: "DupProfile",     // both DupProfile1.js and DupProfile2.js have this type ---> error!!!
    schema: {
        type: "object",
        title: "The Bar command profile schema",
        description: "Credentials for the Bar command",
        properties: {
            username: {
                optionDefinition: {
                    description: "The username to associate to this profile",
                    type: "string",
                    name: "username",
                    required: true
                },
                type: "string"
            },
          password: {
                optionDefinition: {
                    description: "The password to associate to this profile",
                    type: "string",
                    name: "password",
                    required: true
                },
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=BarProfileConfig.js.map