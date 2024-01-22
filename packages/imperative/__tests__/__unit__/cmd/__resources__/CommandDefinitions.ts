/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { ICommandDefinition } from "../../../../src/cmd/doc/ICommandDefinition";
import { ICommandOptionDefinition } from "../../../../src/cmd/doc/option/ICommandOptionDefinition";
import { ICommandProfileTypeConfiguration } from "../../../../src/cmd/doc/profiles/definition/ICommandProfileTypeConfiguration";

export const COMPLEX_COMMAND: ICommandDefinition = {
    name: "test-group",
    description: "my group",
    type: "group",
    children: [
        {
            name: "test-command",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string",
                    required: false
                }
            ]
        }
    ]
};

export const COMPLEX_COMMAND_WITH_ALIASES: ICommandDefinition = {
    name: "test-group",
    description: "my group",
    type: "group",
    aliases: ["tg"],
    children: [
        {
            name: "test-command",
            description: "my command",
            type: "command",
            aliases: ["tc"],
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string",
                    aliases: ["to"]
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean",
                    aliases: ["tb"]
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string",
                    required: false
                }
            ]
        },
        {
            name: "test-group-2",
            description: "my group",
            type: "group",
            aliases: ["tg2"],
            children: [
                {
                    name: "test-command-one",
                    description: "my command",
                    type: "command",
                    aliases: ["tc"],
                    options: [
                        {
                            name: "test-option",
                            description: "the option",
                            type: "string",
                            aliases: ["to"]
                        },
                        {
                            name: "test-boolean",
                            description: "the boolean option",
                            type: "boolean",
                            aliases: ["tb"]
                        }
                    ],
                    positionals: [
                        {
                            name: "positional2",
                            description: "the positional option",
                            type: "string",
                            required: false
                        }
                    ]
                },
                {
                    name: "test-command-two",
                    description: "my command",
                    type: "command",
                    options: [
                        {
                            name: "test-option",
                            description: "the option",
                            type: "string",
                            aliases: ["to"]
                        },
                        {
                            name: "test-boolean",
                            description: "the boolean option",
                            type: "boolean",
                            aliases: ["tb"]
                        }
                    ],
                    positionals: [
                        {
                            name: "positional2",
                            description: "the positional option",
                            type: "string",
                            required: false
                        }
                    ]
                }
            ]
        }
    ]
};

export const MULTIPLE_GROUPS: ICommandDefinition = {
    name: "test-outer-group",
    description: "test group",
    type: "group",
    children: [COMPLEX_COMMAND]
};

export const PASS_ON_COMPLEX_COMMAND: ICommandDefinition = {
    name: "test-group",
    description: "my group",
    type: "group",
    children: [
        {
            name: "test-command-child1",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ]
        },
        {
            name: "test-command-child2",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ]
        },
        {
            name: "test-command-child3",
            description: "my command",
            type: "command",
            enableStdin: false,
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ],
            profile: {
                required: ["apple"]
            }
        }
    ]
};

export const PASS_ON_MULTIPLE_GROUPS: ICommandDefinition = {
    name: "test-outer-group",
    description: "test group",
    type: "group",
    options: [
        {
            name: "outer-group-option",
            type: "string",
            description: "This is outer group option"
        }
    ],
    children: [PASS_ON_COMPLEX_COMMAND]
};


export const VALIDATE_COMPLEX_COMMAND: any = {
    name: "test-group",
    description: "my group",
    type: "group",
    children: [
        {
            name: "test-command-child1",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ]
        },
        {
            name: "test-command-child2",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ],
        },
        {
            name: "test-command-child3",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ],
            profile: {
                required: ["apple"]
            }
        }
    ]
};

export const VALIDATE_MULTIPLE_GROUPS: any = {
    name: "test-outer-group",
    description: "test group",
    type: "group",
    children: [VALIDATE_COMPLEX_COMMAND]
};

