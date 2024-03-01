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

import { IProfileTypeConfiguration } from "../../../profiles/src/doc/config/IProfileTypeConfiguration";

export const TEST_PROFILE_ROOT_DIR: string = "__tests__/__results__/test_profiles/root/dir/";

/*******************************************************************************
 * Profile Test Constants                                                      *
 *******************************************************************************/

export const FRUIT_BASKET: string = "fruitbasket";
export const FRUIT_BASKET_DIR: string = "/" + FRUIT_BASKET + "/";
export const FRUIT_BASKET_BAD: string = "FRUIT_BAD_BASKET";
export const FRUIT_BASKET_BAD_DIR: string = "/" + FRUIT_BASKET_BAD + "/";
export const FRUIT_BASKET_WORSE: string = "FRUIT_WORSE_BASKET";
export const FRUIT_BASKET_WORSE_DIR: string = "/" + FRUIT_BASKET_WORSE + "/";

/*******************************************************************************
 * Sample Type Definitions                                                     *
 *******************************************************************************/

export const STRAWBERRY_PROFILE_TYPE: string = "strawberry";
export const APPLE_PROFILE_TYPE: string = "apple";
export const BANANA_PROFILE_TYPE: string = "banana";
export const GRAPE_PROFILE_TYPE: string = "grape";
export const MANGO_PROFILE_TYPE: string = "mango";
export const BLUEBERRY_PROFILE_TYPE: string = "blueberry";
export const ORANGE_PROFILE_TYPE: string = "orange";
export const SECURE_ORANGE_PROFILE_TYPE: string = "secure-orange";

/*******************************************************************************
 * Sample Schema Documents                                                     *
 *******************************************************************************/

export const ORANGE_TYPE_SCHEMA = {
    title: "The simple orange configuration",
    description: "The simple orange configuration",
    type: "object",
    properties: {
        large: {
            type: "boolean"
        }
    },
    required: ["large"]
};

export const ORANGE_TYPE_SCHEMA_WITH_CREDENTIALS = {
    title: "The simple orange configuration with a box",
    description: "The simple orange configuration with a box",
    type: "object",
    properties: {
        username: {
            optionDefinition: {
                description: "The username to associate to this profile",
                type: "string",
                name: "user"
            },
            secure: false,
            type: "string"
        },
        password: {
            optionDefinition: {
                description: "The password to associate to this profile",
                type: "string",
                name: "pass"
            },
            secure: true,
            type: "string"
        },
        secureBox: {
            type: "object",
            properties: {
                myPhone: {
                    optionDefinition: {
                        description: "My phone",
                        type: "json",
                        name: "phone"
                    },
                    secure: true,
                    type: "json"
                },
                myCode: {
                    optionDefinition: {
                        description: "My code",
                        type: "number",
                        name: "code"
                    },
                    secure: true,
                    type: "number"
                },
                myPhrase: {
                    optionDefinition: {
                        description: "My phrase",
                        type: "string",
                        name: "phrase"
                    },
                    secure: true,
                    type: "string"
                },
                mySet: {
                    optionDefinition: {
                        description: "My set",
                        type: "array",
                        name: "set"
                    },
                    secure: true,
                    type: "array"
                },
                myFlag: {
                    optionDefinition: {
                        description: "My flag",
                        type: "boolean",
                        name: "flag"
                    },
                    secure: true,
                    type: "boolean"
                },
                myMiniBox: {
                    type: "object",
                    secure: true,
                    properties: {
                        miniMe: {
                            optionDefinition: {
                                description: "Mini-Me",
                                type: "string",
                                name: "minime"
                            },
                            type: "string"
                        }
                    }
                },
                myEmptyMiniBox: {
                    type: "object",
                    secure: true,
                    properties: {
                        emptyMe: {
                            optionDefinition: {
                                description: "Please never provide me as a value",
                                type: "string",
                                name: "dontUseMe"
                            },
                            type: "string"
                        }
                    }
                }
            }
        }
    }
};

export const BLUEBERRY_TYPE_SCHEMA = {
    title: "The simple blueberry configuration",
    description: "The simple blueberry configuration",
    type: "object",
    properties: {
        tart: {
            type: "boolean"
        }
    },
    required: ["tart"]
};

