"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FooProfileConfig = {
    type: "foo",
    schema: {
        type: "object",
        title: "The Foo command profile schema",
        description: "The Foo command profile description",
        properties: {
            size: {
                optionDefinition: {
                    description: "How big is the Foo",
                    type: "string",
                    name: "size", aliases: ["s"],
                    required: true,
                    defaultValue: "small"
                },
                type: "string",
            },
            duration: {
                optionDefinition: {
                    description: "How may days will it take to fix Foo",
                    type: "number",
                    name: "duration", aliases: ["d"],
                    required: false
                },
                type: "number",
            },
        },
        required: ["size", "duration"],
    },
    validationPlanModule: __dirname + "/FooProfileValidationPlan"
};
//# sourceMappingURL=FooProfileConfig.js.map