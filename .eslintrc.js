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
                "@typescript-eslint/no-unused-vars": "off",
                "jest/no-conditional-expect": "off"
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
        "jest"
    ],
    "rules": {
        "indent": ["error", 4],
        "max-len": ["error", 150],
        "no-trailing-spaces": "error",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-unused-vars": ["warn", { "args": "none" }],
        "@typescript-eslint/no-var-requires": "off"
    }
};