export const MANGO_TYPE_SCHEMA = {
    title: "The simple mango configuration",
    description: "The simple mango configuration",
    type: "object",
    properties: {
        peeled: {
            type: "boolean"
        }
    },
    required: ["peeled"]
};

export const APPLE_TYPE_SCHEMA = {
    title: "The simple apple configuration",
    description: "The simple apple configuration",
    type: "object",
    properties: {
        description: {
            type: "string"
        },
        rotten: {
            type: "boolean"
        },
        age: {
            type: "number"
        }
    },
    required: ["description", "rotten", "age"]
};

export const APPLE_TYPE_SCHEMA_BAN_UNKNOWN = {
    title: "The simple apple configuration",
    description: "The simple apple configuration",
    type: "object",
    properties: {
        description: {
            type: "string"
        },
        rotten: {
            type: "boolean"
        },
        age: {
            type: "number"
        }
    },
    additionalProperties: false,
    required: ["description", "rotten", "age"]
};

export const STRAWBERRY_TYPE_SCHEMA = {
    title: "The simple strawberry configuration",
    description: "The simple strawberry configuration",
    type: "object",
    properties: {
        description: {
            type: "string"
        },
        amount: {
            type: "number"
        }
    },
    required: ["description", "amount"]
};

export const BANANA_TYPE_SCHEMA = {
    title: "The simple banana configuration",
    description: "The simple banana configuration",
    type: "object",
    properties: {
        description: {
            type: "string"
        },
        bundle: {
            type: "boolean"
        }
    },
    required: ["bundle"]
};

export const GRAPE_TYPE_SCHEMA = {
    title: "The simple banana configuration",
    description: "The simple banana configuration",
    type: "object",
    properties: {
        description: {
            type: "string"
        },
        color: {
            type: "string"
        }
    },
    required: ["description", "color"]
};

/*******************************************************************************
 * Sample Configurations                                                       *
 *******************************************************************************/

/**
 * Configuration containing two types, an apple, and a strawberry - the strawberry
 * has a required dependency on an apple.
 */
export const STRAWBERRY_WITH_REQUIRED_APPLE_DEPENDENCY: IProfileTypeConfiguration[] = [
    {
        type: APPLE_PROFILE_TYPE,
        schema: APPLE_TYPE_SCHEMA
    }, {
        type: STRAWBERRY_PROFILE_TYPE,
        schema: STRAWBERRY_TYPE_SCHEMA,
        dependencies: [
            {
                type: APPLE_PROFILE_TYPE,
                required: true
            }
        ]
    }
];

/**
 * Configuration containing two types, an apple, and a strawberry - the strawberry
 * has a required dependency on an apple.
 */
export const STRAWBERRY_WITH_OPTIONAL_APPLE_DEPENDENCY: IProfileTypeConfiguration[] = [
    {
        type: APPLE_PROFILE_TYPE,
        schema: APPLE_TYPE_SCHEMA
    }, {
        type: STRAWBERRY_PROFILE_TYPE,
        schema: STRAWBERRY_TYPE_SCHEMA,
        dependencies: [
            {
                type: APPLE_PROFILE_TYPE,
                required: false
            }
        ]
    }
];

/**
 * Only a simple mango type - used to test failure to load the default
 */
export const ONLY_ORANGE: IProfileTypeConfiguration[] = [
    {
        type: ORANGE_PROFILE_TYPE,
        schema: ORANGE_TYPE_SCHEMA
    }
];

/**
 * Only a simple mango type - used to test failure to load the default
 */
export const ONLY_ORANGE_WITH_CREDENTIALS: IProfileTypeConfiguration[] = [
    {
        type: SECURE_ORANGE_PROFILE_TYPE,
        schema: ORANGE_TYPE_SCHEMA_WITH_CREDENTIALS
    }
];

/**
 * Only a simple mango type - used for testing the meta file
 */
export const ONLY_MANGO: IProfileTypeConfiguration[] = [
    {
        type: MANGO_PROFILE_TYPE,
        schema: MANGO_TYPE_SCHEMA
    }
];

/**
 * Only a simple apple type
 */
export const ONLY_APPLE: IProfileTypeConfiguration[] = [
    {
        type: APPLE_PROFILE_TYPE,
        schema: APPLE_TYPE_SCHEMA
    }
];

