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
                "jest/expect-expect": ["warn", { "assertFunctionNames": ["expect*"] }],
                "jest/no-conditional-expect": "off",
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
        "indent": ["error", 4],
        "max-len": ["error", 150],
        "no-console": "error",
        "no-trailing-spaces": "error",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-var-requires": "off",
        "unused-imports/no-unused-imports": "warn",
        "unused-imports/no-unused-vars": ["warn", { "args": "none" }]
    }
};