export const VALID_COMPLEX_COMMAND: any = {
    name: "test-group",
    description: "my group",
    type: "group",
    children: [
        {
            name: "test-command-child1",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ]
        },
        {
            name: "test-command-child2",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ],
            children: [
                {
                    name: "test-command-child-child2",
                    description: "my command",
                    type: "command",
                    options: [
                        {
                            name: "test-option",
                            description: "the option",
                            type: "string"
                        },
                        {
                            name: "test-boolean",
                            description: "the boolean option",
                            type: "boolean"
                        }
                    ],
                    positionals: [
                        {
                            name: "positional1",
                            description: "the positional option",
                            type: "string"
                        }
                    ],
                }
            ]
        },
        {
            name: "test-command-child3",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ],
            profile: {
                required: ["apple"]
            }
        }
    ]
};

export const VALID_MULTIPLE_GROUPS: any = {
    name: "test-outer-group",
    description: "test group",
    type: "group",
    children: [VALID_COMPLEX_COMMAND]
};

export const SUPRESS_OPTION_COMPLEX_COMMAND: ICommandDefinition = {
    name: "test-group",
    description: "my group",
    type: "group",
    children: [
        {
            name: "test-command-child1",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ]
        },
        {
            name: "test-command-child2",
            description: "my command",
            type: "command",
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ]
        },
        {
            name: "test-command-child3",
            description: "my command",
            type: "command",
            enableStdin: false,
            options: [
                {
                    name: "test-option",
                    description: "the option",
                    type: "string"
                },
                {
                    name: "test-boolean",
                    description: "the boolean option",
                    type: "boolean"
                }
            ],
            positionals: [
                {
                    name: "positional1",
                    description: "the positional option",
                    type: "string"
                }
            ],
            profile: {
                required: ["apple"],
                optional: ["grape"],
                suppressOptions: ["grape"]
            }
        }
    ]
};

export const SUPPRESS_OPTION_MULTIPLE_GROUPS: ICommandDefinition = {
    name: "test-outer-group",
    description: "test group",
    type: "group",
    children: [SUPRESS_OPTION_COMPLEX_COMMAND]
};

export const ORIGINAL_DEFINITIONS: ICommandDefinition[] = [
    {
        name: "test-command",
        type: "command",
        description: "Test Command",
        profile: {
            required: ["banana"],
            optional: ["apple"]
        }
    },
    {
        name: "test-group",
        type: "group",
        description: "Test Group",
        children: [{
            experimental: true,
            name: "test-command",
            type: "command",
            description: "Test Command",
            profile: {
                required: ["banana"]
            }
        }]
    }
];

const amountOption: ICommandOptionDefinition = {
    name: "amount",
    aliases: ["a"],
    description: "The amount of fruits.",
    type: "number",
};

export const VALID_COMMANDS_WITH_PROFILES: ICommandDefinition[] = [
    {
        name: "command-with-service-profile",
        type: "command",
        description: "Command with only service profile",
        options: [
            amountOption
        ],
        profile: {
            optional: ["apple"]
        }
    },
    {
        name: "command-with-base-profile",
        type: "command",
        description: "Command with only base profile",
        options: [
            amountOption
        ],
        profile: {
            optional: ["fruit"]
        }
    },
    {
        name: "command-with-both-profiles",
        type: "command",
        description: "Command with both service and base profile",
        options: [
            amountOption
        ],
        profile: {
            optional: ["apple", "fruit"]
        }
    },
];

export const SAMPLE_BASE_PROFILE: ICommandProfileTypeConfiguration = {
    type: "fruit",
    schema: {
        type: "object",
        title: "Fruit Profile",
        description: "Fruit Profile",
        properties: {
            price: {
                type: "number",
                optionDefinition: {
                    name: "price",
                    aliases: ["p"],
                    description: "The price of one fruit.",
                    type: "number",
                }
            }
        },
    },
};
