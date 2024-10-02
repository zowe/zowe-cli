# Usage (Extenders)

## What is `keyring`?

`keyring` is a cross-platform module meant to interact with OS (operating system) credential storage. `keyring` is written in Rust, and uses other Rust libraries to interface with credential storage APIs (application programming interfaces).

## Why switch to `keyring`?

As `node-keytar` is now unmaintained, there was a demand for a replacement that can function identically to the original module.

As `keyring` was modeled after `node-keytar`, the same operations can be performed in credential storage:

- Storing credentials
- Retrieving credentials
- Searching for passwords based on a matching label
- Searching for matching credentials based on a prefix/query
- Deleting credentials

**Currently, there are no breaking changes** between the use of `node-keytar` and `keyring`. This is intended by design.

From a developer's perspective, one can simply update existing extenders or plug-ins to import the keyring module from `@zowe/secrets-for-zowe-sdk` instead of `node-keytar`, allowing for a straightforward transition. All functions previously exported in `node-keytar` will be available in `keyring`. Simply add `@zowe/secrets-for-zowe-sdk` to your project using `npm` or `yarn`.

Importing a function from `keyring` is identical to the `node-keytar` import process:

```ts
// Import all functions under a namespace...
import { keyring } from "@zowe/secrets-for-zowe-sdk";
// Or, use require to import the keyring module.
const { keyring } = require("@zowe/secrets-for-zowe-sdk");
```

After the desired functions are imported, feel free to use them in the same fashion as the `node-keytar` functions. For the examples below, `async/await` keywords are used, but the functions can also be used with `.then/.catch` promise blocks:

```ts
getPassword("TestService", "AccountA")
  .then((pw) => {
    console.log("The password for TestService/AccountA is:", pw);
  })
  .catch((err) => {
    console.error("An error occurred!", err.message);
  });
```

**Examples:**

```ts
// Set a password with a given service and account name
// Password will be stored under <service>/<account>
await keyring.setPassword("TestService", "AccountA", "Apassword");

// Get a password, given a service and account name
await keyring.getPassword("TestService", "AccountA");

// Find credentials based on a matching label
await keyring.findCredentials("TestService");

// Find password that matches a service and account
await keyring.findPassword("TestService/AccountA");

// Delete a credential w/ the provided service and account name
await keyring.deletePassword("TestService", "AccountA");
```

## Webpacking/bundling alongside your project

**Note for Webpack users:** If you do **_not_** want to use the Secrets SDK, but have Imperative modules imported that reference it (such as `ConvertV1Profiles` or `DefaultCredentialManager`), you must define the `@zowe/secrets-for-zowe-sdk` package in the `externals` section of your Webpack config:

```json
"externals": {
    "@zowe/secrets-for-zowe-sdk": "commonjs @zowe/secrets-for-zowe-sdk"
}
```

This will prevent Webpack from trying to dynamically resolve the Secrets SDK during compile time. This does not affect the majority of developers, as Webpack omits any unused Imperative modules during the bundling phase.

---

Some projects leverage a JavaScript bundler, such as Webpack or Vite, to minify and compress their Node.js packages.
While the Secrets SDK does support Webpack, developers who want to bundle the Secrets SDK alongside their package should set up a `prebuilds` folder alongside their package root.

For example, if your package places build output in the `out` folder, your directory structure should look like this:

```
your-pkg/
├── package.json
├── src/
├── out/
│   └── bundle.js
├── prebuilds/
│   └── (node binaries for Secrets SDK)
```

If you are using ESbuild or Webpack, consider using a copy plug-in to copy the `prebuilds` folder from the Secrets SDK _node_modules_ folder:

- ESbuild: [esbuild-copy-static-files](https://www.npmjs.com/package/esbuild-copy-static-files)
- Webpack: [copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin)

Otherwise, use the Node.js script below (**requires Node 16.7.0 and above**). It creates a copy of the `prebuilds` folder containing the required Secrets SDK binaries. Run this script in the same directory as your extension's `package.json`:

```js
const { cpSync } = require("fs");
cpSync(
  "/path/to/node_modules/@zowe/secrets-for-zowe-sdk/prebuilds",
  "prebuilds",
  { force: true, recursive: true }
);
```

**Note:** The first argument for `cpSync` will vary, depending on where the _node_modules_ folder is located in your environment.

We recommend that developers add this logic to a `prepare` script in their `package.json` to guarantee the binaries are up-to-date after installing dependencies.
Save the above script as a JavaScript file (e.g., `scripts/copyKeyringBinaries.js`), and execute the script:

```js
{
    "scripts": {
        "prepare": "node scripts/copyKeyringBinaries.js"
    }
}
```

If you are bundling a VSCode extension, and are using a `.vscodeignore` file, you must allow the prebuilds folder to be packaged in the VSIX.  
Add the following line to your `.vscodeignore` file:

```
!prebuilds/**
```

### Updating imports

Some extenders might import `keytar` directly as a dependency. In these cases, extenders should import the `keyring` module from this package instead.

**Take caution when importing** as the import process is slightly different than `node-keytar`:

Before:

```js
const keytar = require("node-keytar");
// ES6 import:
import * as keytar from "node-keytar";
```

After:

```js
const { keyring } = require("@zowe/secrets-for-zowe-sdk");
// ES6 import:
import { keyring } from "@zowe/secrets-for-zowe-sdk";
```

Notice that the keyring module must be accessed from the dependency imports before use.
To reduce the amount of code that needs updated, users can use an import alias to the phrase "keytar":

```js
const { keyring: keytar } = require("@zowe/secrets-for-zowe-sdk");
// ES6 import:
import { keyring as keytar } from "@zowe/secrets-for-zowe-sdk";

// Existing code, such as the example below, can remain unchanged with this import alias:
keytar.setPassword("Hello", "World", "ExamplePassword");
```
