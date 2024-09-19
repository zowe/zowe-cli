module.exports = {
    ...require("../../.eslintrc.js"),
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module",
        "project": [
            "./tsconfig.json",
            "./__tests__/tsconfig.json",
            "./tsconfig-tests.json"
        ]
    }
}