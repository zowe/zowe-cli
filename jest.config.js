const sharedConfig = {
    "globalSetup": "./__tests__/setup.js",
    "globalTeardown": "./__tests__/teardown.js",
    "watchPathIgnorePatterns": [
        ".*jest-stare.*\\.js"
    ],
    "modulePathIgnorePatterns": [
        "__tests__/__snapshots__/",
        ".*/node_modules/.*",
        ".*/lib/.*"
    ],
    "setupFilesAfterEnv": [
        "./__tests__/beforeTests.js"
    ],
    "transformIgnorePatterns": [ "^.+\\.js$", "^.+\\.json$" ],
    "snapshotFormat": {
        "escapeString": true,
        "printBasicPrototype": true
    },
    "workerIdleMemoryLimit": "2GB",
    "transform": {
        "\\.ts$": ["ts-jest", { "disableSourceMapSupport": true }]
    },
    "testRegex": "__tests__.*\\.(spec|test)\\.ts$",
    "moduleFileExtensions": [
        "ts",
        "js"
    ],
    "testEnvironment": "node",
    "testPathIgnorePatterns": [
        "node_modules"
    ]
}

const projectConfig = {
    "projects": [
        {
            "displayName": "Test SDK",
            ...sharedConfig,
            "roots": ["__tests__/__packages__/cli-test-utils", "mocks"],
        },
        {
            "displayName": "Zowe CLI",
            ...sharedConfig,
            "roots": ["packages/cli", "mocks"],
        },
        {
            "displayName": "Imperative",
            ...sharedConfig,
            "roots": ["packages/imperative", "mocks"],
        },
        {
            "displayName": "Core SDK",
            ...sharedConfig,
            "roots": ["packages/core", "mocks"],
        },
        {
            "displayName": "Provisioning SDK",
            ...sharedConfig,
            "roots": ["packages/provisioning", "mocks"],
        },
        {
            "displayName": "Secrets SDK",
            ...sharedConfig,
            "roots": ["packages/secrets", "mocks"],
        },
        {
            "displayName": "Workflows SDK",
            ...sharedConfig,
            "roots": ["packages/workflows", "mocks"],
        },
        {
            "displayName": "z/OS Console SDK",
            ...sharedConfig,
            "roots": ["packages/zosconsole", "mocks"],
        },
        {
            "displayName": "z/OS Files SDK",
            ...sharedConfig,
            "roots": ["packages/zosfiles", "mocks"],
        },
        {
            "displayName": "z/OS Jobs SDK",
            ...sharedConfig,
            "roots": ["packages/zosjobs", "mocks"],
        },
        {
            "displayName": "z/OS Logs SDK",
            ...sharedConfig,
            "roots": ["packages/zoslogs", "mocks"],
        },
        {
            "displayName": "z/OSMF SDK",
            ...sharedConfig,
            "roots": ["packages/zosmf", "mocks"],
        },
        {
            "displayName": "z/OS TSO SDK",
            ...sharedConfig,
            "roots": ["packages/zostso", "mocks"],
        },
        {
            "displayName": "z/OS USS SDK",
            ...sharedConfig,
            "roots": ["packages/zosuss", "mocks"],
        }
    ]
}

module.exports = {
    ...sharedConfig,
    ...projectConfig,
    "reporters": [
        "default",
        ["jest-junit", {
            "outputDirectory": "__tests__/__results__",
            "reportTestSuiteErrors": true
        }],
        ["jest-stare", {
            "resultDir": "__tests__/__results__/jest-stare",
            "coverageLink": "../unit/coverage/lcov-report/index.html"
        }],
        ["github-actions", { "silent": false } ]
    ],
    "coverageReporters": [
        "json",
        "lcov",
        "text",
        "cobertura"
    ],
    "coverageDirectory": "__tests__/__results__/unit/coverage",
    "collectCoverageFrom": [
        "packages/**/*.ts",
        "!**/packages/imperative/web-help/**/*.ts",
        "!**/packages/**/__tests__/**/*.ts",
        "__tests__/__packages__/*.ts",
        "!**/node_modules/**",
        "!**/lib/**"
    ],
    "maxWorkers": "50%",
}
