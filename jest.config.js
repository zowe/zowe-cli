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
    "maxWorkers": "50%",
    "workerIdleMemoryLimit": "2GB",
    "transform": {
        "\\.ts$": ["ts-jest", { "disableSourceMapSupport": true }]
    },
    "testRegex": "__tests__.*\\.(spec|test)\\.ts$",
    "moduleFileExtensions": [
        "ts",
        "js"
    ],
    "testEnvironment": "node"
}

const projectConfig = {
    "projects": [
        {
            "displayName": "Test SDK",
            ...sharedConfig,
            "testPathIgnorePatterns": [
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "Zowe CLI",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/cli/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ],
            "modulePathIgnorePatterns": [
                "__tests__/__snapshots__/",
                ".*/node_modules/.*",
                ".*/lib/.*"
            ]
        },
        {
            "displayName": "Imperative",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/imperative/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "Core SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/core/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "Provisioning SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/provisioning/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "Secrets SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/secrets/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "Workflows SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/workflows/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "z/OS Console SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/zosconsole/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "z/OS Files SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/zosfiles/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "z/OS Jobs SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/zosjobs/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "z/OS Logs SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/zoslogs/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "z/OSMF SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/zosmf/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zostso",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "z/OS TSO SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/zostso/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zosuss",
                "node_modules"
            ]
        },
        {
            "displayName": "z/OS USS SDK",
            ...sharedConfig,
            "collectCoverageFrom": [
                "packages/zosuss/src/**/*.ts",
                "!packages/*/src/**/doc/I*.ts",
                "!packages/cli/src/main.ts"
            ],
            "testPathIgnorePatterns": [
                "<rootDir>/__tests__",
                "<rootDir>/packages/cli",
                "<rootDir>/packages/core",
                "<rootDir>/packages/imperative",
                "<rootDir>/packages/provisioning",
                "<rootDir>/packages/secrets",
                "<rootDir>/packages/workflows",
                "<rootDir>/packages/zosconsole",
                "<rootDir>/packages/zosfiles",
                "<rootDir>/packages/zosjobs",
                "<rootDir>/packages/zoslogs",
                "<rootDir>/packages/zosmf",
                "<rootDir>/packages/zostso",
                "node_modules"
            ]
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
    ]
}
