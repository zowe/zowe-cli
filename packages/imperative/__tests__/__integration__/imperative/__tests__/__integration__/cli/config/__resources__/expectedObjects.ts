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

import { IConfig } from "../../../../../../../../src/config";

export const expectedSchemaObject = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $version: "1.0",
    type: "object",
    description: "Zowe configuration",
    properties: {
        profiles: {
            type: "object",
            description: "Mapping of profile names to profile configurations",
            patternProperties: {
                "^\\S*$": {
                    type: "object",
                    description: "Profile configuration object",
                    properties: {
                        type: {
                            description: "Profile type",
                            type: "string",
                            enum: [
                                "secured",
                                "base"
                            ]
                        },
                        properties: {
                            description: "Profile properties object",
                            type: "object"
                        },
                        profiles: {
                            description: "Optional subprofile configurations",
                            type: "object",
                            $ref: "#/properties/profiles"
                        },
                        secure: {
                            description: "Secure property names",
                            type: "array",
                            items: {
                                type: "string"
                            },
                            uniqueItems: true
                        }
                    },
                    allOf: [
                        {
                            if: {
                                properties: {
                                    type: false
                                }
                            },
                            then: {
                                properties: {
                                    properties: {
                                        title: "Missing profile type"
                                    }
                                }
                            }
                        },
                        {
                            if: {
                                properties: {
                                    type: {
                                        const: "secured"
                                    }
                                }
                            },
                            then: {
                                properties: {
                                    properties: {
                                        type: "object",
                                        title: "Test Secured Fields",
                                        description: "Test Secured Fields",
                                        properties: {
                                            info: {
                                                type: "string",
                                                description: "The info to keep in the profile."
                                            },
                                            secret: {
                                                type: "string",
                                                description: "The secret info to keep in the profile."
                                            }
                                        }
                                    },
                                    secure: {
                                        items: {
                                            enum: [
                                                "secret"
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            if: {
                                properties: {
                                    type: {
                                        const: "base"
                                    }
                                }
                            },
                            then: {
                                properties: {
                                    properties: {
                                        type: "object",
                                        title: "Secure Profile",
                                        description: "Secure Profile",
                                        properties: {
                                            info: {
                                                type: "string",
                                                description: "The info to keep in the profile."
                                            },
                                            secret: {
                                                type: "string",
                                                description: "The secret info to keep in the profile."
                                            },
                                            undefined_type: {
                                                type: undefined as any,
                                                description: "The undefined secret info to keep in the profile."
                                            },
                                            host: {
                                                type: "string",
                                                description: "Fruit host"
                                            },
                                            port: {
                                                type: "number",
                                                description: "Fruit port"
                                            },
                                            user: {
                                                type: "string",
                                                description: "Fruit username"
                                            },
                                            password: {
                                                type: "string",
                                                description: "Fruit password"
                                            },
                                            tokenType: {
                                                type: "string",
                                                description: "Fruit token type"
                                            },
                                            tokenValue: {
                                                type: "string",
                                                description: "Fruit token value"
                                            },
                                            certFile: {
                                                type: "existingLocalFile",
                                                description: "Fruit certificate file"
                                            },
                                            certKeyFile: {
                                                type: "existingLocalFile",
                                                description: "Fruit certificate key file"
                                            }
                                        }
                                    },
                                    secure: {
                                        items: {
                                            enum: [
                                                "secret",
                                                "undefined_type",
                                                "user",
                                                "password",
                                                "tokenValue"
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        defaults: {
            type: "object",
            description: "Mapping of profile types to default profile names",
            properties: {
                secured: {
                    description: "Default secured profile",
                    type: "string"
                },
                base: {
                    description: "Default base profile",
                    type: "string"
                }
            }
        },
        autoStore: {
            type: "boolean",
            description: "If true, values you enter when prompted are stored for future use"
        }
    }
};

export const expectedGlobalConfigObject: IConfig = {
    $schema: "./imperative-test-cli.schema.json",
    profiles: {
        secured: {
            type: "secured",
            properties: {
                info: ""
            },
            secure: []
        },
        global_base: {
            type: "base",
            properties: {},
            secure: ["secret", "undefined_type"]
        },
    },
    defaults: {
        secured: "secured",
        base: "global_base"
    },
    autoStore: true
};

export const expectedGlobalUserConfigObject: IConfig = {
    $schema: "./imperative-test-cli.schema.json",
    profiles: {
        secured: {
            type: "secured",
            properties: {},
            secure: []
        },
        global_base: {
            type: "base",
            properties: {},
            secure: ["secret", "undefined_type"]
        },
    },
    defaults: {},
    autoStore: true
};

export const expectedProjectConfigObject: IConfig = {
    $schema: "./imperative-test-cli.schema.json",
    profiles: {
        secured: {
            type: "secured",
            properties: {
                info: ""
            },
            secure: []
        },
        project_base: {
            type: "base",
            properties: {},
            secure: ["secret", "undefined_type"]
        },
    },
    defaults: {
        secured: "secured",
        base: "project_base"
    },
    autoStore: true
};

export const expectedProjectUserConfigObject: IConfig = {
    $schema: "./imperative-test-cli.schema.json",
    profiles: {
        secured: {
            type: "secured",
            properties: {},
            secure: []
        },
        project_base: {
            type: "base",
            properties: {},
            secure: ["secret", "undefined_type"]
        }
    },
    defaults: {},
    autoStore: true
};
