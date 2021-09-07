module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "ignorePatterns": [
        "**/*.js",
        "**/*.d.ts"
    ],
    "overrides": [
        {
            "extends": [
                "plugin:jest/recommended"
            ],
            "files": [
                "**/__tests__/**/*.ts"
            ],
            "rules": {
                "@typescript-eslint/no-magic-numbers": "off",
                "jest/expect-expect": ["warn", {
                    "assertFunctionNames": ["expect*", "**.*expect*"]
                }],
                "jest/no-conditional-expect": "off",
                "jest/no-standalone-expect": "off",
                "jest/no-try-expect": "off",
                "unused-imports/no-unused-vars": "off"
            }
        }
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "jest",
        "unused-imports"
    ],
    "rules": {
        "max-len": ["warn", 150],
        "no-console": "error",
        "no-multiple-empty-lines": "warn",
        "no-trailing-spaces": "warn",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/comma-dangle": ["warn", "only-multiline"],
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/indent": ["warn", 4],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-magic-numbers": ["warn", {
            "ignore": [-1, 0, 1, 2],
            "ignoreDefaultValues": true,
            "ignoreReadonlyClassProperties": true
        }],
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/semi": "warn",
        "unused-imports/no-unused-imports": "warn",
        "unused-imports/no-unused-vars": ["warn", {
            "args": "none"
        }]
    }
};