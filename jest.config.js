const sharedConfig = {
    "globalTeardown": "<rootDir>/__tests__/teardown.js",
    "watchPathIgnorePatterns": [
        ".*jest-stare.*\\.js"
    ],
    "modulePathIgnorePatterns": [
        "__tests__/__snapshots__/",
        ".*/node_modules/.*",
        ".*/lib/.*"
    ],
    "setupFilesAfterEnv": [
        "<rootDir>/__tests__/beforeTests.js"
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
            "displayName": "Global Tests",
            ...sharedConfig,
            "roots": ["__tests__", "mocks"],
        },
        {
            "displayName": "Zowe CLI",
            ...sharedConfig,
            "roots": ["packages/cli", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!cli)"]
        },
        {
            "displayName": "Imperative",
            ...sharedConfig,
            "roots": ["packages/imperative", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!imperative)"]
        },
        {
            "displayName": "Core SDK",
            ...sharedConfig,
            "roots": ["packages/core", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!core)"]
        },
        {
            "displayName": "Provisioning SDK",
            ...sharedConfig,
            "roots": ["packages/provisioning", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!provisioning)"]
        },
        {
            "displayName": "Secrets SDK",
            ...sharedConfig,
            "roots": ["packages/secrets", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!secrets)"]
        },
        {
            "displayName": "Workflows SDK",
            ...sharedConfig,
            "roots": ["packages/workflows", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!workflows)"]
        },
        {
            "displayName": "z/OS Console SDK",
            ...sharedConfig,
            "roots": ["packages/zosconsole", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!zosconsole)"]
        },
        {
            "displayName": "z/OS Files SDK",
            ...sharedConfig,
            "roots": ["packages/zosfiles", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!zosfiles)"]
        },
        {
            "displayName": "z/OS Jobs SDK",
            ...sharedConfig,
            "roots": ["packages/zosjobs", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!zosjobs)"]
        },
        {
            "displayName": "z/OS Logs SDK",
            ...sharedConfig,
            "roots": ["packages/zoslogs", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!zoslogs)"]
        },
        {
            "displayName": "z/OSMF SDK",
            ...sharedConfig,
            "roots": ["packages/zosmf", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!zosmf)"]
        },
        {
            "displayName": "z/OS TSO SDK",
            ...sharedConfig,
            "roots": ["packages/zostso", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!zostso)"]
        },
        {
            "displayName": "z/OS USS SDK",
            ...sharedConfig,
            "roots": ["packages/zosuss", "mocks"],
            "coveragePathIgnorePatterns": ["packages/(?!zosuss)"]
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
            "coverageLink": "../unit/coverage/lcov-report/index.html",
            "resultDir": "__tests__/__results__/jest-stare"
        }],
        ["github-actions", { "silent": false } ]
    ],
    "testResultsProcessor": "jest-sonar-reporter",
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
        "!**/__tests__/**/*.ts",
        "!**/node_modules/**",
        "!**/lib/**"
    ],
    "maxWorkers": "67%", // You may need to specify maxWorkers if you run out of RAM
}