/**
 * Only a simple apple type
 */
export const APPLE_BAN_UNKNOWN: IProfileTypeConfiguration[] = [
    {
        type: APPLE_PROFILE_TYPE,
        schema: APPLE_TYPE_SCHEMA_BAN_UNKNOWN
    }
];

/**
 * Only a simple blueberry type - used for testing load default
 */
export const ONLY_BLUEBERRY: IProfileTypeConfiguration[] = [
    {
        type: BLUEBERRY_PROFILE_TYPE,
        schema: BLUEBERRY_TYPE_SCHEMA
    }
];

/**
 * Both apple and strawberry profiles - no dependencies
 */
export const STRAWBERRY_AND_APPLE_NO_DEP: IProfileTypeConfiguration[] = [
    {
        type: APPLE_PROFILE_TYPE,
        schema: APPLE_TYPE_SCHEMA
    },
    {
        type: STRAWBERRY_PROFILE_TYPE,
        schema: STRAWBERRY_TYPE_SCHEMA
    }
];

/**
 * A complex configuration - with types apple, strawberry, banana, and grape, where:
 * The apple profiles require strawberry and banana types
 * The banana profiles require grape
 * The grape profiles require a banana
 * This is normally used to test circular dependencies.
 */
export const APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE_ONE_REQ_DEP: IProfileTypeConfiguration[] = [
    {
        type: APPLE_PROFILE_TYPE,
        schema: APPLE_TYPE_SCHEMA,
        dependencies: [
            {
                type: STRAWBERRY_PROFILE_TYPE,
                required: true
            },
            {
                type: BANANA_PROFILE_TYPE,
                required: true
            }
        ]
    }, {
        type: STRAWBERRY_PROFILE_TYPE,
        schema: STRAWBERRY_TYPE_SCHEMA
    },
    {
        type: BANANA_PROFILE_TYPE,
        schema: BANANA_TYPE_SCHEMA,
        dependencies: [
            {
                type: GRAPE_PROFILE_TYPE,
                required: true
            }
        ]
    },
    {
        type: GRAPE_PROFILE_TYPE,
        schema: GRAPE_TYPE_SCHEMA,
        dependencies: [
            {
                type: BANANA_PROFILE_TYPE,
                required: true
            }
        ]
    }
];

/**
 * A complex configuration - with types apple, strawberry, banana, and grape, where:
 * The apple profiles require strawberry and banana types
 * The banana profiles require grape type
 */
export const APPLE_TWO_REQ_DEP_BANANA_ONE_REQ_DEP_GRAPE: IProfileTypeConfiguration[] = [
    {
        type: APPLE_PROFILE_TYPE,
        schema: APPLE_TYPE_SCHEMA,
        dependencies: [
            {
                type: STRAWBERRY_PROFILE_TYPE,
                required: true
            },
            {
                type: BANANA_PROFILE_TYPE,
                required: true
            }
        ]
    }, {
        type: STRAWBERRY_PROFILE_TYPE,
        schema: STRAWBERRY_TYPE_SCHEMA
    },
    {
        type: BANANA_PROFILE_TYPE,
        schema: BANANA_TYPE_SCHEMA,
        dependencies: [
            {
                type: GRAPE_PROFILE_TYPE,
                required: true
            }
        ]
    },
    {
        type: GRAPE_PROFILE_TYPE,
        schema: GRAPE_TYPE_SCHEMA,
    }
];

/**
 * Apple configuration which also requires bananas and strawberries
 */
export const APPLE_TWO_REQ_DEP_BANANA_AND_STRAWBERRIES: IProfileTypeConfiguration[] = [
    {
        type: APPLE_PROFILE_TYPE,
        schema: APPLE_TYPE_SCHEMA,
        dependencies: [
            {
                type: STRAWBERRY_PROFILE_TYPE,
                required: true
            },
            {
                type: BANANA_PROFILE_TYPE,
                required: true
            }
        ]
    }, {
        type: STRAWBERRY_PROFILE_TYPE,
        schema: STRAWBERRY_TYPE_SCHEMA
    },
    {
        type: BANANA_PROFILE_TYPE,
        schema: BANANA_TYPE_SCHEMA,
    }
];

