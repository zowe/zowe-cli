# Development Tips

## Contents

 - [Debugging in VS Code](#debugging-in-vs-code)
 - [Using development mode](#using-development-mode)

## Debugging in VS Code

Create a launch configuration like the following. You can have as many launch configurations as you want, each with their own name and set of arguments.

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Check Status",
            "program": "${workspaceFolder}/packages/cli/lib/main.js",
            "args": ["zosmf", "check", "status"],
            "outputCapture" : "std"
        }
    ]
}
```

To debug Jest tests in VS Code, the [Jest Runner](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner) extension may come in handy.

## Using Development Mode

To enable development mode, set the environment variable `NODE_ENV=development` when running Zowe CLI.

The following behaviors will change:
* Default log levels for Imperative and Zowe CLI are DEBUG instead of WARN.
* Web help is always generated when `--help-web` is invoked instead of being cached.
